import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

export interface CustomerPage {
  content: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly API_URL = '/api/admin/customers';

  constructor(private http: HttpClient) {}

  getCustomers(page = 0, size = 20): Observable<CustomerPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomerPage>(this.API_URL, { params });
  }

  getCustomerById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`);
  }

  toggleCustomerStatus(id: number, enabled: boolean): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/${id}/status`, { enabled });
  }

  // Alias used by component
  toggleStatus(id: number, enabled: boolean): Observable<User> {
    return this.toggleCustomerStatus(id, enabled);
  }
}
