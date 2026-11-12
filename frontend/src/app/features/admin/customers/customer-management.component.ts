import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../../core/services/customer.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './customer-management.component.html',
})
export class CustomerManagementComponent implements OnInit {
  customers: User[] = [];
  filteredCustomers: User[] = [];
  loading = false;
  searchQuery = '';
  statusFilter = 'ALL';
  selectedCustomer: User | null = null;

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.customerService.getCustomers().subscribe({
      next: (data: any) => {
        this.customers = data?.content || data || [];
        this.filteredCustomers = [...this.customers];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    this.filteredCustomers = this.customers.filter(c => {
      const q = this.searchQuery.toLowerCase();
      const matchSearch = !q ||
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      const matchStatus = this.statusFilter === 'ALL' ||
        (this.statusFilter === 'ACTIVE' && c.enabled) ||
        (this.statusFilter === 'SUSPENDED' && !c.enabled);
      return matchSearch && matchStatus;
    });
  }

  viewCustomer(c: User): void {
    this.selectedCustomer = c;
  }

  toggleStatus(c: User): void {
    this.customerService.toggleStatus(c.id, !c.enabled).subscribe({
      next: () => {
        c.enabled = !c.enabled;
        this.applyFilters();
      }
    });
  }
}
