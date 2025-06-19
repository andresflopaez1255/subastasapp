import React from 'react';
import { AuctionItem } from '../types';
import { AuctionItemCard } from './AuctionItemCard';

interface AdminControlsProps {
  pendingAuctions: AuctionItem[];
  onApproveAuction: (auctionId: string) => Promise<void>;
  onRejectAuction: (auctionId: string) => Promise<void>;
  isLoadingPending: boolean;
}

export const AdminControls: React.FC<AdminControlsProps> = ({
  pendingAuctions,
  onApproveAuction,
  onRejectAuction,
  isLoadingPending,
}) => {
  return (
    <div className="my-8 p-4 bg-gray-200 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Panel de Administrador</h2>
        {/* El botón de toggle ya no es necesario aquí, la visibilidad la controla App.tsx */}
      </div>

      <section aria-labelledby="pending-auctions-heading">
        <h3 id="pending-auctions-heading" className="text-xl font-bold mb-4 text-gray-800 border-b border-gray-400 pb-2">
          Subastas Pendientes de Aprobación
        </h3>
        {isLoadingPending && (
          <div className="text-center py-5" role="status" aria-live="polite">
            <div className="flex justify-center items-center space-x-2">
                <svg className="animate-spin h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Cargando subastas pendientes...</p>
            </div>
          </div>
        )}
        {!isLoadingPending && pendingAuctions.length === 0 && (
          <div className="text-center py-5">
            <p className="text-gray-500">No hay subastas pendientes de aprobación actualmente.</p>
          </div>
        )}
        {!isLoadingPending && pendingAuctions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingAuctions.map(item => (
              <AuctionItemCard
                key={item.id}
                item={item}
                onApprove={onApproveAuction}
                onReject={onRejectAuction}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};