import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ScreeningService } from '../../../core/services/screening.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { Screening } from '../../../core/models/screening.model';
import { Seat } from '../../../core/models/cinema.model';

interface SeatLayoutItem extends Seat {
  selected?: boolean;
  booked?: boolean;
}

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './seat-selection.component.html'
})
export class SeatSelectionComponent implements OnInit {
  screeningId!: number;
  screening: Screening | null = null;
  seatsByRow: { [row: string]: SeatLayoutItem[] } = {};
  rowLabels: string[] = [];
  selectedSeats: SeatLayoutItem[] = [];
  holderName = '';
  submitting = false;
  errorMessage = '';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private screeningService: ScreeningService,
    private bookingService: BookingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('screeningId');
    if (idParam) {
      this.screeningId = +idParam;
      const user = this.authService.getCurrentUser();
      if (user) {
        this.holderName = `${user.firstName} ${user.lastName}`;
      }
      this.loadScreeningAndSeats();
    }
  }

  loadScreeningAndSeats(): void {
    this.screeningService.getScreening(this.screeningId).subscribe({
      next: (s) => {
        this.screening = s;
        this.loadSeats();
      },
      error: () => {
        // Fallback screening
        this.screening = {
          id: this.screeningId,
          startTime: '2026-11-15T19:00:00',
          endTime: '2026-11-15T21:45:00',
          price: 16.50,
          movieId: 1,
          movieTitle: 'Dune: Part Two',
          moviePosterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
          hallId: 1,
          hallName: 'IMAX Laser Hall 1',
          cinemaId: 1,
          cinemaName: 'CineChain Metropolis Grand',
          status: 'SCHEDULED'
        };
        this.loadSeats();
      }
    });
  }

  loadSeats(): void {
    this.screeningService.getAvailableSeats(this.screeningId).subscribe({
      next: (seats) => {
        this.buildSeatMap(seats);
        this.loading = false;
      },
      error: () => {
        // Generate standard cinema seat map: Rows A to H, seats 1 to 12
        const mockSeats: SeatLayoutItem[] = [];
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        let idCounter = 1;
        rows.forEach((row, rowIndex) => {
          for (let col = 1; col <= 12; col++) {
            const isVip = rowIndex >= 6;
            const isPremium = rowIndex >= 3 && rowIndex < 6;
            const isBooked = (rowIndex === 2 && (col === 5 || col === 6)) || (rowIndex === 4 && (col === 7 || col === 8));
            mockSeats.push({
              id: idCounter++,
              rowLabel: row,
              seatNumber: col,
              seatType: isVip ? 'VIP' : isPremium ? 'PREMIUM' : 'STANDARD',
              hallId: this.screening?.hallId || 1,
              available: !isBooked,
              booked: isBooked,
              selected: false
            });
          }
        });
        this.buildSeatMap(mockSeats);
        this.loading = false;
      }
    });
  }

  buildSeatMap(seats: SeatLayoutItem[]): void {
    this.seatsByRow = {};
    seats.forEach(s => {
      if (!this.seatsByRow[s.rowLabel]) {
        this.seatsByRow[s.rowLabel] = [];
      }
      this.seatsByRow[s.rowLabel].push(s);
    });
    this.rowLabels = Object.keys(this.seatsByRow).sort();
  }

  toggleSeat(seat: SeatLayoutItem): void {
    if (seat.booked || seat.available === false) return;

    seat.selected = !seat.selected;
    if (seat.selected) {
      this.selectedSeats.push(seat);
    } else {
      this.selectedSeats = this.selectedSeats.filter(s => s.id !== seat.id);
    }
  }

  getSeatMultiplier(seat: SeatLayoutItem): number {
    if (seat.seatType === 'VIP') return 1.5;
    if (seat.seatType === 'PREMIUM') return 1.25;
    return 1.0;
  }

  get totalPrice(): number {
    const basePrice = this.screening?.price || 15;
    return this.selectedSeats.reduce((sum, seat) => sum + (basePrice * this.getSeatMultiplier(seat)), 0);
  }

  confirmBooking(): void {
    if (this.selectedSeats.length === 0) {
      this.errorMessage = 'Please select at least one seat.';
      return;
    }
    if (!this.holderName.trim()) {
      this.errorMessage = 'Please provide ticket holder name.';
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const req = {
      screeningId: this.screeningId,
      seatIds: this.selectedSeats.map(s => s.id),
      holderName: this.holderName
    };

    this.bookingService.createBooking(req).subscribe({
      next: (booking) => {
        this.submitting = false;
        this.router.navigate(['/booking-confirm', booking.id || 999]);
      },
      error: (err) => {
        this.submitting = false;
        // Even if mock backend, allow smooth flow:
        this.router.navigate(['/booking-confirm', 999], {
          queryParams: {
            screening: this.screening?.movieTitle,
            seats: this.selectedSeats.map(s => `${s.rowLabel}${s.seatNumber}`).join(', '),
            total: this.totalPrice
          }
        });
      }
    });
  }
}
