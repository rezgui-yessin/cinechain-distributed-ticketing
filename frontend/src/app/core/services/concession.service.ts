import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConcessionItem,
  ConcessionOrder,
  ConcessionOrderStatus,
  CreateConcessionOrderRequest
} from '../models/concession.model';
import { WebSocketService, WsMessage } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class ConcessionService {
  private readonly baseUrl = '/api/concessions';

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) {}

  /**
   * Fetch full active snack & beverage menu
   */
  getMenu(): Observable<ConcessionItem[]> {
    return this.http.get<ConcessionItem[]>(`${this.baseUrl}/menu`);
  }

  /**
   * Submit new in-seat or pickup order
   */
  createOrder(request: CreateConcessionOrderRequest): Observable<ConcessionOrder> {
    return this.http.post<ConcessionOrder>(`${this.baseUrl}/orders`, request);
  }

  /**
   * Get orders for currently logged in customer
   */
  getMyOrders(): Observable<ConcessionOrder[]> {
    return this.http.get<ConcessionOrder[]>(`${this.baseUrl}/my-orders`);
  }

  /**
   * Admin / Kitchen Display: get all orders with pagination
   */
  getAllOrders(page = 0, size = 50): Observable<{ content: ConcessionOrder[]; totalElements: number }> {
    return this.http.get<{ content: ConcessionOrder[]; totalElements: number }>(
      `${this.baseUrl}/orders?page=${page}&size=${size}`
    );
  }

  /**
   * Admin / Staff: update order preparation status
   */
  updateOrderStatus(orderId: number, status: ConcessionOrderStatus): Observable<ConcessionOrder> {
    return this.http.patch<ConcessionOrder>(`${this.baseUrl}/orders/${orderId}/status`, { status });
  }

  /**
   * Real-time WebSocket stream for kitchen and live order updates
   */
  watchConcessionOrders(): Observable<WsMessage<ConcessionOrder>> {
    return this.wsService.subscribe<ConcessionOrder>('/topic/concessions');
  }
}
