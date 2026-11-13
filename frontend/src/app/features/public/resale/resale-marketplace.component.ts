import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ResaleService } from '../../../core/services/resale.service';
import { AuthService } from '../../../core/services/auth.service';
import { ResaleListing } from '../../../core/models/resale.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-resale-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './resale-marketplace.component.html'
})
export class ResaleMarketplaceComponent implements OnInit {
  listings: ResaleListing[] = [];
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;

  // Search & Filter
  searchTerm = '';
  selectedGenre = 'ALL';

  // Buy Modal state
  selectedListing: ResaleListing | null = null;
  newHolderName = '';
  isBuying = false;
  buyError: string | null = null;

  constructor(
    private resaleService: ResaleService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadListings();
  }

  loadListings(): void {
    this.loading = true;
    this.error = null;
    this.resaleService.getMarketplaceListings().subscribe({
      next: (data) => {
        this.listings = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load verified resale listings: ' + (err.error?.message || err.message);
        this.loading = false;
      }
    });
  }

  get filteredListings(): ResaleListing[] {
    return this.listings.filter(item => {
      const matchesSearch = !this.searchTerm ||
        item.movieTitle.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.cinemaName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.hallName.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesGenre = this.selectedGenre === 'ALL' || item.genre?.toLowerCase().includes(this.selectedGenre.toLowerCase());

      return matchesSearch && matchesGenre;
    });
  }

  openBuyModal(listing: ResaleListing): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/resale' } });
      return;
    }
    this.selectedListing = listing;
    const currentUser = this.authService.getCurrentUser();
    this.newHolderName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '';
    this.buyError = null;
  }

  closeBuyModal(): void {
    this.selectedListing = null;
    this.newHolderName = '';
    this.buyError = null;
  }

  confirmPurchase(): void {
    if (!this.selectedListing || !this.newHolderName.trim()) {
      this.buyError = 'Please provide the ticket holder name for admission.';
      return;
    }

    this.isBuying = true;
    this.buyError = null;

    this.resaleService.buyListing(this.selectedListing.id, { newHolderName: this.newHolderName.trim() }).subscribe({
      next: (res) => {
        this.isBuying = false;
        this.closeBuyModal();
        this.successMessage = `🎉 Ticket for "${res.movieTitle}" acquired! New verified QR code issued on blockchain.`;
        this.loadListings();
      },
      error: (err) => {
        this.isBuying = false;
        this.buyError = err.error?.message || 'Transaction failed. Please try again.';
      }
    });
  }
}
