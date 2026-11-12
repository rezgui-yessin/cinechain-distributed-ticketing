import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConcessionService } from '../../../core/services/concession.service';
import { TicketService } from '../../../core/services/ticket.service';
import {
  ConcessionCategory,
  ConcessionItem,
  ConcessionOrder,
  CreateConcessionOrderRequest
} from '../../../core/models/concession.model';
import { Ticket } from '../../../core/models/ticket.model';

interface CartEntry {
  item: ConcessionItem;
  quantity: number;
  options: string;
}

@Component({
  selector: 'app-in-seat-concessions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './in-seat-concessions.component.html',
})
export class InSeatConcessionsComponent implements OnInit, OnDestroy {
  menu: ConcessionItem[] = [];
  categories: { label: string; value: ConcessionCategory | 'ALL' }[] = [
    { label: 'All Items', value: 'ALL' },
    { label: 'Combos & Packs', value: 'COMBOS' },
    { label: 'Gourmet Popcorn', value: 'POPCORN' },
    { label: 'Hot Cinema Bites', value: 'HOT_BITES' },
    { label: 'Artisan Beverages', value: 'BEVERAGES' },
    { label: 'Sweets & Snacks', value: 'SNACKS' },
  ];
  selectedCategory: ConcessionCategory | 'ALL' = 'ALL';
  searchQuery = '';

  cart: Map<number, CartEntry> = new Map();
  isCartOpen = false;
  isOrderSubmitting = false;

  customerTickets: Ticket[] = [];
  selectedTicketId: number | null = null;
  deliveryType: 'IN_SEAT' | 'COUNTER_PICKUP' = 'IN_SEAT';
  deliveryNotes = '';

  activeOrders: ConcessionOrder[] = [];
  showOrdersModal = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  private wsSub: Subscription | null = null;

  constructor(
    private concessionService: ConcessionService,
    private ticketService: TicketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadMenu();
    this.loadTickets();
    this.loadMyOrders();

    // Check query params for deep linked ticketId (e.g. from ticket view)
    this.route.queryParams.subscribe(params => {
      if (params['ticketId']) {
        this.selectedTicketId = +params['ticketId'];
      }
    });

    // Listen to real-time status updates via WebSocket
    this.wsSub = this.concessionService.watchConcessionOrders().subscribe({
      next: (wsMsg) => {
        if (wsMsg && wsMsg.payload) {
          const updated = wsMsg.payload;
          // Refresh order list if customer owns it
          const idx = this.activeOrders.findIndex(o => o.id === updated.id);
          if (idx !== -1) {
            this.activeOrders[idx] = updated;
          } else {
            this.loadMyOrders();
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.wsSub) this.wsSub.unsubscribe();
  }

  loadMenu(): void {
    this.concessionService.getMenu().subscribe({
      next: (data) => { this.menu = data; },
      error: (err) => { console.error('Failed to load menu:', err); }
    });
  }

  loadTickets(): void {
    this.ticketService.getMyTickets().subscribe({
      next: (tickets) => {
        // Filter active tickets
        this.customerTickets = (tickets || []).filter(t => t.status === 'ACTIVE');
        if (this.customerTickets.length > 0 && !this.selectedTicketId) {
          this.selectedTicketId = this.customerTickets[0].id;
        }
      },
      error: () => {}
    });
  }

  loadMyOrders(): void {
    this.concessionService.getMyOrders().subscribe({
      next: (orders) => { this.activeOrders = orders; },
      error: () => {}
    });
  }

  get filteredMenu(): ConcessionItem[] {
    return this.menu.filter(item => {
      const matchCat = this.selectedCategory === 'ALL' || item.category === this.selectedCategory;
      const matchQuery = !this.searchQuery ||
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }

  get selectedTicket(): Ticket | undefined {
    return this.customerTickets.find(t => t.id === this.selectedTicketId);
  }

  getItemQuantity(itemId: number): number {
    return this.cart.get(itemId)?.quantity || 0;
  }

  incrementItem(item: ConcessionItem): void {
    const current = this.cart.get(item.id);
    if (current) {
      current.quantity++;
    } else {
      this.cart.set(item.id, { item, quantity: 1, options: '' });
    }
  }

  decrementItem(item: ConcessionItem): void {
    const current = this.cart.get(item.id);
    if (!current) return;
    if (current.quantity > 1) {
      current.quantity--;
    } else {
      this.cart.delete(item.id);
    }
  }

  get cartEntries(): CartEntry[] {
    return Array.from(this.cart.values());
  }

  get totalItemsCount(): number {
    return this.cartEntries.reduce((sum, e) => sum + e.quantity, 0);
  }

  get totalPrice(): number {
    return this.cartEntries.reduce((sum, e) => sum + (e.item.price * e.quantity), 0);
  }

  submitOrder(): void {
    if (this.cartEntries.length === 0) return;

    this.isOrderSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const ticket = this.selectedTicket;

    const request: CreateConcessionOrderRequest = {
      ticketId: this.deliveryType === 'IN_SEAT' ? (ticket?.id || undefined) : undefined,
      deliveryType: this.deliveryType,
      notes: this.deliveryNotes,
      items: this.cartEntries.map(e => ({
        itemId: e.item.id,
        quantity: e.quantity,
        options: e.options || undefined
      }))
    };

    this.concessionService.createOrder(request).subscribe({
      next: (order) => {
        this.isOrderSubmitting = false;
        this.cart.clear();
        this.isCartOpen = false;
        this.successMessage = `Order #${order.orderNumber} placed successfully! Delivery destination: ${order.seatLabel}.`;
        this.loadMyOrders();
        setTimeout(() => this.successMessage = null, 8000);
      },
      error: (err) => {
        this.isOrderSubmitting = false;
        this.errorMessage = err?.error?.message || 'Failed to submit in-seat order. Please try again.';
      }
    });
  }

  statusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'PREPARING': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'DELIVERED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'CANCELLED': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  }
}
