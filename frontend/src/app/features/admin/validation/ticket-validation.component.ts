import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { TicketService } from '../../../core/services/ticket.service';
import { WebSocketService } from '../../../core/services/websocket.service';

interface ValidationRecord {
  id: number;
  ticketId: number;
  holderName: string;
  movieTitle: string;
  screeningTime: string;
  seatInfo: string;
  validatedAt: string;
  validatedBy: string;
  status: 'SUCCESS' | 'FAILED';
  message?: string;
}

interface ValidationResult {
  success: boolean;
  message: string;
  ticket?: {
    id: number;
    holderName: string;
    movieTitle: string;
    screeningTime: string;
    seatInfo: string;
    status: string;
  };
}

@Component({
  selector: 'app-ticket-validation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './ticket-validation.component.html',
})
export class TicketValidationComponent implements OnInit, OnDestroy {
  validationForm: FormGroup;
  validating = false;
  validationResult: ValidationResult | null = null;
  history: ValidationRecord[] = [];
  loadingHistory = false;
  private wsSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private wsService: WebSocketService
  ) {
    this.validationForm = this.fb.group({
      qrCodeData: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadHistory();
    this.listenToLiveValidations();
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  private listenToLiveValidations(): void {
    this.wsSubscription = this.wsService.validationEvents$.subscribe({
      next: (msg) => {
        if (!msg.payload) return;
        const ev = msg.payload;
        const newRecord: ValidationRecord = {
          id: Date.now(),
          ticketId: ev.ticketId,
          holderName: ev.holderName,
          movieTitle: ev.movieTitle,
          screeningTime: ev.screeningTime,
          seatInfo: ev.seatInfo,
          validatedAt: ev.validatedAt || new Date().toISOString(),
          validatedBy: ev.validatedBy,
          status: ev.success ? 'SUCCESS' : 'FAILED',
          message: ev.failureReason
        };
        // Prepend live validation to the list instantly
        this.history = [newRecord, ...this.history.slice(0, 19)];
      }
    });
  }

  loadHistory(): void {
    this.loadingHistory = true;
    this.ticketService.getValidationHistory().subscribe({
      next: (data: any) => {
        this.history = data || [];
        this.loadingHistory = false;
      },
      error: () => { this.loadingHistory = false; }
    });
  }

  validate(): void {
    if (this.validationForm.invalid) return;
    this.validating = true;
    this.validationResult = null;

    const qrCodeData = this.validationForm.value.qrCodeData.trim();
    this.ticketService.validateTicket(qrCodeData).subscribe({
      next: (result: any) => {
        this.validationResult = {
          success: true,
          message: 'Ticket validated successfully!',
          ticket: result
        };
        this.validating = false;
        this.validationForm.reset();
        this.loadHistory();
      },
      error: (err: any) => {
        this.validationResult = {
          success: false,
          message: err?.error?.message || 'Ticket validation failed. Invalid or already used ticket.'
        };
        this.validating = false;
      }
    });
  }

  clearResult(): void {
    this.validationResult = null;
    this.validationForm.reset();
  }
}
