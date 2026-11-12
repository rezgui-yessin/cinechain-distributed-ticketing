import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-management.component.html',
  styleUrls: []
})
export class BookingManagementComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  selectedBooking: Booking | null = null;
  loading = true;
  searchTerm = '';
  selectedStatus = '';

  currentPage = 0;
  totalPages = 1;
  pageSize = 15;
  totalElements = 0;

  isDetailsModalOpen = false;
  cancelConfirmBooking: Booking | null = null;
  successMessage = '';
  errorMessage = '';

  statuses = ['CONFIRMED', 'PENDING', 'CANCELLED'];

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(page = 0): void {
    this.loading = true;
    this.currentPage = page;
    this.bookingService.getAdminBookings(page, this.pageSize, this.selectedStatus || undefined).subscribe({
      next: (res) => {
        if (res && res.content) {
          this.bookings = res.content;
          this.totalPages = res.totalPages || 1;
          this.totalElements = res.totalElements || res.content.length;
        } else if (Array.isArray(res)) {
          this.bookings = res;
          this.totalPages = 1;
          this.totalElements = res.length;
        }
        this.applySearchFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching bookings', err);
        this.loading = false;
      }
    });
  }

  applySearchFilter(): void {
    if (!this.searchTerm) {
      this.filteredBookings = [...this.bookings];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredBookings = this.bookings.filter(b => 
        b.bookingReference.toLowerCase().includes(term) ||
        (b.customerName && b.customerName.toLowerCase().includes(term)) ||
        (b.customerEmail && b.customerEmail.toLowerCase().includes(term)) ||
        (b.movieTitle && b.movieTitle.toLowerCase().includes(term))
      );
    }
  }

  onStatusChange(): void {
    this.loadBookings(0);
  }

  openDetailsModal(booking: Booking): void {
    this.selectedBooking = booking;
    this.isDetailsModalOpen = true;
    // Load full booking details with tickets if needed
    this.bookingService.getBooking(booking.id).subscribe({
      next: (fullBooking) => {
        this.selectedBooking = fullBooking;
      },
      error: () => {
        // Fallback to original
      }
    });
  }

  closeDetailsModal(): void {
    this.selectedBooking = null;
    this.isDetailsModalOpen = false;
  }

  confirmCancelBooking(booking: Booking): void {
    this.cancelConfirmBooking = booking;
  }

  abortCancel(): void {
    this.cancelConfirmBooking = null;
  }

  executeCancelBooking(bookingId: number): void {
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.showSuccess('Booking successfully cancelled and tickets voided');
        this.cancelConfirmBooking = null;
        if (this.selectedBooking && this.selectedBooking.id === bookingId) {
          this.selectedBooking.status = 'CANCELLED';
        }
        this.loadBookings(this.currentPage);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to cancel booking';
        this.cancelConfirmBooking = null;
      }
    });
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 4000);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300';
    }
  }
}
