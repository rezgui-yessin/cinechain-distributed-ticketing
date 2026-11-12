import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { MovieService } from '../../../core/services/movie.service';
import { CinemaService } from '../../../core/services/cinema.service';
import { Movie } from '../../../core/models/movie.model';
import { Cinema } from '../../../core/models/cinema.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  nowShowingMovies: Movie[] = [];
  comingSoonMovies: Movie[] = [];
  cinemas: Cinema[] = [];
  featuredMovie: Movie | null = null;
  loading = true;

  // Filters & Quick Booking Bar
  selectedGenre = 'ALL';
  genres = ['ALL', 'Sci-Fi', 'Action', 'Biography', 'Drama'];
  selectedMovieId: number | null = null;
  selectedCinemaId: number | null = null;
  selectedDate: string = 'TODAY';
  selectedFormat = 'ALL';

  // Trailer Modal
  trailerModalOpen = false;
  safeTrailerUrl: SafeResourceUrl | null = null;

  // Showtimes sample per movie
  sampleShowtimes = ['13:30', '16:15', '19:00', '21:45'];

  constructor(
    private movieService: MovieService,
    private cinemaService: CinemaService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadMovies();
    this.loadCinemas();
  }

  loadMovies(): void {
    this.movieService.getMovies(0, 10, 'NOW_SHOWING').subscribe({
      next: (res) => {
        const movies = res.content || res || [];
        this.nowShowingMovies = movies.length > 0 ? movies : this.getFallbackNowShowing();
        this.featuredMovie = this.nowShowingMovies[0] || null;
        if (this.featuredMovie) {
          this.selectedMovieId = this.featuredMovie.id;
        }
        this.loading = false;
      },
      error: () => {
        this.nowShowingMovies = this.getFallbackNowShowing();
        this.featuredMovie = this.nowShowingMovies[0] || null;
        if (this.featuredMovie) {
          this.selectedMovieId = this.featuredMovie.id;
        }
        this.loading = false;
      }
    });

    this.movieService.getMovies(0, 4, 'COMING_SOON').subscribe({
      next: (res) => {
        const movies = res.content || res || [];
        this.comingSoonMovies = movies.length > 0 ? movies : this.getFallbackComingSoon();
      },
      error: () => {
        this.comingSoonMovies = this.getFallbackComingSoon();
      }
    });
  }

  loadCinemas(): void {
    this.cinemaService.getCinemas().subscribe({
      next: (cinemas) => {
        this.cinemas = cinemas.length > 0 ? cinemas : this.getFallbackCinemas();
        if (this.cinemas.length > 0) {
          this.selectedCinemaId = this.cinemas[0].id;
        }
      },
      error: () => {
        this.cinemas = this.getFallbackCinemas();
        if (this.cinemas.length > 0) {
          this.selectedCinemaId = this.cinemas[0].id;
        }
      }
    });
  }

  selectFeatured(movie: Movie): void {
    this.featuredMovie = movie;
    this.selectedMovieId = movie.id;
  }

  setGenre(genre: string): void {
    this.selectedGenre = genre;
  }

  get filteredNowShowing(): Movie[] {
    if (this.selectedGenre === 'ALL') {
      return this.nowShowingMovies;
    }
    return this.nowShowingMovies.filter(m => 
      m.genre?.toLowerCase().includes(this.selectedGenre.toLowerCase())
    );
  }

  openTrailer(movie?: Movie): void {
    const target = movie || this.featuredMovie;
    if (!target) return;
    
    // Default high-res trailer embed
    let embedUrl = 'https://www.youtube-nocookie.com/embed/Way9Dexny3w?autoplay=1';
    if (target.trailerUrl) {
      if (target.trailerUrl.includes('watch?v=')) {
        const videoId = target.trailerUrl.split('watch?v=')[1]?.split('&')[0];
        if (videoId) embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
      } else if (target.trailerUrl.includes('youtu.be/')) {
        const videoId = target.trailerUrl.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
      }
    }

    this.safeTrailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    this.trailerModalOpen = true;
  }

  closeTrailer(): void {
    this.trailerModalOpen = false;
    this.safeTrailerUrl = null;
  }

  formatDuration(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }

  private getFallbackNowShowing(): Movie[] {
    return [
      {
        id: 1,
        title: 'Dune: Part Two',
        description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, confronting the choice between the love of his life and the fate of the universe.',
        genre: 'Sci-Fi / Adventure',
        language: 'English (Atmos)',
        durationMinutes: 166,
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
        releaseDate: '2024-03-01',
        rating: 8.9,
        status: 'NOW_SHOWING'
      },
      {
        id: 2,
        title: 'Oppenheimer',
        description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        genre: 'Biography / Drama',
        language: 'English (70mm)',
        durationMinutes: 180,
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        releaseDate: '2023-07-21',
        rating: 8.6,
        status: 'NOW_SHOWING'
      },
      {
        id: 3,
        title: 'Interstellar',
        description: 'A team of explorers travel through a newly discovered wormhole in space in an attempt to ensure humanity survival against impending global collapse.',
        genre: 'Sci-Fi / Adventure',
        language: 'English (IMAX)',
        durationMinutes: 169,
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        releaseDate: '2014-11-07',
        rating: 8.7,
        status: 'NOW_SHOWING'
      },
      {
        id: 4,
        title: 'The Dark Knight',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        genre: 'Action / Crime',
        language: 'English (4K Remaster)',
        durationMinutes: 152,
        posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=900&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
        releaseDate: '2008-07-18',
        rating: 9.0,
        status: 'NOW_SHOWING'
      },
      {
        id: 5,
        title: 'Blade Runner 2049',
        description: 'Young Blade Runner K discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who has been missing for thirty years.',
        genre: 'Sci-Fi / Mystery',
        language: 'English (Dolby Vision)',
        durationMinutes: 164,
        posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=gCcx85zbxz4',
        releaseDate: '2017-10-06',
        rating: 8.4,
        status: 'NOW_SHOWING'
      }
    ];
  }

  private getFallbackComingSoon(): Movie[] {
    return [
      {
        id: 6,
        title: 'Avatar 3: Fire and Ash',
        description: 'Return to Pandora as Jake Sully and Neytiri encounter a new, aggressive volcanic clan of Na vi in an unprecedented expansion of the saga.',
        genre: 'Sci-Fi / Adventure',
        language: 'English (3D HFR)',
        durationMinutes: 190,
        posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80',
        releaseDate: '2025-12-19',
        rating: 9.1,
        status: 'COMING_SOON'
      },
      {
        id: 7,
        title: 'Gladiator II',
        description: 'Years after witnessing the death of Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered.',
        genre: 'Action / History',
        language: 'English (IMAX)',
        durationMinutes: 148,
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=900&auto=format&fit=crop&q=80',
        releaseDate: '2025-11-22',
        rating: 8.5,
        status: 'COMING_SOON'
      },
      {
        id: 8,
        title: 'Tron: Ares',
        description: 'A sophisticated Program named Ares is sent from the digital world into the real world on a dangerous mission, marking human encounters with A.I. beings.',
        genre: 'Sci-Fi / Action',
        language: 'English (Dolby Atmos)',
        durationMinutes: 135,
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
        releaseDate: '2025-10-10',
        rating: 8.3,
        status: 'COMING_SOON'
      }
    ];
  }

  private getFallbackCinemas(): Cinema[] {
    return [
      {
        id: 1,
        name: 'CineChain Grand IMAX',
        address: '100 Boulevard de la Villette',
        city: 'Paris',
        phone: '+33 1 42 08 20 20',
        email: 'grand-imax@cinechain.com',
        hallCount: 8,
        imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80'
      },
      {
        id: 2,
        name: 'CineChain Dolby Atmos Studio',
        address: '45 Avenue des Champs-Élysées',
        city: 'Paris',
        phone: '+33 1 45 61 10 00',
        email: 'dolby-studio@cinechain.com',
        hallCount: 6,
        imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80'
      },
      {
        id: 3,
        name: 'CineChain Onyx VIP Lounge',
        address: '12 Rue de la Paix',
        city: 'Paris',
        phone: '+33 1 42 61 50 50',
        email: 'onyx-vip@cinechain.com',
        hallCount: 4,
        imageUrl: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800&auto=format&fit=crop&q=80'
      }
    ];
  }
}
