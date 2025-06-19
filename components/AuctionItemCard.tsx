
import React, { useState, useEffect, useCallback } from 'react';
import { AuctionItem, Bid } from '../types';
import { DEFAULT_IMAGE_URL } from '../constants';
import { PokemonBallIcon } from './icons/PokemonBallIcon';

interface AuctionItemCardProps {
  item: AuctionItem;
  onPlaceBid?: (auctionId: string, bidAmount: number, bidderName: string) => Promise<boolean>; 
  onApprove?: (auctionId: string) => Promise<void>;
  onReject?: (auctionId: string) => Promise<void>;
}

const formatTimeRemaining = (endTime: number): string => {
  const now = Date.now();
  const timeLeftMs = endTime - now;

  if (timeLeftMs <= 0) {
    return "Subasta Terminada";
  }

  const seconds = Math.floor((timeLeftMs / 1000) % 60);
  const minutes = Math.floor((timeLeftMs / (1000 * 60)) % 60);
  const hours = Math.floor((timeLeftMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));

  let timeString = '';
  if (days > 0) timeString += `${days}d `;
  if (hours > 0 || days > 0) timeString += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `;
  timeString += `${seconds}s`;

  return timeString.trim() || "Termina pronto";
};

const formatEndTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

export const AuctionItemCard: React.FC<AuctionItemCardProps> = ({ item, onPlaceBid, onApprove, onReject }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [bidderName, setBidderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const isApprovedAndActive = item.status === 'approved' && item.endTime > Date.now();
  const [timeRemaining, setTimeRemaining] = useState(
    isApprovedAndActive ? formatTimeRemaining(item.endTime) : (item.status === 'approved' ? "Subasta Terminada" : "N/D")
  );
  const [isAuctionLive, setIsAuctionLive] = useState(isApprovedAndActive);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    const active = item.status === 'approved' && item.endTime > Date.now();
    setIsAuctionLive(active);
    
    if (active) {
      setTimeRemaining(formatTimeRemaining(item.endTime));
      const timerId = setInterval(() => {
        const remaining = formatTimeRemaining(item.endTime);
        setTimeRemaining(remaining);
        if (remaining === "Subasta Terminada") {
          setIsAuctionLive(false);
          clearInterval(timerId);
        }
      }, 1000);
      return () => clearInterval(timerId);
    } else if (item.status === 'approved') {
      setTimeRemaining("Subasta Terminada");
    } else {
      setTimeRemaining("N/D"); 
    }
  }, [item.endTime, item.status]);


  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!onPlaceBid) return;

    if (!isAuctionLive) {
        setError("Esta subasta no está activa o ha terminado.");
        return;
    }
    if (!bidderName.trim()) {
        setError("Por favor, ingresa tu nombre para pujar.");
        return;
    }
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= item.currentBid) {
      setError(`Tu puja debe ser mayor que la puja actual de $${item.currentBid.toFixed(2)}.`);
      return;
    }
    if (amount <= 0) {
      setError(`El monto de la puja debe ser un valor positivo.`);
      return;
    }
    
    setIsProcessingAction(true);
    const success = await onPlaceBid(item.id, amount, bidderName.trim());
    setIsProcessingAction(false);

    if (success) {
      setBidAmount('');
      // Bidder name can be kept or cleared based on preference. Let's clear it for now.
      // setBidderName(''); 
      setError(null); 
    } else {
      if(isAuctionLive) { // Only show specific error if auction was supposed to be biddable
          setError('No se pudo realizar la puja. Podría ser demasiado baja, la subasta acaba de terminar o hubo un problema de red.');
      }
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsProcessingAction(true);
    setError(null);
    try {
      await onApprove(item.id);
    } catch (e) {
      console.error("Error approving auction:", e)
      setError("Error al aprobar la subasta.");
    }
    setIsProcessingAction(false);
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsProcessingAction(true);
    setError(null);
    try {
      await onReject(item.id);
    } catch (e) {
      console.error("Error rejecting auction:", e)
      setError("Error al rechazar la subasta.");
    }
    setIsProcessingAction(false);
  };
  
  const imageUrl = item.imageUrl || `${DEFAULT_IMAGE_URL}${item.id}`;
  const uniqueBidderNameId = `bidderName-${item.id}`;
  const uniqueBidAmountId = `bidAmount-${item.id}`;

  const getStatusDisplay = () => {
    switch(item.status) {
      case 'pending':
        return { text: 'Pendiente de Aprobación', color: 'bg-yellow-500 text-white' };
      case 'approved':
        return isAuctionLive ? { text: 'Activa', color: 'bg-green-500 text-white' } : { text: 'Terminada', color: 'bg-red-500 text-white' };
      case 'rejected':
        return { text: 'Rechazada', color: 'bg-gray-500 text-white' };
      default:
        return { text: 'Desconocido', color: 'bg-gray-400 text-white'};
    }
  };
  const statusDisplay = getStatusDisplay();

  return (
    <article aria-labelledby={`cardName-${item.id}`} className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-500 hover:shadow-2xl transition-shadow duration-300 flex flex-col h-full">
      <div className="relative h-72 sm:h-80 md:h-96">
        <img 
            src={imageUrl} 
            alt={`Imagen de ${item.cardName}`} 
            className="w-full h-full object-contain p-2 bg-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; 
              target.src = `https://picsum.photos/300/420?random=${item.id}&grayscale&blur=2`; 
            }}
        />
        <div 
            className={`absolute top-2 right-2 px-3 py-1 text-sm font-semibold rounded-full ${statusDisplay.color}`}
            aria-live="polite"
        >
            {statusDisplay.text}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 id={`cardName-${item.id}`} className="text-2xl font-bold text-gray-800 mb-2 truncate" title={item.cardName}>{item.cardName}</h3>
        <p className="text-gray-600 text-sm mb-3 h-12 overflow-y-auto" title={item.description}>
            {item.description || "No se proporcionó descripción."}
        </p>
        
        <div className="mb-4 space-y-2">
            <p className="text-sm text-gray-500">Vendedor: <span className="font-semibold text-gray-700">{item.sellerName}</span></p>
            <p className="text-sm text-gray-500">
                {item.status === 'pending' ? 'Puja Inicial: ' : 'Puja Actual: '} 
                <span className={`font-bold text-xl ${item.status === 'approved' && isAuctionLive ? 'text-green-600' : 'text-gray-700'}`}>
                    ${(item.status === 'pending' ? item.startingBid : item.currentBid).toFixed(2)}
                </span>
            </p>
            {item.status === 'approved' && item.highestBidder && (
                <p className="text-sm text-gray-500">
                    Mayor Postor: <span className="font-semibold text-blue-600">{item.highestBidder}</span>
                </p>
            )}
             <p className="text-sm text-gray-500">
                {item.status === 'pending' ? 'Finalización Prevista: ' : 'Tiempo Restante: '}
                <span className={`font-semibold ${isAuctionLive ? 'text-orange-600' : (item.status === 'approved' ? 'text-red-600' : 'text-gray-700')}`}>
                    {item.status === 'pending' ? formatEndTime(item.endTime) : timeRemaining}
                </span>
            </p>
            {(item.status === 'approved' || item.status === 'rejected') && 
              <p className="text-sm text-gray-500">Total de Pujas: <span className="font-semibold text-gray-700">{item.bids.length}</span></p>
            }
        </div>

        <div className="mt-auto">
            {item.status === 'pending' && onApprove && onReject && (
              <div className="space-y-2 pt-2">
                  <p className="text-xs text-center text-gray-500 mb-2">Acciones de Administrador:</p>
                  {error && <p role="alert" aria-live="assertive" className="text-xs text-red-600 mb-2 text-center">{error}</p>}
                  <button
                    onClick={handleApprove}
                    disabled={isProcessingAction}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingAction ? 'Procesando...' : 'Aprobar Subasta'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessingAction}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingAction ? 'Procesando...' : 'Rechazar Subasta'}
                  </button>
              </div>
            )}

            {item.status === 'approved' && isAuctionLive && onPlaceBid && (
              <form onSubmit={handleBidSubmit} className="space-y-3" aria-label={`Realizar puja por ${item.cardName}`}>
                  <div>
                  <label htmlFor={uniqueBidderNameId} className="block text-xs font-medium text-gray-700">Tu Nombre</label>
                  <input
                      type="text"
                      id={uniqueBidderNameId}
                      value={bidderName}
                      onChange={(e) => setBidderName(e.target.value)}
                      placeholder="Ingresa tu nombre"
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                      aria-required="true"
                      disabled={isProcessingAction}
                  />
                  </div>
                  <div>
                  <label htmlFor={uniqueBidAmountId} className="block text-xs font-medium text-gray-700">Tu Puja ($)</label>
                  <input
                      type="number"
                      id={uniqueBidAmountId}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`> $${item.currentBid.toFixed(2)}`}
                      min={(item.currentBid + 0.01).toFixed(2)}
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                      aria-required="true"
                      disabled={isProcessingAction}
                  />
                  </div>
                  {error && <p role="alert" aria-live="assertive" className="text-xs text-red-600">{error}</p>}
                  <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center justify-center space-x-2 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessingAction}
                  >
                  {isProcessingAction ? (
                      <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                      </>
                  ) : (
                      <>
                          <PokemonBallIcon className="w-5 h-5" />
                          <span>Realizar Puja</span>
                      </>
                  )}
                  </button>
              </form>
            )}
            
            {item.status === 'approved' && !isAuctionLive && (
              <div className="text-center p-3 bg-gray-200 rounded-md">
                  <p className="font-semibold text-red-700">La Subasta Ha Terminado</p>
                  {item.highestBidder ? (
                      <p className="text-sm text-gray-700">Ganada por <span className="font-bold">{item.highestBidder}</span> con <span className="font-bold">${item.currentBid.toFixed(2)}</span></p>
                  ) : (
                      <p className="text-sm text-gray-600">No se realizaron pujas o la subasta terminó antes de las pujas.</p>
                  )}
              </div>
            )}

            {item.status === 'rejected' && (
                 <div className="text-center p-3 bg-gray-200 rounded-md">
                    <p className="font-semibold text-gray-700">Subasta Rechazada</p>
                    <p className="text-sm text-gray-500">Esta subasta no fue aprobada.</p>
                </div>
            )}


            {item.bids.length > 0 && item.status !== 'pending' && (
            <details className="mt-4">
                <summary className="text-sm text-blue-600 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 rounded">Ver Historial de Pujas ({item.bids.length})</summary>
                <ul className="mt-2 space-y-1 text-xs max-h-24 overflow-y-auto bg-gray-50 p-2 rounded-md border" aria-label="Historial de pujas">
                {item.bids.slice().sort((a,b) => b.timestamp - a.timestamp).map((bid, index) => (
                    <li key={index} className="text-gray-700">
                    <span className="font-semibold">${bid.amount.toFixed(2)}</span> por {bid.bidderName} 
                    <span className="text-gray-500 text-xs"> ({new Date(bid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                    </li>
                ))}
                </ul>
            </details>
            )}
        </div>
      </div>
    </article>
  );
};