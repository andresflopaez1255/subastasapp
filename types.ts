export interface Bid {
  amount: number;
  bidderName: string; // Simplified, no full user system
  timestamp: number;
}

export interface AuctionItem {
  id: string;
  cardName: string;
  imageUrl: string; // This will store the base64 Data URL or be empty for default
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
  imageUrl?: string; // Will hold the base64 Data URL, or be undefined/empty
  description: string;
  startingBid: number;
  endTime: number; // Timestamp for when the auction ends
  sellerName: string;
}