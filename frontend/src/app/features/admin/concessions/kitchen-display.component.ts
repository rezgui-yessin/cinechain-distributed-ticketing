import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ConcessionService } from '../../../core/services/concession.service';
import { ConcessionOrder, ConcessionOrderStatus } from '../../../core/models/concession.model';

@Component({
  selector: 'app-kitchen-display',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kitchen-display.component.html',
})
export class KitchenDisplayComponent implements OnInit, OnDestroy {
  orders: ConcessionOrder[] = [];
  loading = false;
  statusFilter: ConcessionOrderStatus | 'ALL' = 'ALL';
  audioEnabled = true;

  private wsSub: Subscription | null = null;
  private audioCtx: AudioContext | null = null;

  constructor(private concessionService: ConcessionService) {}

  ngOnInit(): void {
    this.loadOrders();
    this.initWebSocket();
  }

  ngOnDestroy(): void {
    if (this.wsSub) this.wsSub.unsubscribe();
    if (this.audioCtx) this.audioCtx.close();
  }

  loadOrders(): void {
    this.loading = true;
    this.concessionService.getAllOrders(0, 100).subscribe({
      next: (res) => {
        this.orders = res.content || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  initWebSocket(): void {
    this.wsSub = this.concessionService.watchConcessionOrders().subscribe({
      next: (wsMsg) => {
        if (!wsMsg || !wsMsg.payload) return;
        const incomingOrder = wsMsg.payload;

        const idx = this.orders.findIndex(o => o.id === incomingOrder.id);
        if (idx !== -1) {
          this.orders[idx] = incomingOrder;
        } else {
          // New incoming order -> add to top and chime!
          this.orders.unshift(incomingOrder);
          this.playKitchenBell();
        }
      }
    });
  }

  get filteredOrders(): ConcessionOrder[] {
    return this.orders.filter(o => {
      if (this.statusFilter === 'ALL') return true;
      return o.status === this.statusFilter;
    });
  }

  get pendingCount(): number {
    return this.orders.filter(o => o.status === 'PENDING').length;
  }

  get preparingCount(): number {
    return this.orders.filter(o => o.status === 'PREPARING').length;
  }

  get deliveredCount(): number {
    return this.orders.filter(o => o.status === 'DELIVERED').length;
  }

  updateStatus(order: ConcessionOrder, newStatus: ConcessionOrderStatus): void {
    this.concessionService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (updated) => {
        const idx = this.orders.findIndex(o => o.id === updated.id);
        if (idx !== -1) this.orders[idx] = updated;
      },
      error: (err) => {
        console.error('Failed to update order status:', err);
      }
    });
  }

  playKitchenBell(): void {
    if (!this.audioEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Two-tone bright kitchen bell (880Hz -> 1760Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {
      console.warn('Audio bell error:', e);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }
}
