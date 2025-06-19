import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CreateAuctionForm } from './components/CreateAuctionForm';
import { AuctionList } from './components/AuctionList';
import { AdminControls } from './components/AdminControls'; 
import { LoginModal } from './components/LoginModal';
import { AuctionItem, NewAuctionData, Bid } from './types';
import { db, auth, ADMIN_UID } from './firebase'; 
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  query, 
  orderBy,
  where, 
  getDoc
} from 'firebase/firestore';
// Firebase Storage functions are no longer needed here
import { 
  type User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

const App: React.FC = () => {
  const [approvedAuctions, setApprovedAuctions] = useState<AuctionItem[]>([]);
  const [pendingAuctions, setPendingAuctions] = useState<AuctionItem[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoadingApproved, setIsLoadingApproved] = useState(true);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAdmin(user?.uid === ADMIN_UID);
      setIsAuthLoading(false);
      if(user && user.uid === ADMIN_UID) { 
        setShowLoginModal(false);
        setLoginError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsLoadingApproved(true);
    setError(null);
    const auctionsCollectionRef = collection(db, "auctions");
    const q = query(auctionsCollectionRef, where("status", "==", "approved"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const auctionsData: AuctionItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        auctionsData.push({ 
            id: doc.id, 
            ...data,
            endTime: data.endTime?.toMillis ? data.endTime.toMillis() : (data.endTime || 0),
            bids: data.bids || [],
            currentBid: data.currentBid || data.startingBid || 0,
            startingBid: data.startingBid || 0,
            status: data.status || 'pending', 
         } as AuctionItem);
      });
      setApprovedAuctions(auctionsData);
      setIsLoadingApproved(false);
    }, (err) => {
      console.error("Error fetching approved auctions: ", err);
      setError("Error al cargar las subastas aprobadas.");
      setIsLoadingApproved(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setPendingAuctions([]); 
      return;
    }

    setIsLoadingPending(true);
    const pendingAuctionsRef = collection(db, "auctions");
    const q = query(pendingAuctionsRef, where("status", "==", "pending"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const auctionsData: AuctionItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        auctionsData.push({
             id: doc.id,
             ...data,
             endTime: data.endTime?.toMillis ? data.endTime.toMillis() : (data.endTime || 0),
             bids: data.bids || [],
             currentBid: data.currentBid || data.startingBid || 0,
             startingBid: data.startingBid || 0,
             status: 'pending',
        } as AuctionItem);
      });
      setPendingAuctions(auctionsData);
      setIsLoadingPending(false);
    }, (err) => {
      console.error("Error fetching pending auctions: ", err);
      setError("Error al cargar las subastas pendientes para el administrador.");
      setIsLoadingPending(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);


  const sortedApprovedAuctions = React.useMemo(() => {
    return [...approvedAuctions].sort((a, b) => {
      const aActive = a.endTime > Date.now() && a.status === 'approved';
      const bActive = b.endTime > Date.now() && b.status === 'approved';
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      if (aActive && bActive) return a.endTime - b.endTime; 
      return b.endTime - a.endTime; 
    });
  }, [approvedAuctions]);


  const handleAddAuction = useCallback(async (auctionData: NewAuctionData) => {
    setError(null);
    
    try {
      const newAuctionDocData = {
        cardName: auctionData.cardName,
        imageUrl: auctionData.imageUrl || '', // Use the base64 Data URL or empty string
        description: auctionData.description,
        startingBid: auctionData.startingBid,
        currentBid: auctionData.startingBid,
        endTime: auctionData.endTime, // Use the timestamp provided by the form
        bids: [],
        sellerName: auctionData.sellerName,
        status: 'pending', 
      };

      await addDoc(collection(db, "auctions"), newAuctionDocData);
      setShowCreateForm(false); 
    } catch (err) {
      console.error("Error adding auction to Firestore: ", err);
      setError("Error al crear la subasta. Por favor, inténtalo de nuevo.");
      throw err; 
    }
  }, []);

  const handlePlaceBid = useCallback(async (auctionId: string, bidAmount: number, bidderName: string): Promise<boolean> => {
    setError(null); 
    const auctionRef = doc(db, "auctions", auctionId);
    try {
        const auctionDocSnapshot = await getDoc(auctionRef);
        if (!auctionDocSnapshot.exists()) {
            console.error("Auction document not found for bidding!");
            setError("No se encontró la subasta para realizar la puja.");
            return false;
        }
        const currentAuctionData = auctionDocSnapshot.data() as AuctionItem;

        if (currentAuctionData.status !== 'approved' || currentAuctionData.endTime <= Date.now()) {
            console.warn(`Attempted to bid on non-approved or ended auction: ${auctionId}`);
            return false; 
        }
        if (bidAmount <= currentAuctionData.currentBid) {
             console.warn(`Bid too low for auction: ${auctionId}.`);
            return false;
        }
        const newBid: Bid = { amount: bidAmount, bidderName, timestamp: Date.now() };
        await updateDoc(auctionRef, {
            currentBid: bidAmount,
            highestBidder: bidderName,
            bids: arrayUnion(newBid)
        });
        return true;
    } catch (err) {
        console.error("Error placing bid in Firestore: ", err);
        setError("Error al realizar la puja. Inténtalo de nuevo.");
        return false;
    }
  }, []);

  const handleApproveAuction = useCallback(async (auctionId: string) => {
    setError(null);
    const auctionRef = doc(db, "auctions", auctionId);
    try {
      await updateDoc(auctionRef, { status: "approved" });
    } catch (err) {
      console.error("Error approving auction: ", err);
      setError("Error al aprobar la subasta.");
      throw err; 
    }
  }, []);

  const handleRejectAuction = useCallback(async (auctionId: string) => {
    setError(null);
    const auctionRef = doc(db, "auctions", auctionId);
    try {
      await updateDoc(auctionRef, { status: "rejected" });
    } catch (err) {
      console.error("Error rejecting auction: ", err);
      setError("Error al rechazar la subasta.");
      throw err; 
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setLoginError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.uid !== ADMIN_UID) {
        setLoginError("Acceso denegado. Este usuario no es un administrador.");
        await signOut(auth); 
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setLoginError("Correo electrónico o contraseña incorrectos.");
      } else {
        setLoginError("Error al iniciar sesión. Inténtalo de nuevo.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      setError("Error al cerrar sesión.");
    }
  };


  if (isAuthLoading) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div role="status" aria-label="Cargando aplicación..." className="flex flex-col items-center space-y-2">
                <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xl text-gray-700">Cargando...</span>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header 
        currentUser={currentUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onOpenLoginModal={() => setShowLoginModal(true)}
      />
      <main className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow">
        {isAdmin && (
          <AdminControls
            pendingAuctions={pendingAuctions}
            onApproveAuction={handleApproveAuction}
            onRejectAuction={handleRejectAuction}
            isLoadingPending={isLoadingPending}
          />
        )}

        <div className="text-center mb-8">
            <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                aria-expanded={showCreateForm}
                aria-controls="create-auction-form-section"
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 text-lg"
            >
                {showCreateForm ? 'Cancelar Creación de Subasta' : '¡Ofrece una Carta Pokémon!'}
            </button>
        </div>

        {showCreateForm && (
          <section id="create-auction-form-section" className="mb-10" aria-label="Formulario para Crear Nueva Subasta">
            <CreateAuctionForm onAddAuction={handleAddAuction} />
          </section>
        )}
        
        {isLoadingApproved && (
            <div className="text-center py-10">
                <div role="status" aria-label="Cargando subastas..." className="flex justify-center items-center space-x-2">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xl text-gray-700">Cargando Subastas...</span>
                </div>
            </div>
        )}

        {!isLoadingApproved && error && (
          <div className="text-center py-10 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!isLoadingApproved && !error && (
          <AuctionList auctions={sortedApprovedAuctions} onPlaceBid={handlePlaceBid} />
        )}
      </main>
      <Footer />
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => {
            setShowLoginModal(false);
            setLoginError(null);
        }}
        onLogin={handleLogin}
        loginError={loginError}
      />
    </div>
  );
};

export default App;