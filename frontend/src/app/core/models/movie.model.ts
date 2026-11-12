export interface Movie {
  id: number;
  title: string;
  description: string;
  genre: string;
  language: string;
  durationMinutes: number;
  posterUrl: string;
  trailerUrl?: string;
  releaseDate: string;
  rating: number;
  status: 'NOW_SHOWING' | 'COMING_SOON' | 'ARCHIVED';
}
