export interface Ticket {
  id: number;
  bookingId: number;
  bookingReference?: string;
  seatId: number;
  rowLabel: string;
  seatNumber: number;
  seatType: string;
  holderName: string;
  qrCode?: string;
  qrCodeData: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED';
  validatedAt?: string;
  movieTitle?: string;
  screeningTime?: string;
  cinemaName?: string;
  hallName?: string;
  price: number;
}
