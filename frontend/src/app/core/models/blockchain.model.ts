export interface BlockchainTransaction {
  id: number;
  transactionHash: string;
  ticketId?: number;
  bookingId?: number;
  type: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  blockNumber: number;
  gasUsed: number;
  data?: string;
  createdAt: string;
  confirmedAt?: string;
}
