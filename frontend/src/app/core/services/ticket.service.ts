import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly API_URL = '/api/tickets';

  constructor(private http: HttpClient) {}

  getMyTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.API_URL}/my`);
  }

  getTicket(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.API_URL}/${id}`);
  }

  cancelTicket(id: number): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.API_URL}/${id}/cancel`, {});
  }

  changeHolderName(id: number, name: string): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.API_URL}/${id}/holder`, { holderName: name });
  }

  validateTicket(qrCodeData: string): Observable<any> {
    return this.http.post<any>(`/api/validation/validate`, { qrCodeData });
  }

  getValidationHistory(): Observable<any[]> {
    return this.http.get<any[]>(`/api/validation/history`);
  }
}
