import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { TicketService } from '../../../core/services/ticket.service';
import { WebSocketService } from '../../../core/services/websocket.service';

export interface ScanHistoryItem {
  id: string;
  ticketId?: number;
  holderName: string;
  movieTitle: string;
  seatInfo: string;
  hallName?: string;
  cinemaName?: string;
  timestamp: Date;
  status: 'VALID' | 'INVALID' | 'ALREADY_USED';
  errorMessage?: string;
}

@Component({
  selector: 'app-staff-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './staff-scanner.component.html'
})
export class StaffScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  // Camera State
  mediaStream: MediaStream | null = null;
  cameraActive = false;
  cameraError: string | null = null;
  facingMode: 'environment' | 'user' = 'environment';
  hasMultipleCameras = false;
  torchActive = false;
  hasTorch = false;
  private scanIntervalId?: any;

  // Audio Context (Synthesized Acoustic Chimes)
  audioCtx: AudioContext | null = null;
  soundEnabled = true;
  vibrationEnabled = true;

  // Validation State
  isValidating = false;
  lastScannedCode: string | null = null;
  lastScanTimestamp = 0;
  scanCooldownMs = 3000;

  // Current Verdict Card
  verdict: {
    type: 'SUCCESS' | 'ERROR';
    title: string;
    message: string;
    ticket?: any;
    timestamp: Date;
  } | null = null;

  // Manual Input Fallback & Drawer
  manualQrInput = '';
  manualModalOpen = false;
  historyDrawerOpen = false;

  // Session Statistics
  sessionStats = {
    total: 0,
    admitted: 0,
    rejected: 0,
    startTime: new Date()
  };

  scanHistory: ScanHistoryItem[] = [];
  private wsSubscription?: Subscription;

  constructor(
    private ticketService: TicketService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.initAudioContext();
    this.checkCameras();
    this.listenToWebSocket();
  }

  ngAfterViewInit(): void {
    this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
  }

  // =========================================================================
  // CAMERA STREAM ENGINE
  // =========================================================================

  async checkCameras(): Promise<void> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        this.hasMultipleCameras = videoDevices.length > 1;
      }
    } catch {
      this.hasMultipleCameras = false;
    }
  }

  async startCamera(): Promise<void> {
    this.cameraError = null;
    this.stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.cameraError = 'Camera access is not supported in this browser. Please use manual entry.';
        return;
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.cameraActive = true;

      if (this.videoElement && this.videoElement.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.mediaStream;
        await this.videoElement.nativeElement.play();
        this.checkTorchCapability();
        this.beginDetectionLoop();
      }
    } catch (err: any) {
      this.cameraActive = false;
      this.cameraError = err.message || 'Unable to access camera. Please verify camera permissions.';
    }
  }

  stopCamera(): void {
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.cameraActive = false;
  }

  toggleCameraFacing(): void {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    this.startCamera();
  }

  checkTorchCapability(): void {
    if (!this.mediaStream) return;
    const track = this.mediaStream.getVideoTracks()[0];
    if (track && typeof track.getCapabilities === 'function') {
      const caps = track.getCapabilities() as any;
      this.hasTorch = !!caps.torch;
    }
  }

  async toggleTorch(): Promise<void> {
    if (!this.mediaStream || !this.hasTorch) return;
    const track = this.mediaStream.getVideoTracks()[0];
    if (track && typeof track.applyConstraints === 'function') {
      this.torchActive = !this.torchActive;
      try {
        await track.applyConstraints({
          advanced: [{ torch: this.torchActive } as any]
        });
      } catch {
        this.torchActive = false;
      }
    }
  }

  // =========================================================================
  // BARCODE & QR DETECTION LOOP
  // =========================================================================

  private beginDetectionLoop(): void {
    // Check if window.BarcodeDetector is natively supported
    const hasBarcodeDetector = typeof (window as any).BarcodeDetector !== 'undefined';
    let barcodeDetector: any = null;

    if (hasBarcodeDetector) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
      } catch {
        barcodeDetector = null;
      }
    }

    this.scanIntervalId = setInterval(async () => {
      if (!this.cameraActive || this.isValidating || this.verdict !== null) {
        return;
      }

      const video = this.videoElement?.nativeElement;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      if (barcodeDetector) {
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              this.handleDetectedQrCode(rawValue);
            }
          }
        } catch {
          // Fallback or ignore frame error
        }
      }
    }, 250);
  }

  // =========================================================================
  // VALIDATION & VERDICT DISPATCHER
  // =========================================================================

  handleDetectedQrCode(qrData: string): void {
    const now = Date.now();
    const cleanData = qrData.trim();

    // Prevent spamming the same QR code during cooldown
    if (cleanData === this.lastScannedCode && now - this.lastScanTimestamp < this.scanCooldownMs) {
      return;
    }

    this.lastScannedCode = cleanData;
    this.lastScanTimestamp = now;
    this.executeValidation(cleanData);
  }

  executeValidation(qrCodeData: string): void {
    if (this.isValidating) return;
    this.isValidating = true;

    this.ticketService.validateTicket(qrCodeData).subscribe({
      next: (ticket: any) => {
        this.isValidating = false;
        this.sessionStats.total++;
        this.sessionStats.admitted++;

        // Trigger Acoustic Success Chime & Vibration
        this.playSuccessChime();
        this.vibrateSuccess();

        const seatString = ticket.rowLabel ? `Row ${ticket.rowLabel} • Seat ${ticket.seatNumber}` : 'General Admission';
        const typeBadge = ticket.seatType ? `(${ticket.seatType})` : '';

        this.verdict = {
          type: 'SUCCESS',
          title: 'ADMISSION GRANTED',
          message: 'Valid ticket verified on blockchain ledger.',
          ticket: {
            ...ticket,
            displaySeat: `${seatString} ${typeBadge}`
          },
          timestamp: new Date()
        };

        this.recordHistory({
          id: 'scan-' + Date.now(),
          ticketId: ticket.id,
          holderName: ticket.holderName || 'Customer Pass',
          movieTitle: ticket.movieTitle || 'Movie Screening',
          seatInfo: `${seatString} ${typeBadge}`,
          hallName: ticket.hallName,
          cinemaName: ticket.cinemaName,
          timestamp: new Date(),
          status: 'VALID'
        });

        // Auto-dismiss verdict after 4 seconds
        setTimeout(() => {
          if (this.verdict && this.verdict.type === 'SUCCESS') {
            this.clearVerdict();
          }
        }, 4000);
      },
      error: (err: any) => {
        this.isValidating = false;
        this.sessionStats.total++;
        this.sessionStats.rejected++;

        // Trigger Acoustic Rejection Buzzer & Vibration
        this.playErrorBuzzer();
        this.vibrateError();

        let errMsg = 'Invalid ticket data or signature mismatch.';
        let isAlreadyUsed = false;

        if (err.error && err.error.message) {
          errMsg = err.error.message;
          if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('used')) {
            isAlreadyUsed = true;
          }
        } else if (err.message) {
          errMsg = err.message;
        }

        this.verdict = {
          type: 'ERROR',
          title: isAlreadyUsed ? 'TICKET ALREADY USED' : 'ADMISSION REJECTED',
          message: errMsg,
          timestamp: new Date()
        };

        this.recordHistory({
          id: 'scan-' + Date.now(),
          holderName: 'Unknown / Blocked',
          movieTitle: 'Verification Failed',
          seatInfo: 'Access Denied',
          timestamp: new Date(),
          status: isAlreadyUsed ? 'ALREADY_USED' : 'INVALID',
          errorMessage: errMsg
        });
      }
    });
  }

  submitManualInput(): void {
    if (!this.manualQrInput.trim()) return;
    const code = this.manualQrInput.trim();
    this.manualQrInput = '';
    this.manualModalOpen = false;
    this.executeValidation(code);
  }

  // Quick Demo Simulator to test both outcomes on development computers
  simulateDemoScan(type: 'valid' | 'already-used' | 'invalid'): void {
    if (type === 'valid') {
      // Pick first sample data pattern
      this.executeValidation('TICKET-1-CINECHAIN-HASH-SAMPLE');
    } else if (type === 'already-used') {
      this.executeValidation('TICKET-ALREADY-USED-SIMULATED');
    } else {
      this.executeValidation('MALFORMED-QR-FAKE-TOKEN-999');
    }
  }

  clearVerdict(): void {
    this.verdict = null;
  }

  private recordHistory(item: ScanHistoryItem): void {
    this.scanHistory = [item, ...this.scanHistory.slice(0, 24)];
  }

  // =========================================================================
  // SYNTHESIZED ACOUSTIC CHIMES (WEB AUDIO API - ZERO ASSET DEPENDENCIES)
  // =========================================================================

  private initAudioContext(): void {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    } catch {
      this.audioCtx = null;
    }
  }

  playSuccessChime(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    try {
      const now = this.audioCtx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: 880 Hz (A5 - High crisp resolution)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch {
      // Audio autoplay restrictions safety
    }
  }

  playErrorBuzzer(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    try {
      const now = this.audioCtx.currentTime;

      // Dual Sawtooth Tone 1 (140 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(140, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Pulse 2 (120 Hz)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(120, now + 0.18);
      gain2.gain.setValueAtTime(0.3, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.38);
    } catch {
      // Audio autoplay restrictions safety
    }
  }

  private vibrateSuccess(): void {
    if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([70, 40, 70]); } catch {}
    }
  }

  private vibrateError(): void {
    if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([220, 80, 220]); } catch {}
    }
  }

  // =========================================================================
  // WEBSOCKET PEER BROADCASTS
  // =========================================================================

  private listenToWebSocket(): void {
    this.wsSubscription = this.wsService.validationEvents$.subscribe({
      next: (msg) => {
        if (!msg.payload) return;
        const ev = msg.payload;
        // If event came from another scanner/peer, update local drawer counter
        const exists = this.scanHistory.some(h => h.ticketId === ev.ticketId && Math.abs(h.timestamp.getTime() - new Date(ev.validatedAt).getTime()) < 2000);
        if (!exists) {
          this.recordHistory({
            id: 'ws-' + Date.now(),
            ticketId: ev.ticketId,
            holderName: ev.holderName || 'Peer Gate Admission',
            movieTitle: ev.movieTitle || 'Auditorium Screening',
            seatInfo: ev.seatInfo || 'Seat Assigned',
            hallName: ev.hallName,
            cinemaName: ev.cinemaName,
            timestamp: new Date(ev.validatedAt || Date.now()),
            status: ev.success ? 'VALID' : 'INVALID'
          });
        }
      }
    });
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
}
