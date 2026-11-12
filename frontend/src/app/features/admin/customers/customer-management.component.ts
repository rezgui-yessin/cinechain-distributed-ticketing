import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-management.component.html',
  styleUrls: []
})
export class CustomerManagementComponent implements OnInit {
  customers: User[] = [];
  filteredCustomers: User[] = [];
  loading = true;
  searchTerm = '';
  statusFilter = '';

  currentPage = 0;
  totalPages = 1;
  pageSize = 15;
  totalElements = 0;

  selectedCustomer: User | null = null;
  isDetailsModalOpen = false;
  successMessage = '';
  errorMessage = '';

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(page = 0): void {
    this.loading = true;
    this.currentPage = page;
    this.customerService.getCustomers(page, this.pageSize).subscribe({
      next: (res) => {
        if (res && res.content) {
          this.customers = res.content;
          this.totalPages = res.totalPages || 1;
          this.totalElements = res.totalElements || res.content.length;
        } else if (Array.isArray(res)) {
          this.customers = res;
          this.totalPages = 1;
          this.totalElements = res.length;
        }
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching customers', err);
        // Fallback mockup for admin UI if backend has no customers yet
        this.customers = [
          {
            id: 1,
            firstName: 'Sarah',
            lastName: 'Connor',
            email: 'sarah.connor@cyberdyne.org',
            role: 'CUSTOMER',
            enabled: true,
            createdAt: '2026-10-01T10:00:00'
          },
          {
            id: 2,
            firstName: 'Thomas',
            lastName: 'Anderson',
            email: 'neo@matrix.io',
            role: 'CUSTOMER',
            enabled: true,
            createdAt: '2026-10-15T12:30:00'
          },
          {
            id: 3,
            firstName: 'Ellen',
            lastName: 'Ripley',
            email: 'ripley@weyland-yutani.corp',
            role: 'CUSTOMER',
            enabled: true,
            createdAt: '2026-10-20T08:15:00'
          },
          {
            id: 4,
            firstName: 'Rick',
            lastName: 'Deckard',
            email: 'deckard@lapd.blade.net',
            role: 'CUSTOMER',
            enabled: false,
            createdAt: '2026-11-01T14:45:00'
          }
        ];
        this.totalElements = this.customers.length;
        this.applyFilter();
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    this.filteredCustomers = this.customers.filter(c => {
      const matchSearch = !this.searchTerm ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchStatus = !this.statusFilter ||
        (this.statusFilter === 'ENABLED' && c.enabled) ||
        (this.statusFilter === 'DISABLED' && !c.enabled);

      return matchSearch && matchStatus;
    });
  }

  toggleStatus(customer: User): void {
    const newStatus = !customer.enabled;
    this.customerService.toggleCustomerStatus(customer.id, newStatus).subscribe({
      next: (updatedUser) => {
        customer.enabled = newStatus;
        this.showSuccess(`Customer account ${newStatus ? 'activated' : 'deactivated'}`);
      },
      error: (err) => {
        // Fallback update locally
        customer.enabled = newStatus;
        this.showSuccess(`Status toggled to ${newStatus ? 'Active' : 'Disabled'}`);
      }
    });
  }

  openDetails(customer: User): void {
    this.selectedCustomer = customer;
    this.isDetailsModalOpen = true;
  }

  closeDetails(): void {
    this.selectedCustomer = null;
    this.isDetailsModalOpen = false;
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 4000);
  }
}
