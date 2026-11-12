import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/user.model';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: []
})
export class AdminLayoutComponent implements OnInit {
  isSidebarOpen = true;
  mobileMenuOpen = false;
  currentUser: AuthResponse | null = null;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Movies', route: '/admin/movies', icon: 'film' },
    { label: 'Cinemas', route: '/admin/cinemas', icon: 'building' },
    { label: 'Halls', route: '/admin/halls', icon: 'door' },
    { label: 'Screenings', route: '/admin/screenings', icon: 'calendar' },
    { label: 'Bookings', route: '/admin/bookings', icon: 'ticket' },
    { label: 'Customers', route: '/admin/customers', icon: 'users' },
    { label: 'Ticket Validation', route: '/admin/validation', icon: 'scan' },
    { label: 'Live QR Scanner', route: '/admin/scanner', icon: 'camera', badge: 'LIVE' },
    { label: 'Blockchain', route: '/admin/blockchain', icon: 'cube' },
    { label: 'Statistics', route: '/admin/statistics', icon: 'chart' },
    { label: 'Settings', route: '/admin/settings', icon: 'settings' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}
