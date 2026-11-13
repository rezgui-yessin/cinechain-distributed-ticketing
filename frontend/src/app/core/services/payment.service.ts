import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '../models/booking.model';

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  publishableKey: string;
  bookingId: number;
  bookingReference: string;
  amount: number;
  currency: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly API_URL = '/api/payments';

  constructor(private http: HttpClient) {}

  getConfig(): Observable<{ publishableKey: string }> {
    return this.http.get<{ publishableKey: string }>(`${this.API_URL}/config`);
  }

  createPaymentIntent(bookingId: number, currency: string = 'usd'): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(`${this.API_URL}/create-payment-intent`, {
      bookingId,
      currency
    });
  }

  confirmPayment(bookingId: number, paymentIntentId: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.API_URL}/confirm-payment`, {
      bookingId,
      paymentIntentId
    });
  }
}
