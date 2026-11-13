import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { Ticket } from '../../../core/models/ticket.model';

import { ResaleService } from '../../../core/services/resale.service';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-tickets.component.html'
})
export class MyTicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  loading = true;
  actionLoading = false;
  successMessage = '';
  errorMessage = '';

  // Filter & Search
  selectedStatusTab: 'ALL' | 'ACTIVE' | 'USED' | 'CANCELLED' = 'ALL';
  searchTerm = '';

  // Modals state
  selectedQrTicket: Ticket | null = null;
  cancelTargetTicket: Ticket | null = null;
  changeHolderTicket: Ticket | null = null;
  newHolderName = '';

  // Resale Modal state
  resaleTargetTicket: Ticket | null = null;
  resalePrice: number = 0;
  resaleNotes: string = '';

  // Claim NFT state
  claimingNftTicketId: number | null = null;

  constructor(
    private ticketService: TicketService,
    private resaleService: ResaleService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['ALL', 'ACTIVE', 'USED', 'CANCELLED'].includes(params['tab'].toUpperCase())) {
        this.selectedStatusTab = params['tab'].toUpperCase() as any;
      }
      this.loadTickets();
    });
  }

  loadTickets(): void {
    this.loading = true;
    this.errorMessage = '';

    this.ticketService.getMyTickets().subscribe({
      next: (tickets) => {
        this.tickets = Array.isArray(tickets) ? tickets : [];
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Failed to load tickets. Please try again.';
      }
    });
  }

  setStatusTab(tab: 'ALL' | 'ACTIVE' | 'USED' | 'CANCELLED'): void {
    this.selectedStatusTab = tab;
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.tickets];

    if (this.selectedStatusTab !== 'ALL') {
      result = result.filter(t => t.status === this.selectedStatusTab);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(t => 
        (t.movieTitle && t.movieTitle.toLowerCase().includes(term)) ||
        (t.bookingReference && t.bookingReference.toLowerCase().includes(term)) ||
        (t.holderName && t.holderName.toLowerCase().includes(term)) ||
        (t.cinemaName && t.cinemaName.toLowerCase().includes(term)) ||
        t.id.toString().includes(term)
      );
    }

    this.filteredTickets = result;
  }

  // QR Modal
  openQrModal(ticket: Ticket): void {
    this.selectedQrTicket = ticket;
  }

  closeQrModal(): void {
    this.selectedQrTicket = null;
  }

  // Cancel Modal
  openCancelModal(ticket: Ticket): void {
    this.cancelTargetTicket = ticket;
    this.errorMessage = '';
  }

  closeCancelModal(): void {
    this.cancelTargetTicket = null;
  }

  confirmCancelTicket(): void {
    if (!this.cancelTargetTicket) return;

    this.actionLoading = true;
    this.errorMessage = '';
    const ticketId = this.cancelTargetTicket.id;

    this.ticketService.cancelTicket(ticketId).subscribe({
      next: (updatedTicket) => {
        this.actionLoading = false;
        this.closeCancelModal();
        this.showSuccess(`Ticket #${ticketId} cancelled successfully.`);
        // Update local ticket status
        const idx = this.tickets.findIndex(t => t.id === ticketId);
        if (idx !== -1) {
          this.tickets[idx] = { ...this.tickets[idx], status: 'CANCELLED' };
          this.applyFilter();
        }
      },
      error: (err) => {
        this.actionLoading = false;
        this.errorMessage = err.error?.message || 'Cannot cancel ticket. Shows starting in under 2 hours cannot be refunded.';
      }
    });
  }

  // Change Holder Modal
  openChangeHolderModal(ticket: Ticket): void {
    this.changeHolderTicket = ticket;
    this.newHolderName = ticket.holderName || '';
    this.errorMessage = '';
  }

  closeChangeHolderModal(): void {
    this.changeHolderTicket = null;
    this.newHolderName = '';
  }

  confirmChangeHolder(): void {
    if (!this.changeHolderTicket || !this.newHolderName.trim()) return;

    this.actionLoading = true;
    this.errorMessage = '';
    const ticketId = this.changeHolderTicket.id;
    const name = this.newHolderName.trim();

    this.ticketService.changeHolderName(ticketId, name).subscribe({
      next: (updated) => {
        this.actionLoading = false;
        this.closeChangeHolderModal();
        this.showSuccess(`Holder name updated to "${name}". Blockchain registry re-signed.`);
        const idx = this.tickets.findIndex(t => t.id === ticketId);
        if (idx !== -1) {
          this.tickets[idx] = { ...this.tickets[idx], holderName: name };
          this.applyFilter();
        }
      },
      error: (err) => {
        this.actionLoading = false;
        this.errorMessage = err.error?.message || 'Failed to update ticket holder name.';
      }
    });
  }

  // Resale Modal
  openResaleModal(ticket: Ticket): void {
    this.resaleTargetTicket = ticket;
    this.resalePrice = ticket.price || 12.5;
    this.resaleNotes = 'Unable to attend, transferring seat at fair price.';
    this.errorMessage = '';
  }

  closeResaleModal(): void {
    this.resaleTargetTicket = null;
    this.resaleNotes = '';
  }

  confirmListResale(): void {
    if (!this.resaleTargetTicket || this.resalePrice <= 0) return;

    this.actionLoading = true;
    this.errorMessage = '';
    const ticketId = this.resaleTargetTicket.id;

    this.resaleService.createListing({
      ticketId,
      resalePrice: this.resalePrice,
      notes: this.resaleNotes
    }).subscribe({
      next: (listing) => {
        this.actionLoading = false;
        this.closeResaleModal();
        this.showSuccess(`Ticket #${ticketId} listed on P2P Resale Marketplace for €${this.resalePrice}!`);
        const idx = this.tickets.findIndex(t => t.id === ticketId);
        if (idx !== -1) {
          this.tickets[idx] = { ...this.tickets[idx], status: 'LISTED_FOR_RESALE' as any };
          this.applyFilter();
        }
      },
      error: (err) => {
        this.actionLoading = false;
        this.errorMessage = err.error?.message || 'Failed to list ticket for resale.';
      }
    });
  }

  // Claim NFT Stub
  claimNftStub(ticket: Ticket): void {
    this.claimingNftTicketId = ticket.id;
    this.errorMessage = '';

    this.resaleService.claimNftStub(ticket.id).subscribe({
      next: (stub) => {
        this.claimingNftTicketId = null;
        this.showSuccess(`🏆 Commemorative NFT Stub #${stub.tokenId} successfully claimed and minted!`);
      },
      error: (err) => {
        this.claimingNftTicketId = null;
        this.errorMessage = err.error?.message || 'Failed to mint NFT stub.';
      }
    });
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      this.successMessage = '';
    }, 4500);
  }

  printTicket(): void {
    window.print();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
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
    return `${ticket.rowLabel || 'Row'}-${ticket.seatNumber}`;
  }

  get activeCount(): number {
    return this.tickets.filter(t => t.status === 'ACTIVE').length;
  }

  get usedCount(): number {
    return this.tickets.filter(t => t.status === 'USED').length;
  }

  get cancelledCount(): number {
    return this.tickets.filter(t => t.status === 'CANCELLED').length;
  }
}
