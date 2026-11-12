import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Screening } from '../models/screening.model';
import { Seat } from '../models/cinema.model';

@Injectable({ providedIn: 'root' })
export class ScreeningService {
  private readonly API_URL = 'http://localhost:8080/api/screenings';
  private readonly ADMIN_URL = 'http://localhost:8080/api/admin/screenings';

  constructor(private http: HttpClient) {}

  getScreenings(movieId?: number, page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (movieId) params = params.set('movieId', movieId.toString());
    return this.http.get<any>(this.API_URL, { params });
  }

  getScreening(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${this.API_URL}/${id}`);
  }

  createScreening(data: any): Observable<Screening> {
    return this.http.post<Screening>(this.ADMIN_URL, data);
  }

  updateScreening(id: number, data: any): Observable<Screening> {
    return this.http.put<Screening>(`${this.ADMIN_URL}/${id}`, data);
  }

  deleteScreening(id: number): Observable<void> {
    return this.http.delete<void>(`${this.ADMIN_URL}/${id}`);
  }

  getAvailableSeats(screeningId: number): Observable<Seat[]> {
    return this.http.get<Seat[]>(`${this.API_URL}/${screeningId}/seats`);
  }

  getAdminScreenings(page = 0, size = 50): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(this.ADMIN_URL, { params });
  }
}
