import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-settings.component.html',
})
export class AdminSettingsComponent {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  saving = false;
  saved = false;
  passwordSaved = false;
  currentUser = this.authService.getCurrentUser();

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.profileForm = this.fb.group({
      firstName: [this.currentUser?.firstName || '', Validators.required],
      lastName: [this.currentUser?.lastName || '', Validators.required],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving = true;
    setTimeout(() => {
      this.saving = false;
      this.saved = true;
      setTimeout(() => this.saved = false, 3000);
    }, 1000);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) return;
    setTimeout(() => {
      this.passwordSaved = true;
      this.passwordForm.reset();
      setTimeout(() => this.passwordSaved = false, 3000);
    }, 1000);
  }
}
