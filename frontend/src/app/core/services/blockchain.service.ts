import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlockchainTransaction } from '../models/blockchain.model';

@Injectable({ providedIn: 'root' })
export class BlockchainService {
  private readonly API_URL = 'http://localhost:8080/api/blockchain';

  constructor(private http: HttpClient) {}

  getTransactions(page = 0, size = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.API_URL}/transactions`, { params });
  }

  getTicketTransactions(ticketId: number): Observable<BlockchainTransaction[]> {
    return this.http.get<BlockchainTransaction[]>(`${this.API_URL}/tickets/${ticketId}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/stats`);
  }
}
