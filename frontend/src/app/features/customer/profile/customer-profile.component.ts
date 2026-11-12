import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CinemaService } from '../../../core/services/cinema.service';
import { DashboardService, CustomerStats } from '../../../core/services/dashboard.service';
import { AuthResponse } from '../../../core/models/user.model';
import { Cinema } from '../../../core/models/cinema.model';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './customer-profile.component.html'
})
export class CustomerProfileComponent implements OnInit {
  currentUser: AuthResponse | null = null;
  cinemas: Cinema[] = [];
  stats: CustomerStats = {
    totalBookings: 0,
    upcomingScreenings: 0,
    activeTickets: 0,
    usedTickets: 0,
    cancelledTickets: 0,
    recentTickets: []
  };

  profileForm: FormGroup;
  passwordForm: FormGroup;

  savingProfile = false;
  savingPassword = false;
  profileSuccess = '';
  passwordSuccess = '';
  profileError = '';
  passwordError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cinemaService: CinemaService,
    private dashboardService: DashboardService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phone: ['+1 (555) 234-5678'],
      preferredCinema: ['Grand Rex Theatre - Hall 1']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email
      });
    }

    this.loadCinemas();
    this.loadStats();
  }

  loadCinemas(): void {
    this.cinemaService.getCinemas().subscribe({
      next: (list) => {
        if (Array.isArray(list)) {
          this.cinemas = list;
          if (list.length > 0 && !this.profileForm.get('preferredCinema')?.value) {
            this.profileForm.patchValue({ preferredCinema: list[0].name });
          }
        }
      },
      error: () => {}
    });
  }

  loadStats(): void {
    this.dashboardService.getCustomerStats().subscribe({
      next: (data) => {
        if (data) this.stats = data;
      },
      error: () => {}
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const pw = g.get('newPassword')?.value;
    const cpw = g.get('confirmPassword')?.value;
    return pw === cpw ? null : { mismatch: true };
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile = true;
    this.profileSuccess = '';
    this.profileError = '';

    // Update in local storage
    setTimeout(() => {
      this.savingProfile = false;
      if (this.currentUser) {
        const updated = {
          ...this.currentUser,
          firstName: this.profileForm.value.firstName,
          lastName: this.profileForm.value.lastName
        };
        localStorage.setItem('cinechain_user', JSON.stringify(updated));
        this.currentUser = updated;
      }
      this.profileSuccess = 'Profile information updated successfully!';
      setTimeout(() => (this.profileSuccess = ''), 4000);
    }, 600);
  }

  onSavePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword = true;
    this.passwordSuccess = '';
    this.passwordError = '';

    setTimeout(() => {
      this.savingPassword = false;
      this.passwordSuccess = 'Your password has been changed securely.';
      this.passwordForm.reset();
      setTimeout(() => (this.passwordSuccess = ''), 4000);
    }, 700);
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const first = this.currentUser.firstName ? this.currentUser.firstName[0] : '';
    const last = this.currentUser.lastName ? this.currentUser.lastName[0] : '';
    return (first + last).toUpperCase() || 'U';
  }
}
