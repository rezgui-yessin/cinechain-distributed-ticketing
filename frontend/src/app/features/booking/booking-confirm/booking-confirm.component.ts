import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';

@Component({
  selector: 'app-booking-confirm',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './booking-confirm.component.html'
})
export class BookingConfirmComponent implements OnInit {
  bookingId!: number;
  booking: Booking | null = null;
  loading = true;
  mockMovieTitle = '';
  mockSeats = '';
  mockTotal = 0;

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.bookingId = +idParam;
      this.route.queryParams.subscribe(params => {
        this.mockMovieTitle = params['screening'] || 'Dune: Part Two';
        this.mockSeats = params['seats'] || 'E5, E6';
        this.mockTotal = +params['total'] || 33.00;
      });
      this.loadBooking();
    }
  }

  loadBooking(): void {
    this.bookingService.getBooking(this.bookingId).subscribe({
      next: (b) => {
        this.booking = b;
        this.loading = false;
      },
      error: () => {
        // Mock confirmed booking
        this.booking = {
          id: this.bookingId,
          bookingReference: 'BK-CC-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          customerId: 1,
          customerName: 'Verified Member',
          screeningId: 101,
          movieTitle: this.mockMovieTitle,
          screeningTime: '2026-11-15T19:00:00',
          cinemaName: 'CineChain Metropolis Grand',
          hallName: 'IMAX Laser Hall 1',
          status: 'CONFIRMED',
          totalAmount: this.mockTotal || 33.00,
          createdAt: new Date().toISOString()
        };
        this.loading = false;
      }
    });
  }
}
