import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/user.model';

interface MenuItem {
  name: string;
  icon: string;
  route?: string;
  badge?: string;
  action?: () => void;
  isExternal?: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'booking' | 'ticket' | 'promo' | 'system';
}

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-layout.component.html'
})
export class CustomerLayoutComponent implements OnInit, OnDestroy {
  currentUser: AuthResponse | null = null;
  private userSub?: Subscription;
  private routerSub?: Subscription;

  sidebarOpen = false;
  notificationsOpen = false;
  userMenuOpen = false;
  supportModalOpen = false;
  searchQuery = '';

  menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      icon: 'dashboard',
      route: '/customer/dashboard'
    },
    {
      name: 'Browse Movies',
      icon: 'film',
      route: '/customer/movies'
    },
    {
      name: 'My Tickets',
      icon: 'ticket',
      route: '/customer/tickets',
      badge: 'Live'
    },
    {
      name: 'In-Seat Snacks',
      icon: 'sparkles',
      route: '/customer/concessions',
      badge: 'VIP'
    },
    {
      name: 'Resale Marketplace',
      icon: 'ticket',
      route: '/resale',
      badge: 'P2P'
    },
    {
      name: 'My NFT Stubs',
      icon: 'award',
      route: '/customer/nft-stubs',
      badge: 'POAP'
    },
    {
      name: 'Booking History',
      icon: 'calendar',
      route: '/customer/bookings'
    },
    {
      name: 'Now Showing',
      icon: 'play',
      route: '/movies'
    },
    {
      name: 'Cinemas & Theatres',
      icon: 'building',
      route: '/cinemas'
    },
    {
      name: 'VIP Loyalty',
      icon: 'award',
      route: '/customer/profile'
    },
    {
      name: 'My Profile',
      icon: 'user',
      route: '/customer/profile'
    },
    {
      name: 'Preferences & Settings',
      icon: 'cog',
      route: '/customer/settings'
    },
    {
      name: 'Support & Help',
      icon: 'question-mark',
      action: () => this.toggleSupportModal()
    }
  ];

  notifications: NotificationItem[] = [
    {
      id: '1',
      title: 'Ticket Confirmed!',
      message: 'Your ticket for "Dune: Part Two" has been issued and verified on blockchain.',
      time: '15 mins ago',
      read: false,
      type: 'ticket'
    },
    {
      id: '2',
      title: 'Screening Reminder',
      message: 'Reminder: "Oppenheimer" screening begins in 2 hours at Grand Rex Hall 1.',
      time: '1 hour ago',
      read: false,
      type: 'booking'
    },
    {
      id: '3',
      title: 'Member Perks Unlocked',
      message: 'You have earned 250 loyalty CinePoints with your recent bookings!',
      time: 'Yesterday',
      read: true,
      type: 'promo'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.sidebarOpen = false;
        this.notificationsOpen = false;
        this.userMenuOpen = false;
      });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.userMenuOpen = false;
    }
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) {
      this.notificationsOpen = false;
    }
  }

  toggleSupportModal(): void {
    this.supportModalOpen = !this.supportModalOpen;
    this.sidebarOpen = false;
  }

  markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => (n.read = true));
  }

  get unreadNotificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/customer/movies'], {
        queryParams: { search: this.searchQuery.trim() }
      });
      this.searchQuery = '';
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const first = this.currentUser.firstName ? this.currentUser.firstName[0] : '';
    const last = this.currentUser.lastName ? this.currentUser.lastName[0] : '';
    return (first + last).toUpperCase() || 'U';
  }
}
