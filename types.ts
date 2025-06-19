
export interface Bid {
  amount: number;
  bidderName: string; // Simplified, no full user system
  timestamp: number;
}

export interface AuctionItem {
  id: string;
  cardName: string;
  imageUrl: string;
  description: string;
  startingBid: number;
  currentBid: number;
  highestBidder?: string;
  endTime: number; // Timestamp
  bids: Bid[];
  sellerName: string; // Simplified, could be a username or "Anonymous"
  status: 'pending' | 'approved' | 'rejected'; // New: Manages auction approval
}

export interface NewAuctionData {
  cardName: string;
  imageUrl: string;
  description: string;
  startingBid: number;
  auctionDurationHours: number; // Duration in hours
  sellerName: string;
}