import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { MovieService } from '../../../../core/services/movie.service';
import { ScreeningService } from '../../../../core/services/screening.service';
import { Movie } from '../../../../core/models/movie.model';
import { Screening } from '../../../../core/models/screening.model';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './movie-detail.component.html'
})
export class MovieDetailComponent implements OnInit {
  movieId!: number;
  movie: Movie | null = null;
  screenings: Screening[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private screeningService: ScreeningService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.movieId = +idParam;
      this.loadMovieDetails();
      this.loadScreenings();
    }
  }

  loadMovieDetails(): void {
    this.movieService.getMovie(this.movieId).subscribe({
      next: (m) => {
        this.movie = m;
        this.loading = false;
      },
      error: () => {
        // Fallback movie
        this.movie = {
          id: this.movieId,
          title: 'Dune: Part Two',
          description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
          genre: 'Sci-Fi / Adventure / Drama',
          language: 'English (Atmos 7.1)',
          durationMinutes: 166,
          posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
          trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
          releaseDate: '2024-03-01',
          rating: 8.9,
          status: 'NOW_SHOWING'
        };
        this.loading = false;
      }
    });
  }

  loadScreenings(): void {
    this.screeningService.getScreenings(this.movieId).subscribe({
      next: (res) => {
        this.screenings = res.content || res || [];
      },
      error: () => {
        this.screenings = [
          {
            id: 101,
            startTime: '2026-11-15T14:30:00',
            endTime: '2026-11-15T17:15:00',
            price: 15.50,
            movieId: this.movieId,
            movieTitle: 'Dune: Part Two',
            hallId: 1,
            hallName: 'IMAX Laser Hall 1',
            cinemaId: 1,
            cinemaName: 'CineChain Metropolis Grand',
            status: 'SCHEDULED',
            availableSeats: 48,
            totalSeats: 120
          },
          {
            id: 102,
            startTime: '2026-11-15T18:00:00',
            endTime: '2026-11-15T20:45:00',
            price: 18.00,
            movieId: this.movieId,
            movieTitle: 'Dune: Part Two',
            hallId: 2,
            hallName: 'Dolby Cinema Hall A',
            cinemaId: 1,
            cinemaName: 'CineChain Metropolis Grand',
            status: 'SCHEDULED',
            availableSeats: 22,
            totalSeats: 90
          },
          {
            id: 103,
            startTime: '2026-11-15T21:30:00',
            endTime: '2026-11-16T00:15:00',
            price: 16.00,
            movieId: this.movieId,
            movieTitle: 'Dune: Part Two',
            hallId: 3,
            hallName: 'VIP Lounge Hall 3',
            cinemaId: 2,
            cinemaName: 'CineChain Downtown Pavilion',
            status: 'SCHEDULED',
            availableSeats: 14,
            totalSeats: 50
          }
        ];
      }
    });
  }

  bookScreening(screeningId: number): void {
    this.router.navigate(['/book', screeningId]);
  }
}
