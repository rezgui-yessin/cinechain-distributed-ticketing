import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { MovieService } from '../../../core/services/movie.service';
import { Movie } from '../../../core/models/movie.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  nowShowingMovies: Movie[] = [];
  comingSoonMovies: Movie[] = [];
  loading = true;

  constructor(private movieService: MovieService) {}

  ngOnInit(): void {
    this.movieService.getMovies(0, 8, 'NOW_SHOWING').subscribe({
      next: (res) => {
        this.nowShowingMovies = res.content || res || [];
        this.loading = false;
      },
      error: () => {
        // Fallback demo movies if backend isn't ready
        this.nowShowingMovies = [
          {
            id: 1,
            title: 'Dune: Part Two',
            description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
            genre: 'Sci-Fi / Adventure',
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
            description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
            genre: 'Biography / Drama',
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
            description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.',
            genre: 'Sci-Fi / Adventure',
            language: 'English',
            durationMinutes: 169,
            posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
            releaseDate: '2014-11-07',
            rating: 8.7,
            status: 'NOW_SHOWING'
          },
          {
            id: 4,
            title: 'Blade Runner 2049',
            description: 'Young Blade Runner K discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.',
            genre: 'Action / Sci-Fi',
            language: 'English',
            durationMinutes: 164,
            posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
            releaseDate: '2017-10-06',
            rating: 8.4,
            status: 'NOW_SHOWING'
          }
        ];
        this.loading = false;
      }
    });

    this.movieService.getMovies(0, 4, 'COMING_SOON').subscribe({
      next: (res) => {
        this.comingSoonMovies = res.content || res || [];
      },
      error: () => {
        this.comingSoonMovies = [
          {
            id: 5,
            title: 'Avatar 3: Fire and Ash',
            description: 'Return to Pandora as Jake Sully and Neytiri encounter a new, aggressive volcanic clan of Na vi.',
            genre: 'Sci-Fi / Fantasy',
            language: 'English',
            durationMinutes: 190,
            posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
            releaseDate: '2025-12-19',
            rating: 9.0,
            status: 'COMING_SOON'
          }
        ];
      }
    });
  }
}
