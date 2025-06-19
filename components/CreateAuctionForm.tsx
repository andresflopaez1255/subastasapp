
import React, { useState } from 'react';
import { NewAuctionData } from '../types';

interface CreateAuctionFormProps {
  onAddAuction: (auctionData: NewAuctionData) => Promise<void>;
}

export const CreateAuctionForm: React.FC<CreateAuctionFormProps> = ({ onAddAuction }) => {
  const [cardName, setCardName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [auctionDurationHours, setAuctionDurationHours] = useState('24'); // Default 24 hours
  const [sellerName, setSellerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!cardName || !startingBid || !auctionDurationHours || !sellerName) {
      setError('Por favor, completa todos los campos obligatorios: Nombre de la Carta, Puja Inicial, Duración y Nombre del Vendedor.');
      return;
    }

    const bid = parseFloat(startingBid);
    const duration = parseInt(auctionDurationHours, 10);

    if (isNaN(bid) || bid <= 0) {
      setError('La puja inicial debe ser un número positivo.');
      return;
    }
    if (isNaN(duration) || duration <= 0) {
      setError('La duración de la subasta debe ser un número positivo de horas.');
      return;
    }
     if (duration > 720) { // Max 30 days
      setError('La duración de la subasta no puede exceder las 720 horas (30 días).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddAuction({
        cardName,
        imageUrl,
        description,
        startingBid: bid,
        auctionDurationHours: duration,
        sellerName
      });
      setSuccessMessage('¡Subasta enviada con éxito! Ahora está pendiente de aprobación por un administrador.');
      // Reset form
      setCardName('');
      setImageUrl('');
      setDescription('');
      setStartingBid('');
      setAuctionDurationHours('24');
      setSellerName('');
    } catch (err) {
      console.error("Error submitting auction:", err);
      setError('Error al enviar la subasta. Por favor, revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl mb-10 border border-yellow-400">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-yellow-400 pb-2">Crear Nueva Subasta de Carta Pokémon</h2>
      {error && <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {successMessage && <div role="alert" aria-live="polite" className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{successMessage}</div>}
      <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formulario para crear nueva subasta">
        <div>
          <label htmlFor="sellerName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Vendedor <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="sellerName"
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
            placeholder="ej., AshK"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
            required
            aria-required="true"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Carta Pokémon <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="cardName"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="ej., Charizard VMAX"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
            required
            aria-required="true"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">URL de la Imagen (Opcional)</label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://ejemplo.com/charizard.png"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
            disabled={isSubmitting}
            aria-describedby="imageUrl-description"
          />
           <p className="text-xs text-gray-500 mt-1" id="imageUrl-description">Si se deja en blanco, se usará una imagen aleatoria.</p>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="ej., En perfecto estado, del set Destinos Brillantes."
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
            aria-describedby="description-help"
            disabled={isSubmitting}
          ></textarea>
          <p id="description-help" className="text-xs text-gray-500 mt-1">Proporciona detalles como el estado de la carta, set, rareza, etc.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="startingBid" className="block text-sm font-medium text-gray-700 mb-1">Puja Inicial ($) <span className="text-red-500">*</span></label>
                <input
                    type="number"
                    id="startingBid"
                    value={startingBid}
                    onChange={(e) => setStartingBid(e.target.value)}
                    placeholder="ej., 50"
                    min="0.01"
                    step="0.01"
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
                    required
                    aria-required="true"
                    disabled={isSubmitting}
                />
            </div>
            <div>
                <label htmlFor="auctionDurationHours" className="block text-sm font-medium text-gray-700 mb-1">Duración de la Subasta (Horas) <span className="text-red-500">*</span></label>
                <input
                    type="number"
                    id="auctionDurationHours"
                    value={auctionDurationHours}
                    onChange={(e) => setAuctionDurationHours(e.target.value)}
                    placeholder="ej., 24"
                    min="1"
                    max="720" // Max 30 days
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
                    required
                    aria-required="true"
                    aria-describedby="duration-help"
                    disabled={isSubmitting}
                />
                <p id="duration-help" className="text-xs text-gray-500 mt-1">Mínimo 1 hora, máximo 720 horas (30 días).</p>
            </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
             <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
            </div>
          ) : 'Iniciar Subasta'}
        </button>
      </form>
    </div>
  );
};