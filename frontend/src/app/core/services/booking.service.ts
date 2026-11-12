import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking, BookingRequest } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly API_URL = 'http://localhost:8080/api/bookings';

  constructor(private http: HttpClient) {}

  createBooking(request: BookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.API_URL, request);
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API_URL}/my`);
  }

  getAdminBookings(page = 0, size = 10, status?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) params = params.set('status', status);
    return this.http.get<any>('http://localhost:8080/api/admin/bookings', { params });
  }

  getBooking(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.API_URL}/${id}`);
  }

  cancelBooking(id: number): Observable<Booking> {
    return this.http.post<Booking>(`${this.API_URL}/${id}/cancel`, {});
  }
}
