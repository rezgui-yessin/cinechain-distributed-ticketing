import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { AuthResponse } from '../../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: AuthResponse | null = null;
  mobileMenuOpen = false;
  liveNotifications: Array<{ title: string; body: string; time: Date }> = [];
  unreadCount = 0;
  showNotificationsMenu = false;
  private wsSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.wsSubscription = this.wsService.notifications$.subscribe(msg => {
      if (msg.payload) {
        this.liveNotifications.unshift({
          title: msg.payload.title,
          body: msg.payload.body,
          time: new Date()
        });
        this.unreadCount++;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  toggleNotifications(): void {
    this.showNotificationsMenu = !this.showNotificationsMenu;
    if (this.showNotificationsMenu) {
      this.unreadCount = 0;
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  logout(): void {
    this.authService.logout();
  }

  navigateToDashboard(): void {
    if (this.currentUser?.role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/customer/dashboard']);
    }
  }
}
