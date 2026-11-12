export interface Cinema {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  imageUrl?: string;
  hallCount?: number;
}

export interface Hall {
  id: number;
  name: string;
  totalCapacity: number;
  cinemaId: number;
  cinemaName?: string;
}

export interface Seat {
  id: number;
  rowLabel: string;
  seatNumber: number;
  seatType: 'STANDARD' | 'PREMIUM' | 'VIP';
  hallId: number;
  available?: boolean;
}
