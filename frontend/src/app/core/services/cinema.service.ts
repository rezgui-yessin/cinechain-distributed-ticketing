import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cinema, Hall } from '../models/cinema.model';

@Injectable({ providedIn: 'root' })
export class CinemaService {
  private readonly API_URL = 'http://localhost:8080/api/cinemas';
  private readonly ADMIN_API_URL = 'http://localhost:8080/api/admin/cinemas';
  private readonly ADMIN_HALLS_URL = 'http://localhost:8080/api/admin/halls';

  constructor(private http: HttpClient) {}

  getCinemas(): Observable<Cinema[]> {
    return this.http.get<Cinema[]>(this.API_URL);
  }

  getCinema(id: number): Observable<Cinema> {
    return this.http.get<Cinema>(`${this.API_URL}/${id}`);
  }

  createCinema(data: Partial<Cinema>): Observable<Cinema> {
    return this.http.post<Cinema>(this.ADMIN_API_URL, data);
  }

  updateCinema(id: number, data: Partial<Cinema>): Observable<Cinema> {
    return this.http.put<Cinema>(`${this.ADMIN_API_URL}/${id}`, data);
  }

  deleteCinema(id: number): Observable<void> {
    return this.http.delete<void>(`${this.ADMIN_API_URL}/${id}`);
  }

  getHalls(cinemaId: number): Observable<Hall[]> {
    return this.http.get<Hall[]>(`http://localhost:8080/api/halls/cinema/${cinemaId}`);
  }

  createHall(cinemaId: number, data: Partial<Hall>): Observable<Hall> {
    return this.http.post<Hall>(this.ADMIN_HALLS_URL, { ...data, cinemaId });
  }

  getAllHalls(): Observable<Hall[]> {
    return this.http.get<Hall[]>(this.ADMIN_HALLS_URL);
  }

  createAdminHall(data: { name: string; totalCapacity: number; cinemaId: number }): Observable<Hall> {
    return this.http.post<Hall>(this.ADMIN_HALLS_URL, data);
  }

  updateAdminHall(id: number, data: { name: string; totalCapacity: number; cinemaId: number }): Observable<Hall> {
    return this.http.put<Hall>(`${this.ADMIN_HALLS_URL}/${id}`, data);
  }

  deleteAdminHall(id: number): Observable<void> {
    return this.http.delete<void>(`${this.ADMIN_HALLS_URL}/${id}`);
  }

  getAdminCinemas(): Observable<Cinema[]> {
    return this.http.get<Cinema[]>(this.ADMIN_API_URL);
  }
}
