import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfkKdArJkNVbEePdh5LXbbPXRYeh-LDXU",
  authDomain: "subastas-shinsei.firebaseapp.com",
  projectId: "subastas-shinsei",
  storageBucket: "subastas-shinsei.appspot.com", 
  messagingSenderId: "834761225537",
  appId: "1:834761225537:web:8c355fcf06b0af48701dc0",
  measurementId: "G-QX3P2K47QV"
};

// !!! IMPORTANTE: REEMPLAZA ESTE VALOR CON EL UID REAL DE TU USUARIO ADMINISTRADOR DE FIREBASE !!!
export const ADMIN_UID = 'CYvX9qzznjaj20LGstmmRJbKYcW2';

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Get default app if already initialized
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

// Initialize Firebase Analytics
let analytics: Analytics | undefined = undefined;

if (typeof window !== 'undefined') {
  isSupported().then(isSupportedValue => {
    if (isSupportedValue) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics inicializado con éxito.");
    } else {
      console.log("Firebase Analytics no es compatible en este entorno (isSupported devolvió falso).");
    }
  }).catch(error => {
    console.error("Error durante la comprobación de compatibilidad o inicialización de Firebase Analytics: ", error);
  });
} else {
  console.log("Firebase Analytics no inicializado (no está en un entorno de navegador).");
}

export { db, auth, analytics };