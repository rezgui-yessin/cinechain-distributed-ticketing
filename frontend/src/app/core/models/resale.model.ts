export interface ResaleListing {
  id: number;
  ticketId: number;
  bookingReference: string;
  sellerId: number;
  sellerName: string;
  buyerId?: number;
  buyerName?: string;
  originalPrice: number;
  resalePrice: number;
  discountPercentage: number;
  status: 'AVAILABLE' | 'SOLD' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  soldAt?: string;

  // Screening metadata
  movieId: number;
  movieTitle: string;
  moviePosterUrl?: string;
  genre?: string;
  screeningId: number;
  screeningStartTime: string;
  screeningEndTime?: string;
  cinemaName: string;
  hallName: string;
  seatInfo: string;
  seatType: string;
}

export interface ResaleCreateRequest {
  ticketId: number;
  resalePrice: number;
  notes?: string;
}

export interface ResaleBuyRequest {
  newHolderName: string;
}

export interface TicketNftStub {
  id: number;
  ticketId: number;
  tokenId: string;
  ownerId: number;
  ownerName: string;
  movieTitle: string;
  cinemaName: string;
  hallName: string;
  seatInfo: string;
  experienceTier: string;
  rarityScore: string;
  posterArtworkUrl?: string;
  badgeUrl?: string;
  metadataUri: string;
  mintTxHash: string;
  mintedAt: string;
}
