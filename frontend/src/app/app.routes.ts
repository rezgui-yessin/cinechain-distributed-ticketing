import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { customerGuard } from './core/guards/customer.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'movies',
    loadComponent: () => import('./features/public/movies/movie-list/movie-list.component').then(m => m.MovieListComponent)
  },
  {
    path: 'movies/:id',
    loadComponent: () => import('./features/public/movies/movie-detail/movie-detail.component').then(m => m.MovieDetailComponent)
  },
  {
    path: 'cinemas',
    loadComponent: () => import('./features/public/cinemas/cinema-list.component').then(m => m.CinemaListComponent)
  },
  {
    path: 'concessions',
    loadComponent: () => import('./features/customer/concessions/in-seat-concessions.component').then(m => m.InSeatConcessionsComponent)
  },
  {
    path: 'book/:screeningId',
    loadComponent: () => import('./features/booking/seat-selection/seat-selection.component').then(m => m.SeatSelectionComponent)
  },
  {
    path: 'booking-confirm/:id',
    loadComponent: () => import('./features/booking/booking-confirm/booking-confirm.component').then(m => m.BookingConfirmComponent)
  },

  // Auth routes
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },

  // Admin routes
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'movies',
        loadComponent: () => import('./features/admin/movies/movie-management.component').then(m => m.MovieManagementComponent)
      },
      {
        path: 'cinemas',
        loadComponent: () => import('./features/admin/cinemas/cinema-management.component').then(m => m.CinemaManagementComponent)
      },
      {
        path: 'halls',
        loadComponent: () => import('./features/admin/halls/hall-management.component').then(m => m.HallManagementComponent)
      },
      {
        path: 'screenings',
        loadComponent: () => import('./features/admin/screenings/screening-management.component').then(m => m.ScreeningManagementComponent)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/admin/bookings/booking-management.component').then(m => m.BookingManagementComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/admin/customers/customer-management.component').then(m => m.CustomerManagementComponent)
      },
      {
        path: 'validation',
        loadComponent: () => import('./features/admin/validation/ticket-validation.component').then(m => m.TicketValidationComponent)
      },
      {
        path: 'scanner',
        loadComponent: () => import('./features/admin/scanner/staff-scanner.component').then(m => m.StaffScannerComponent)
      },
      {
        path: 'concessions',
        loadComponent: () => import('./features/admin/concessions/kitchen-display.component').then(m => m.KitchenDisplayComponent)
      },
      {
        path: 'blockchain',
        loadComponent: () => import('./features/admin/blockchain/blockchain-management.component').then(m => m.BlockchainManagementComponent)
      },
      {
        path: 'statistics',
        loadComponent: () => import('./features/admin/statistics/statistics.component').then(m => m.StatisticsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent)
      },
    ]
  },

  // Customer routes
  {
    path: 'customer',
    loadComponent: () => import('./features/customer/layout/customer-layout.component').then(m => m.CustomerLayoutComponent),
    canActivate: [customerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/customer/dashboard/customer-dashboard.component').then(m => m.CustomerDashboardComponent)
      },
      {
        path: 'movies',
        loadComponent: () => import('./features/customer/movies/movie-browse.component').then(m => m.MovieBrowseComponent)
      },
      {
        path: 'tickets',
        loadComponent: () => import('./features/customer/tickets/my-tickets.component').then(m => m.MyTicketsComponent)
      },
      {
        path: 'tickets/:id',
        loadComponent: () => import('./features/customer/tickets/my-tickets.component').then(m => m.MyTicketsComponent)
      },
      {
        path: 'concessions',
        loadComponent: () => import('./features/customer/concessions/in-seat-concessions.component').then(m => m.InSeatConcessionsComponent)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/customer/tickets/my-tickets.component').then(m => m.MyTicketsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/customer/profile/customer-profile.component').then(m => m.CustomerProfileComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/customer/settings/customer-settings.component').then(m => m.CustomerSettingsComponent)
      },
    ]
  },

  { path: '**', redirectTo: '' }
];
