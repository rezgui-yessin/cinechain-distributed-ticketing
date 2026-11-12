import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ScreeningService } from '../../../core/services/screening.service';
import { MovieService } from '../../../core/services/movie.service';
import { CinemaService } from '../../../core/services/cinema.service';
import { Screening } from '../../../core/models/screening.model';
import { Movie } from '../../../core/models/movie.model';
import { Cinema, Hall } from '../../../core/models/cinema.model';

@Component({
  selector: 'app-screening-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './screening-management.component.html',
  styleUrls: []
})
export class ScreeningManagementComponent implements OnInit {
  screenings: Screening[] = [];
  filteredScreenings: Screening[] = [];
  movies: Movie[] = [];
  cinemas: Cinema[] = [];
  halls: Hall[] = [];
  filteredHallsForForm: Hall[] = [];

  loading = true;
  selectedStatusFilter = '';
  selectedMovieFilter = '';
  selectedCinemaFilter = '';

  isModalOpen = false;
  isEditing = false;
  currentScreeningId: number | null = null;
  screeningForm!: FormGroup;
  deleteConfirmId: number | null = null;

  errorMessage = '';
  successMessage = '';

  statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  constructor(
    private screeningService: ScreeningService,
    private movieService: MovieService,
    private cinemaService: CinemaService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadInitialData();
  }

  initForm(): void {
    const now = new Date();
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    this.screeningForm = this.fb.group({
      movieId: ['', [Validators.required]],
      cinemaId: [''],
      hallId: ['', [Validators.required]],
      startTime: [this.formatDateForInput(now), [Validators.required]],
      endTime: [this.formatDateForInput(inTwoHours), [Validators.required]],
      price: [12.50, [Validators.required, Validators.min(1)]],
      status: ['SCHEDULED', [Validators.required]]
    });

    this.screeningForm.get('cinemaId')?.valueChanges.subscribe(cinemaId => {
      if (cinemaId) {
        this.filteredHallsForForm = this.halls.filter(h => h.cinemaId.toString() === cinemaId.toString());
      } else {
        this.filteredHallsForForm = [...this.halls];
      }
    });
  }

  formatDateForInput(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  loadInitialData(): void {
    this.loading = true;

    // Load movies
    this.movieService.getMovies(0, 100).subscribe({
      next: (res) => {
        this.movies = res?.content || res || [];
      }
    });

    // Load cinemas
    this.cinemaService.getCinemas().subscribe({
      next: (res) => {
        this.cinemas = res || [];
      }
    });

    // Load halls
    this.cinemaService.getAllHalls().subscribe({
      next: (res) => {
        this.halls = res || [];
        this.filteredHallsForForm = [...this.halls];
      }
    });

    this.loadScreenings();
  }

  loadScreenings(): void {
    this.loading = true;
    this.screeningService.getAdminScreenings(0, 100).subscribe({
      next: (res) => {
        this.screenings = res?.content || res || [];
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching screenings', err);
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    this.filteredScreenings = this.screenings.filter(s => {
      const matchStatus = !this.selectedStatusFilter || s.status === this.selectedStatusFilter;
      const matchMovie = !this.selectedMovieFilter || s.movieId.toString() === this.selectedMovieFilter;
      const matchCinema = !this.selectedCinemaFilter || s.cinemaId?.toString() === this.selectedCinemaFilter;
      return matchStatus && matchMovie && matchCinema;
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.currentScreeningId = null;
    this.initForm();
    if (this.movies.length > 0) {
      this.screeningForm.patchValue({ movieId: this.movies[0].id });
    }
    if (this.cinemas.length > 0) {
      this.screeningForm.patchValue({ cinemaId: this.cinemas[0].id });
    }
    if (this.filteredHallsForForm.length > 0) {
      this.screeningForm.patchValue({ hallId: this.filteredHallsForForm[0].id });
    }
    this.errorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(screening: Screening): void {
    this.isEditing = true;
    this.currentScreeningId = screening.id;
    this.errorMessage = '';

    const cinemaId = screening.cinemaId || '';
    if (cinemaId) {
      this.filteredHallsForForm = this.halls.filter(h => h.cinemaId.toString() === cinemaId.toString());
    } else {
      this.filteredHallsForForm = [...this.halls];
    }

    this.screeningForm.patchValue({
      movieId: screening.movieId,
      cinemaId: cinemaId,
      hallId: screening.hallId,
      startTime: screening.startTime ? screening.startTime.substring(0, 16) : '',
      endTime: screening.endTime ? screening.endTime.substring(0, 16) : '',
      price: screening.price,
      status: screening.status
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentScreeningId = null;
  }

  saveScreening(): void {
    if (this.screeningForm.invalid) {
      this.screeningForm.markAllAsTouched();
      return;
    }

    const formVal = this.screeningForm.value;
    const payload = {
      movieId: Number(formVal.movieId),
      hallId: Number(formVal.hallId),
      startTime: formVal.startTime,
      endTime: formVal.endTime,
      price: Number(formVal.price),
      status: formVal.status
    };

    if (this.isEditing && this.currentScreeningId) {
      this.screeningService.updateScreening(this.currentScreeningId, payload).subscribe({
        next: () => {
          this.showSuccess('Screening updated successfully');
          this.closeModal();
          this.loadScreenings();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update screening';
        }
      });
    } else {
      this.screeningService.createScreening(payload).subscribe({
        next: () => {
          this.showSuccess('Screening scheduled successfully');
          this.closeModal();
          this.loadScreenings();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create screening';
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

  deleteScreening(id: number): void {
    this.screeningService.deleteScreening(id).subscribe({
      next: () => {
        this.showSuccess('Screening cancelled and removed');
        this.deleteConfirmId = null;
        this.loadScreenings();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete screening';
        this.deleteConfirmId = null;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300';
    }
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 4000);
  }
}
