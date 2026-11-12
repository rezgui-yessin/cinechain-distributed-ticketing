import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService, CustomerStats } from '../../../core/services/dashboard.service';
import { TicketService } from '../../../core/services/ticket.service';
import { BookingService } from '../../../core/services/booking.service';
import { MovieService } from '../../../core/services/movie.service';
import { Ticket } from '../../../core/models/ticket.model';
import { Booking } from '../../../core/models/booking.model';
import { Movie } from '../../../core/models/movie.model';
import { AuthResponse } from '../../../core/models/user.model';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-dashboard.component.html'
})
export class CustomerDashboardComponent implements OnInit {
  currentUser: AuthResponse | null = null;
  stats: CustomerStats = {
    totalBookings: 0,
    upcomingScreenings: 0,
    activeTickets: 0,
    usedTickets: 0,
    cancelledTickets: 0,
    recentTickets: []
  };

  upcomingTickets: Ticket[] = [];
  recentBookings: Booking[] = [];
  nowShowingMovies: Movie[] = [];

  loadingStats = true;
  loadingTickets = true;
  loadingBookings = true;
  loadingMovies = true;

  // Selected ticket for Quick QR View Modal
  selectedQrTicket: Ticket | null = null;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private ticketService: TicketService,
    private bookingService: BookingService,
    private movieService: MovieService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadStats();
    this.loadUpcomingTickets();
    this.loadRecentBookings();
    this.loadNowShowingMovies();
  }

  loadStats(): void {
    this.loadingStats = true;
    this.dashboardService.getCustomerStats().subscribe({
      next: (data) => {
        if (data) {
          this.stats = data;
        }
        this.loadingStats = false;
      },
      error: () => {
        // Fallback calculation will trigger once tickets/bookings arrive
        this.loadingStats = false;
      }
    });
  }

  loadUpcomingTickets(): void {
    this.loadingTickets = true;
    this.ticketService.getMyTickets().subscribe({
      next: (tickets) => {
        const allTickets = Array.isArray(tickets) ? tickets : [];
        this.upcomingTickets = allTickets.filter(t => t.status === 'ACTIVE').slice(0, 3);
        
        // Update stats if default was 0
        if (this.stats.activeTickets === 0) {
          this.stats.activeTickets = allTickets.filter(t => t.status === 'ACTIVE').length;
          this.stats.usedTickets = allTickets.filter(t => t.status === 'USED').length;
          this.stats.cancelledTickets = allTickets.filter(t => t.status === 'CANCELLED').length;
          this.stats.upcomingScreenings = this.stats.activeTickets;
        }

        this.loadingTickets = false;
      },
      error: () => {
        this.loadingTickets = false;
      }
    });
  }

  loadRecentBookings(): void {
    this.loadingBookings = true;
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        const list = Array.isArray(bookings) ? bookings : [];
        this.recentBookings = list.slice(0, 5);
        if (this.stats.totalBookings === 0) {
          this.stats.totalBookings = list.length;
        }
        this.loadingBookings = false;
      },
      error: () => {
        this.loadingBookings = false;
      }
    });
  }

  loadNowShowingMovies(): void {
    this.loadingMovies = true;
    this.movieService.getMovies(0, 6, 'NOW_SHOWING').subscribe({
      next: (res) => {
        if (res && res.content) {
          this.nowShowingMovies = res.content;
        } else if (Array.isArray(res)) {
          this.nowShowingMovies = res;
        }
        this.loadingMovies = false;
      },
      error: () => {
        this.loadingMovies = false;
      }
    });
  }

  openQrModal(ticket: Ticket): void {
    this.selectedQrTicket = ticket;
  }

  closeQrModal(): void {
    this.selectedQrTicket = null;
  }

  getGreetingTime(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  formatSeat(ticket: Ticket): string {
    return `${ticket.rowLabel || 'Row'}-${ticket.seatNumber} (${ticket.seatType || 'Standard'})`;
  }
}
