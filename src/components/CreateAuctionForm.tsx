import React, { useState } from 'react';
import { NewAuctionData } from '../../types';
import imageCompression from 'browser-image-compression';

interface CreateAuctionFormProps {
  onAddAuction: (auctionData: NewAuctionData) => Promise<void>;
}

const MAX_IMAGE_SIZE_MB = 1; // Max original image size before compression
const COMPRESSION_TARGET_SIZE_MB = 0.2; // Target size after compression (approx 200KB)
const MAX_AUCTION_DAYS = 30; // Maximum auction duration in days

// Helper to get a default end time (e.g., 24 hours from now) in YYYY-MM-DDTHH:mm format
const getDefaultEndTime = () => {
  const now = new Date();
  now.setDate(now.getDate() + 1); // Add 1 day
  // Format to YYYY-MM-DDTHH:MM, ensuring two digits for month, day, hour, minute
  const year = now.getFullYear();
  const month = (`0${now.getMonth() + 1}`).slice(-2);
  const day = (`0${now.getDate()}`).slice(-2);
  const hours = (`0${now.getHours()}`).slice(-2);
  const minutes = (`0${now.getMinutes()}`).slice(-2);
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const CreateAuctionForm: React.FC<CreateAuctionFormProps> = ({ onAddAuction }) => {
  const [cardName, setCardName] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [endTime, setEndTime] = useState<string>(getDefaultEndTime()); // State for datetime-local input
  const [sellerName, setSellerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageProcessingMessage, setImageProcessingMessage] = useState<string | null>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setImageProcessingMessage(null);
    setImageBase64(null);
    const file = event.target.files?.[0];

    if (file) {
      if (file.size / 1024 / 1024 > MAX_IMAGE_SIZE_MB) {
        setError(`La imagen es demasiado grande (máx ${MAX_IMAGE_SIZE_MB}MB). Por favor, elige una más pequeña.`);
        event.target.value = '';
        return;
      }
      
      setImageProcessingMessage("Procesando imagen...");
      try {
        const options = {
          maxSizeMB: COMPRESSION_TARGET_SIZE_MB,
          maxWidthOrHeight: 1024, 
          useWebWorker: true,
          onProgress: (p: number) => setImageProcessingMessage(`Comprimiendo imagen... ${p.toFixed(0)}%`)
        };
        const compressedFile = await imageCompression(file, options);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageBase64(reader.result as string);
          setImageProcessingMessage("Imagen lista.");
        };
        reader.onerror = () => {
          console.error('Error leyendo el archivo comprimido.');
          setError('Error al procesar la imagen después de la compresión.');
          setImageProcessingMessage(null);
          event.target.value = ''; 
        };
        reader.readAsDataURL(compressedFile);

      } catch (compressionError) {
        console.error('Error comprimiendo la imagen:', compressionError);
        setError('Error al procesar la imagen. Intenta con otra imagen o una más pequeña.');
        setImageProcessingMessage(null);
        event.target.value = ''; 
      }
    } else {
      setImageProcessingMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!cardName || !startingBid || !endTime || !sellerName) {
      setError('Por favor, completa todos los campos obligatorios: Nombre del Vendedor, Nombre de la Carta, Puja Inicial y Fecha/Hora de Finalización.');
      return;
    }

    const bid = parseFloat(startingBid);
    const selectedEndTime = new Date(endTime).getTime(); // Convert datetime-local string to timestamp

    if (isNaN(bid) || bid <= 0) {
      setError('La puja inicial debe ser un número positivo.');
      return;
    }

    if (isNaN(selectedEndTime) || selectedEndTime <= Date.now()) {
      setError('La fecha y hora de finalización deben ser en el futuro.');
      return;
    }
    
    const maxFutureTime = Date.now() + MAX_AUCTION_DAYS * 24 * 60 * 60 * 1000;
    if (selectedEndTime > maxFutureTime) {
      setError(`La fecha de finalización no puede ser mayor a ${MAX_AUCTION_DAYS} días desde ahora.`);
      return;
    }


    setIsSubmitting(true);
    try {
      await onAddAuction({
        cardName,
        imageUrl: imageBase64 || undefined,
        description,
        startingBid: bid,
        endTime: selectedEndTime, // Pass the timestamp
        sellerName
      });
      setSuccessMessage('¡Subasta enviada con éxito! Ahora está pendiente de aprobación por un administrador.');
      // Reset form
      setCardName('');
      setImageBase64(null);
      setDescription('');
      setStartingBid('');
      setEndTime(getDefaultEndTime());
      setSellerName('');
      setImageProcessingMessage(null);
      const fileInput = document.getElementById('imageFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

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
          <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">Imagen de la Carta (Opcional, máx {MAX_IMAGE_SIZE_MB}MB)</label>
          <input
            type="file"
            id="imageFile"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageChange}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
            disabled={isSubmitting}
            aria-describedby="imageFile-description"
          />
          {imageProcessingMessage && <p className="text-xs text-blue-600 mt-1">{imageProcessingMessage}</p>}
          {imageBase64 && (
            <img src={imageBase64} alt="Vista previa de la carta" className="image-preview" />
          )}
           <p className="text-xs text-gray-500 mt-1" id="imageFile-description">Si se deja en blanco o no se elige archivo, se usará una imagen aleatoria. La imagen se comprimirá antes de guardarse.</p>
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
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora de Finalización <span className="text-red-500">*</span></label>
                <input
                    type="datetime-local"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
                    required
                    aria-required="true"
                    aria-describedby="datetime-help"
                    disabled={isSubmitting}
                    min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} // Min 1 hour from now
                />
                <p id="datetime-help" className="text-xs text-gray-500 mt-1">Mínimo 1 hora desde ahora, máximo {MAX_AUCTION_DAYS} días.</p>
            </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !!imageProcessingMessage && imageProcessingMessage.includes("Comprimiendo")}
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