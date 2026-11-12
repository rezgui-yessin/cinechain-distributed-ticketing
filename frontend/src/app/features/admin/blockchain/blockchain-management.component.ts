import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BlockchainService } from '../../../core/services/blockchain.service';
import { BlockchainTransaction } from '../../../core/models/blockchain.model';

@Component({
  selector: 'app-blockchain-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './blockchain-management.component.html',
})
export class BlockchainManagementComponent implements OnInit {
  transactions: BlockchainTransaction[] = [];
  loading = false;
  page = 0;
  totalCount = 0;
  pageSize = 20;
  statusFilter = 'ALL';
  typeFilter = 'ALL';
  searchHash = '';

  stats = {
    total: 0,
    confirmed: 0,
    pending: 0,
    failed: 0,
  };

  constructor(private blockchainService: BlockchainService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.blockchainService.getTransactions(this.page).subscribe({
      next: (data: any) => {
        this.transactions = data?.content || data || [];
        this.totalCount = data?.totalElements || this.transactions.length;
        this.updateStats();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  updateStats(): void {
    this.stats.total = this.transactions.length;
    this.stats.confirmed = this.transactions.filter(t => t.status === 'CONFIRMED').length;
    this.stats.pending = this.transactions.filter(t => t.status === 'PENDING').length;
    this.stats.failed = this.transactions.filter(t => t.status === 'FAILED').length;
  }

  get filteredTransactions(): BlockchainTransaction[] {
    return this.transactions.filter(t => {
      const matchStatus = this.statusFilter === 'ALL' || t.status === this.statusFilter;
      const matchType = this.typeFilter === 'ALL' || t.type === this.typeFilter;
      const matchHash = !this.searchHash || t.transactionHash.toLowerCase().includes(this.searchHash.toLowerCase());
      return matchStatus && matchType && matchHash;
    });
  }

  truncateHash(hash: string): string {
    if (!hash) return '';
    return hash.length > 20 ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}` : hash;
  }

  typeColor(type: string): string {
    switch (type) {
      case 'TICKET_ISSUED': return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
      case 'TICKET_VALIDATED': return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
      case 'TICKET_HOLDER_CHANGED': return 'text-purple-400 bg-purple-500/10 border border-purple-500/20';
      case 'TICKET_CANCELLED': return 'text-red-400 bg-red-500/10 border border-red-500/20';
      case 'TICKET_EXPIRED': return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border border-gray-500/20';
    }
  }
}
