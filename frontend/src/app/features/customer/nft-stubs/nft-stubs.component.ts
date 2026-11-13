import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResaleService } from '../../../core/services/resale.service';
import { TicketNftStub } from '../../../core/models/resale.model';

@Component({
  selector: 'app-nft-stubs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nft-stubs.component.html'
})
export class NftStubsComponent implements OnInit {
  stubs: TicketNftStub[] = [];
  loading = true;
  error: string | null = null;
  selectedStub: TicketNftStub | null = null;

  constructor(private resaleService: ResaleService) {}

  ngOnInit(): void {
    this.loadStubs();
  }

  loadStubs(): void {
    this.loading = true;
    this.error = null;
    this.resaleService.getMyNftStubs().subscribe({
      next: (data) => {
        this.stubs = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load commemorative NFT stubs';
        this.loading = false;
      }
    });
  }

  viewStubDetails(stub: TicketNftStub): void {
    this.selectedStub = stub;
  }

  closeStubDetails(): void {
    this.selectedStub = null;
  }
}
