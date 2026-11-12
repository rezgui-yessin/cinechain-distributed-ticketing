import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MovieService } from '../../../core/services/movie.service';
import { ScreeningService } from '../../../core/services/screening.service';
import { Movie } from '../../../core/models/movie.model';
import { Screening } from '../../../core/models/screening.model';

@Component({
  selector: 'app-movie-browse',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './movie-browse.component.html'
})
export class MovieBrowseComponent implements OnInit, OnDestroy {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  loading = true;
  errorMessage = '';

  // Filter & Search states
  searchQuery = '';
  selectedGenre = 'ALL';
  selectedStatus: 'ALL' | 'NOW_SHOWING' | 'COMING_SOON' = 'ALL';
  selectedSort = 'rating'; // 'rating', 'releaseDate', 'title', 'duration'

  genres: string[] = [
    'ALL',
    'Action',
    'Sci-Fi',
    'Drama',
    'Adventure',
    'Comedy',
    'Horror',
    'Animation',
    'Thriller',
    'Romance'
  ];

  // Screenings Modal for Quick Booking
  selectedMovieForScreenings: Movie | null = null;
  movieScreenings: Screening[] = [];
  loadingScreenings = false;

  // Trailer Modal
  selectedTrailerMovie: Movie | null = null;

  private routeSub?: Subscription;

  constructor(
    private movieService: MovieService,
    private screeningService: ScreeningService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      if (params['genre']) {
        this.selectedGenre = params['genre'];
      }
      if (params['status']) {
        this.selectedStatus = params['status'];
      }
      this.fetchMovies();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  fetchMovies(): void {
    this.loading = true;
    this.errorMessage = '';

    const statusParam = this.selectedStatus === 'ALL' ? undefined : this.selectedStatus;
    const genreParam = this.selectedGenre === 'ALL' ? undefined : this.selectedGenre;

    this.movieService.getMovies(0, 50, statusParam, genreParam, this.searchQuery || undefined).subscribe({
      next: (response) => {
        let list: Movie[] = [];
        if (response && response.content) {
          list = response.content;
        } else if (Array.isArray(response)) {
          list = response;
        }
        this.movies = list;
        this.applyLocalFiltersAndSorting();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Failed to load movie catalog. Please try again.';
      }
    });
  }

  onFilterChange(): void {
    this.fetchMovies();
  }

  setGenre(genre: string): void {
    this.selectedGenre = genre;
    this.fetchMovies();
  }

  setStatus(status: 'ALL' | 'NOW_SHOWING' | 'COMING_SOON'): void {
    this.selectedStatus = status;
    this.fetchMovies();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedGenre = 'ALL';
    this.selectedStatus = 'ALL';
    this.selectedSort = 'rating';
    this.fetchMovies();
  }

  applyLocalFiltersAndSorting(): void {
    let result = [...this.movies];

    // Local client sort
    result.sort((a, b) => {
      if (this.selectedSort === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (this.selectedSort === 'title') {
        return a.title.localeCompare(b.title);
      } else if (this.selectedSort === 'duration') {
        return (b.durationMinutes || 0) - (a.durationMinutes || 0);
      } else if (this.selectedSort === 'releaseDate') {
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      }
      return 0;
    });

    this.filteredMovies = result;
  }

  openScreeningsModal(movie: Movie): void {
    this.selectedMovieForScreenings = movie;
    this.loadingScreenings = true;
    this.movieScreenings = [];

    this.screeningService.getScreenings(movie.id, 0, 20).subscribe({
      next: (data) => {
        if (data && data.content) {
          this.movieScreenings = data.content;
        } else if (Array.isArray(data)) {
          this.movieScreenings = data;
        }
        this.loadingScreenings = false;
      },
      error: () => {
        this.loadingScreenings = false;
      }
    });
  }

  closeScreeningsModal(): void {
    this.selectedMovieForScreenings = null;
    this.movieScreenings = [];
  }

  openTrailerModal(movie: Movie): void {
    this.selectedTrailerMovie = movie;
  }

  closeTrailerModal(): void {
    this.selectedTrailerMovie = null;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
