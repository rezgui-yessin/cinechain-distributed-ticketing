import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CinemaService } from '../../../core/services/cinema.service';
import { Hall, Cinema } from '../../../core/models/cinema.model';

@Component({
  selector: 'app-hall-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './hall-management.component.html',
  styleUrls: []
})
export class HallManagementComponent implements OnInit {
  halls: Hall[] = [];
  filteredHalls: Hall[] = [];
  cinemas: Cinema[] = [];
  loading = true;
  selectedCinemaFilter = '';
  searchTerm = '';

  isModalOpen = false;
  isEditing = false;
  currentHallId: number | null = null;
  hallForm!: FormGroup;
  deleteConfirmId: number | null = null;

  selectedHallForPreview: Hall | null = null;
  isPreviewOpen = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private cinemaService: CinemaService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCinemas();
    this.loadHalls();
  }

  initForm(): void {
    this.hallForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      cinemaId: ['', [Validators.required]],
      totalCapacity: [100, [Validators.required, Validators.min(10), Validators.max(1000)]]
    });
  }

  loadCinemas(): void {
    this.cinemaService.getCinemas().subscribe({
      next: (data) => {
        this.cinemas = data || [];
      },
      error: (err) => console.error('Error fetching cinemas', err)
    });
  }

  loadHalls(): void {
    this.loading = true;
    this.cinemaService.getAllHalls().subscribe({
      next: (data) => {
        this.halls = data || [];
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching halls', err);
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    this.filteredHalls = this.halls.filter(h => {
      const matchCinema = !this.selectedCinemaFilter || h.cinemaId.toString() === this.selectedCinemaFilter;
      const matchSearch = !this.searchTerm || 
        h.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (h.cinemaName && h.cinemaName.toLowerCase().includes(this.searchTerm.toLowerCase()));
      return matchCinema && matchSearch;
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.currentHallId = null;
    this.initForm();
    if (this.cinemas.length > 0) {
      this.hallForm.patchValue({ cinemaId: this.cinemas[0].id });
    }
    this.errorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(hall: Hall): void {
    this.isEditing = true;
    this.currentHallId = hall.id;
    this.errorMessage = '';
    this.hallForm.patchValue({
      name: hall.name,
      cinemaId: hall.cinemaId,
      totalCapacity: hall.totalCapacity
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentHallId = null;
  }

  saveHall(): void {
    if (this.hallForm.invalid) {
      this.hallForm.markAllAsTouched();
      return;
    }

    const payload = {
      name: this.hallForm.value.name,
      totalCapacity: Number(this.hallForm.value.totalCapacity),
      cinemaId: Number(this.hallForm.value.cinemaId)
    };

    if (this.isEditing && this.currentHallId) {
      this.cinemaService.updateAdminHall(this.currentHallId, payload).subscribe({
        next: () => {
          this.showSuccess('Auditorium updated successfully');
          this.closeModal();
          this.loadHalls();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update hall';
        }
      });
    } else {
      this.cinemaService.createAdminHall(payload).subscribe({
        next: () => {
          this.showSuccess('Auditorium created successfully');
          this.closeModal();
          this.loadHalls();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create hall';
        }
      });
    }
  }

  openPreview(hall: Hall): void {
    this.selectedHallForPreview = hall;
    this.isPreviewOpen = true;
  }

  closePreview(): void {
    this.selectedHallForPreview = null;
    this.isPreviewOpen = false;
  }

  confirmDelete(id: number): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  deleteHall(id: number): void {
    this.cinemaService.deleteAdminHall(id).subscribe({
      next: () => {
        this.showSuccess('Hall deleted successfully');
        this.deleteConfirmId = null;
        this.loadHalls();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete hall';
        this.deleteConfirmId = null;
      }
    });
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 4000);
  }

  getCinemaName(cinemaId: number): string {
    const c = this.cinemas.find(item => item.id === cinemaId);
    return c ? c.name : `Cinema #${cinemaId}`;
  }
}
