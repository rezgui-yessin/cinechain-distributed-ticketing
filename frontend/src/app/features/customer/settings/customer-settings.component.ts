import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface CustomerPreferences {
  emailBookingConfirmations: boolean;
  emailScreeningReminders: boolean;
  emailPromotions: boolean;
  emailWeeklyDigest: boolean;
  smsReminders: boolean;
  pushNotifications: boolean;
  calendarFormat: 'google' | 'apple' | 'ical';
  autoBoostQrBrightness: boolean;
  cinemaAmbianceTheme: boolean;
  defaultLanguage: 'en' | 'fr' | 'es' | 'ar';
  twoFactorAuth: boolean;
}

@Component({
  selector: 'app-customer-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './customer-settings.component.html'
})
export class CustomerSettingsComponent implements OnInit {
  saving = false;
  successMessage = '';

  settings: CustomerPreferences = {
    emailBookingConfirmations: true,
    emailScreeningReminders: true,
    emailPromotions: false,
    emailWeeklyDigest: true,
    smsReminders: true,
    pushNotifications: true,
    calendarFormat: 'google',
    autoBoostQrBrightness: true,
    cinemaAmbianceTheme: true,
    defaultLanguage: 'en',
    twoFactorAuth: false
  };

  ngOnInit(): void {
    const saved = localStorage.getItem('cinechain_customer_settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (e) {
        // use defaults
      }
    }
  }

  saveSettings(): void {
    this.saving = true;
    this.successMessage = '';

    setTimeout(() => {
      localStorage.setItem('cinechain_customer_settings', JSON.stringify(this.settings));
      this.saving = false;
      this.successMessage = 'Preferences and settings saved successfully!';
      setTimeout(() => {
        this.successMessage = '';
      }, 4000);
    }, 600);
  }

  resetDefaults(): void {
    this.settings = {
      emailBookingConfirmations: true,
      emailScreeningReminders: true,
      emailPromotions: false,
      emailWeeklyDigest: true,
      smsReminders: true,
      pushNotifications: true,
      calendarFormat: 'google',
      autoBoostQrBrightness: true,
      cinemaAmbianceTheme: true,
      defaultLanguage: 'en',
      twoFactorAuth: false
    };
    this.saveSettings();
  }
}
