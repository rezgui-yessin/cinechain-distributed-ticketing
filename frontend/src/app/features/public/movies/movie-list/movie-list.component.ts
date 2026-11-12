import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { MovieService } from '../../../../core/services/movie.service';
import { Movie } from '../../../../core/models/movie.model';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './movie-list.component.html'
})
export class MovieListComponent implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  loading = true;
  searchTerm = '';
  selectedGenre = 'ALL';
  selectedStatus = 'ALL';
  currentPage = 0;
  totalPages = 1;
  pageSize = 8;

  genres = ['ALL', 'Action', 'Sci-Fi', 'Drama', 'Adventure', 'Comedy', 'Thriller', 'Animation'];

  constructor(private movieService: MovieService) {}

  ngOnInit(): void {
    this.loadMovies();
  }

  loadMovies(): void {
    this.loading = true;
    const statusParam = this.selectedStatus === 'ALL' ? undefined : this.selectedStatus;
    const genreParam = this.selectedGenre === 'ALL' ? undefined : this.selectedGenre;

    this.movieService.getMovies(this.currentPage, this.pageSize, statusParam, genreParam, this.searchTerm).subscribe({
      next: (res) => {
        if (res.content) {
          this.movies = res.content;
          this.totalPages = res.totalPages || 1;
        } else if (Array.isArray(res)) {
          this.movies = res;
          this.totalPages = Math.ceil(res.length / this.pageSize) || 1;
        }
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        // Fallback dummy catalog
        this.movies = [
          {
            id: 1,
            title: 'Dune: Part Two',
            description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge.',
            genre: 'Sci-Fi',
            language: 'English',
            durationMinutes: 166,
            posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
            releaseDate: '2024-03-01',
            rating: 8.9,
            status: 'NOW_SHOWING'
          },
          {
            id: 2,
            title: 'Oppenheimer',
            description: 'The story of J. Robert Oppenheimer and his role in the atomic bomb.',
            genre: 'Drama',
            language: 'English',
            durationMinutes: 180,
            posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
            releaseDate: '2023-07-21',
            rating: 8.6,
            status: 'NOW_SHOWING'
          },
          {
            id: 3,
            title: 'Interstellar',
            description: 'A team of explorers travel through a wormhole in space to ensure humanity.',
            genre: 'Sci-Fi',
            language: 'English',
            durationMinutes: 169,
            posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
            releaseDate: '2014-11-07',
            rating: 8.7,
            status: 'NOW_SHOWING'
          },
          {
            id: 4,
            title: 'The Dark Knight',
            description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham.',
            genre: 'Action',
            language: 'English',
            durationMinutes: 152,
            posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
            releaseDate: '2008-07-18',
            rating: 9.0,
            status: 'NOW_SHOWING'
          }
        ];
        this.applyFilter();
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    let result = [...this.movies];
    if (this.selectedGenre !== 'ALL') {
      result = result.filter(m => m.genre.toLowerCase().includes(this.selectedGenre.toLowerCase()));
    }
    if (this.selectedStatus !== 'ALL') {
      result = result.filter(m => m.status === this.selectedStatus);
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(m => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
    }
    this.filteredMovies = result;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  onFilterChange(): void {
    this.loadMovies();
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadMovies();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadMovies();
    }
  }
}
