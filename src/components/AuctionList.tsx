
import React from 'react';
import { AuctionItem } from '../../types';
import { AuctionItemCard } from './AuctionItemCard';

interface AuctionListProps {
  auctions: AuctionItem[];
  onPlaceBid: (auctionId: string, bidAmount: number, bidderName: string) => Promise<boolean>;
}

export const AuctionList: React.FC<AuctionListProps> = ({ auctions, onPlaceBid }) => {
  if (auctions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-gray-500">No hay subastas activas en este momento.</p>
        <p className="text-gray-400">¿Por qué no creas una?</p>
      </div>
    );
  }

  return (
    <div>
        <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b-2 border-blue-500 pb-2">Subastas Actuales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {auctions.map(item => (
            <AuctionItemCard
             key={item.id} item={item} onPlaceBid={onPlaceBid} />
        ))}
        </div>
    </div>
  );
};