export interface Screening {
  id: number;
  startTime: string;
  endTime: string;
  price: number;
  movieId: number;
  movieTitle?: string;
  moviePosterUrl?: string;
  hallId: number;
  hallName?: string;
  cinemaId: number;
  cinemaName?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  availableSeats?: number;
  totalSeats?: number;
}
