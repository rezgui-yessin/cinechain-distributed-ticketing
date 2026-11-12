import { Ticket } from './ticket.model';

export interface Booking {
  id: number;
  bookingReference: string;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  screeningId?: number;
  movieTitle?: string;
  screeningTime?: string;
  cinemaName?: string;
  hallName?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | string;
  totalAmount: number;
  createdAt: string;
  tickets?: Ticket[];
}

export interface BookingRequest {
  screeningId: number;
  seatIds: number[];
  holderName: string;
}
