import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { CinemaService } from '../../../core/services/cinema.service';
import { Cinema } from '../../../core/models/cinema.model';

@Component({
  selector: 'app-cinema-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './cinema-list.component.html'
})
export class CinemaListComponent implements OnInit {
  cinemas: Cinema[] = [];
  loading = true;

  constructor(private cinemaService: CinemaService) {}

  ngOnInit(): void {
    this.cinemaService.getCinemas().subscribe({
      next: (list) => {
        this.cinemas = list;
        this.loading = false;
      },
      error: () => {
        this.cinemas = [
          {
            id: 1,
            name: 'CineChain Metropolis Grand',
            address: '742 Broadway Avenue',
            city: 'New York',
            phone: '+1 (212) 555-0199',
            email: 'metropolis@cinechain.io',
            imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
            hallCount: 8
          },
          {
            id: 2,
            name: 'CineChain Downtown Pavilion',
            address: '100 Sunset Blvd',
            city: 'Los Angeles',
            phone: '+1 (310) 555-0144',
            email: 'pavilion@cinechain.io',
            imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
            hallCount: 6
          },
          {
            id: 3,
            name: 'CineChain Silicon Dome',
            address: '450 Market Street',
            city: 'San Francisco',
            phone: '+1 (415) 555-0177',
            email: 'dome@cinechain.io',
            imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
            hallCount: 5
          }
        ];
        this.loading = false;
      }
    });
  }
}
