import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CinemaService } from '../../../core/services/cinema.service';
import { Cinema } from '../../../core/models/cinema.model';

@Component({
  selector: 'app-cinema-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cinema-management.component.html',
  styleUrls: []
})
export class CinemaManagementComponent implements OnInit {
  cinemas: Cinema[] = [];
  filteredCinemas: Cinema[] = [];
  searchTerm = '';
  loading = true;

  isModalOpen = false;
  isEditing = false;
  currentCinemaId: number | null = null;
  cinemaForm!: FormGroup;
  deleteConfirmId: number | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(
    private cinemaService: CinemaService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCinemas();
  }

  initForm(): void {
    this.cinemaForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      imageUrl: ['']
    });
  }

  loadCinemas(): void {
    this.loading = true;
    this.cinemaService.getCinemas().subscribe({
      next: (data) => {
        this.cinemas = data || [];
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching cinemas', err);
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredCinemas = [...this.cinemas];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCinemas = this.cinemas.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.city.toLowerCase().includes(term) ||
        c.address.toLowerCase().includes(term)
      );
    }
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.currentCinemaId = null;
    this.initForm();
    this.errorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(cinema: Cinema): void {
    this.isEditing = true;
    this.currentCinemaId = cinema.id;
    this.errorMessage = '';
    this.cinemaForm.patchValue({
      name: cinema.name,
      address: cinema.address,
      city: cinema.city,
      phone: cinema.phone,
      email: cinema.email,
      imageUrl: cinema.imageUrl || ''
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentCinemaId = null;
  }

  saveCinema(): void {
    if (this.cinemaForm.invalid) {
      this.cinemaForm.markAllAsTouched();
      return;
    }

    const payload = this.cinemaForm.value;

    if (this.isEditing && this.currentCinemaId) {
      this.cinemaService.updateCinema(this.currentCinemaId, payload).subscribe({
        next: () => {
          this.showSuccess('Cinema updated successfully');
          this.closeModal();
          this.loadCinemas();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update cinema';
        }
      });
    } else {
      this.cinemaService.createCinema(payload).subscribe({
        next: () => {
          this.showSuccess('Cinema created successfully');
          this.closeModal();
          this.loadCinemas();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create cinema';
        }
      });
    }
  }

  confirmDelete(id: number): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  deleteCinema(id: number): void {
    this.cinemaService.deleteCinema(id).subscribe({
      next: () => {
        this.showSuccess('Cinema deleted successfully');
        this.deleteConfirmId = null;
        this.loadCinemas();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete cinema';
        this.deleteConfirmId = null;
      }
    });
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 4000);
  }
}
