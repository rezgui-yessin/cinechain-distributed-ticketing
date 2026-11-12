import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MovieService } from '../../../core/services/movie.service';
import { Movie } from '../../../core/models/movie.model';

@Component({
  selector: 'app-movie-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './movie-management.component.html',
  styleUrls: []
})
export class MovieManagementComponent implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  loading = true;
  searchTerm = '';
  selectedGenre = '';
  selectedStatus = '';

  isModalOpen = false;
  isEditing = false;
  currentMovieId: number | null = null;
  movieForm!: FormGroup;
  deleteConfirmId: number | null = null;
  errorMessage = '';
  successMessage = '';

  genres = ['Action', 'Sci-Fi', 'Drama', 'Adventure', 'Thriller', 'Animation', 'Comedy', 'Horror'];
  statuses = ['NOW_SHOWING', 'COMING_SOON', 'ARCHIVED'];

  constructor(
    private movieService: MovieService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMovies();
  }

  initForm(): void {
    this.movieForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', [Validators.required]],
      genre: ['Sci-Fi', [Validators.required]],
      language: ['English', [Validators.required]],
      durationMinutes: [120, [Validators.required, Validators.min(1)]],
      posterUrl: ['', [Validators.required]],
      trailerUrl: [''],
      releaseDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
      rating: [8.5, [Validators.required, Validators.min(0), Validators.max(10)]],
      status: ['NOW_SHOWING', [Validators.required]]
    });
  }

  loadMovies(): void {
    this.loading = true;
    this.movieService.getMovies(0, 100).subscribe({
      next: (response) => {
        if (response && response.content) {
          this.movies = response.content;
        } else if (Array.isArray(response)) {
          this.movies = response;
        }
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching movies', err);
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    this.filteredMovies = this.movies.filter(movie => {
      const matchSearch = !this.searchTerm || 
        movie.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        movie.description?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchGenre = !this.selectedGenre || movie.genre === this.selectedGenre;
      const matchStatus = !this.selectedStatus || movie.status === this.selectedStatus;
      return matchSearch && matchGenre && matchStatus;
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.currentMovieId = null;
    this.initForm();
    this.errorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(movie: Movie): void {
    this.isEditing = true;
    this.currentMovieId = movie.id;
    this.errorMessage = '';
    this.movieForm.patchValue({
      title: movie.title,
      description: movie.description,
      genre: movie.genre,
      language: movie.language,
      durationMinutes: movie.durationMinutes,
      posterUrl: movie.posterUrl,
      trailerUrl: movie.trailerUrl || '',
      releaseDate: movie.releaseDate,
      rating: movie.rating,
      status: movie.status
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentMovieId = null;
  }

  saveMovie(): void {
    if (this.movieForm.invalid) {
      this.movieForm.markAllAsTouched();
      return;
    }

    const payload = this.movieForm.value;

    if (this.isEditing && this.currentMovieId) {
      this.movieService.updateMovie(this.currentMovieId, payload).subscribe({
        next: () => {
          this.showSuccess('Movie updated successfully');
          this.closeModal();
          this.loadMovies();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update movie';
        }
      });
    } else {
      this.movieService.createMovie(payload).subscribe({
        next: () => {
          this.showSuccess('Movie created successfully');
          this.closeModal();
          this.loadMovies();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create movie';
        }
      });
    }
  }

  confirmDelete(id: number): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  deleteMovie(id: number): void {
    this.movieService.deleteMovie(id).subscribe({
      next: () => {
        this.showSuccess('Movie removed successfully');
        this.deleteConfirmId = null;
        this.loadMovies();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete movie';
        this.deleteConfirmId = null;
      }
    });
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 4000);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'NOW_SHOWING':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'COMING_SOON':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'ARCHIVED':
        return 'bg-slate-700/50 text-slate-400 border border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  }
}
