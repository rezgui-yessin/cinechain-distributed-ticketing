import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { AuthService } from './auth.service';

export interface WsMessage<T = any> {
  type: string;
  payload: T;
  message?: string;
  timestamp?: string;
}

export interface SeatUpdatePayload {
  screeningId: number;
  seatId: number;
  rowLabel: string;
  seatNumber: number;
  seatType: string;
  available: boolean;
  remainingSeats?: number;
}

export interface BookingEventPayload {
  bookingId: number;
  bookingReference: string;
  customerName?: string;
  customerEmail?: string;
  movieTitle?: string;
  cinemaName?: string;
  screeningTime?: string;
  seatCount?: number;
  totalAmount?: number;
  status: string;
  createdAt?: string;
}

export interface ValidationEventPayload {
  ticketId: number;
  bookingReference: string;
  holderName: string;
  movieTitle: string;
  seatInfo: string;
  cinemaName: string;
  hallName?: string;
  screeningTime: string;
  validatedAt: string;
  validatedBy: string;
  success: boolean;
  failureReason?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  actionUrl?: string;
  referenceId?: number;
}

/**
 * Universal WebSocket / STOMP Service for CineChain.
 * Handles auto-reconnect, topic subscriptions, and typed streams.
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<{ destination: string; message: WsMessage }>();
  private connectionStatus$ = new Subject<boolean>();
  private isConnected = false;
  private reconnectTimer: any = null;
  private subscriptions = new Map<string, string>(); // subId -> destination
  private subCounter = 0;

  // Dedicated streams
  public readonly seatUpdates$ = this.messageSubject.pipe(
    filter(m => m.destination.startsWith('/topic/seats/')),
    map(m => m.message as WsMessage<SeatUpdatePayload>)
  );

  public readonly bookingEvents$ = this.messageSubject.pipe(
    filter(m => m.destination === '/topic/bookings'),
    map(m => m.message as WsMessage<BookingEventPayload>)
  );

  public readonly validationEvents$ = this.messageSubject.pipe(
    filter(m => m.destination === '/topic/validation'),
    map(m => m.message as WsMessage<ValidationEventPayload>)
  );

  public readonly dashboardStats$ = this.messageSubject.pipe(
    filter(m => m.destination === '/topic/dashboard'),
    map(m => m.message as WsMessage<any>)
  );

  public readonly notifications$ = this.messageSubject.pipe(
    filter(m => m.destination.includes('/queue/notifications')),
    map(m => m.message as WsMessage<NotificationPayload>)
  );

  constructor(private authService: AuthService) {
    this.connect();
  }

  public connect(): void {
    if (this.isConnected || this.socket) return;

    try {
      const wsUrl = window.location.hostname === 'localhost'
        ? 'ws://localhost:8080/ws-native'
        : 'wss://cinechain-backend-production.up.railway.app/ws-native';
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.sendFrame('CONNECT', {
          'accept-version': '1.2',
          'heart-beat': '10000,10000'
        });
      };

      this.socket.onmessage = (event) => {
        this.handleRawMessage(event.data);
      };

      this.socket.onerror = (err) => {
        console.warn('WebSocket error, falling back to reconnect', err);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.connectionStatus$.next(false);
        this.socket = null;
        this.scheduleReconnect();
      };
    } catch (e) {
      console.warn('Failed to open native WebSocket, scheduled reconnect:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 4000);
  }

  /**
   * Subscribe to a STOMP topic and return an Observable of messages.
   */
  public subscribe<T>(destination: string): Observable<WsMessage<T>> {
    const subId = 'sub-' + (++this.subCounter);
    this.subscriptions.set(subId, destination);

    if (this.isConnected) {
      this.sendFrame('SUBSCRIBE', { id: subId, destination });
    }

    return this.messageSubject.asObservable().pipe(
      filter(msg => msg.destination === destination),
      map(msg => msg.message as WsMessage<T>)
    );
  }

  /**
   * Watch live seats for a specific screening.
   */
  public watchSeats(screeningId: number): Observable<WsMessage<SeatUpdatePayload>> {
    const destination = `/topic/seats/${screeningId}`;
    return this.subscribe<SeatUpdatePayload>(destination);
  }

  /**
   * Send a STOMP frame.
   */
  private sendFrame(command: string, headers: Record<string, string>, body = ''): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    let frame = command + '\n';
    for (const [key, value] of Object.entries(headers)) {
      frame += `${key}:${value}\n`;
    }
    frame += '\n' + body + '\0';
    this.socket.send(frame);
  }

  /**
   * Simple parser for STOMP frames over raw WebSocket.
   */
  private handleRawMessage(raw: string): void {
    const frames = raw.split('\0');
    for (const frame of frames) {
      const trimmed = frame.trim();
      if (!trimmed) continue;

      const lines = trimmed.split('\n');
      const command = lines[0];
      const headers: Record<string, string> = {};
      let bodyIndex = -1;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === '') {
          bodyIndex = i + 1;
          break;
        }
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          headers[line.substring(0, colonIndex)] = line.substring(colonIndex + 1);
        }
      }

      const body = bodyIndex >= 0 ? lines.slice(bodyIndex).join('\n') : '';

      if (command === 'CONNECTED') {
        this.isConnected = true;
        this.connectionStatus$.next(true);

        // Re-subscribe all active subscriptions
        this.subscriptions.forEach((dest, subId) => {
          this.sendFrame('SUBSCRIBE', { id: subId, destination: dest });
        });

        // Also subscribe to personal notifications if authenticated
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.userId) {
          this.subscribe(`/user/${currentUser.userId}/queue/notifications`);
        }
        // Subscribe to admin topics if admin
        if (this.authService.isAdmin()) {
          this.subscribe('/topic/bookings');
          this.subscribe('/topic/validation');
          this.subscribe('/topic/dashboard');
        }
      } else if (command === 'MESSAGE') {
        const destination = headers['destination'] || '';
        try {
          const parsed = JSON.parse(body) as WsMessage;
          this.messageSubject.next({ destination, message: parsed });
        } catch {
          this.messageSubject.next({
            destination,
            message: { type: 'INFO', payload: body, message: body }
          });
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
