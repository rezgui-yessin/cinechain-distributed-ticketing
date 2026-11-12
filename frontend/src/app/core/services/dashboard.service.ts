import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminStats {
  totalMovies: number;
  totalCinemas: number;
  totalHalls: number;
  totalCustomers: number;
  ticketsSold: number;
  totalRevenue: number;
  availableSeats: number;
  usedTickets: number;
  cancelledTickets: number;
  totalScreenings: number;
  revenueByCinema: { cinemaName: string; revenue: number }[];
  salesByDay: { date: string; sales: number; revenue: number }[];
  recentBookings: any[];
}

export interface CustomerStats {
  totalBookings: number;
  upcomingScreenings: number;
  activeTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  recentTickets: any[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>('http://localhost:8080/api/admin/dashboard/stats');
  }

  getCustomerStats(): Observable<CustomerStats> {
    return this.http.get<CustomerStats>('http://localhost:8080/api/customer/dashboard/stats');
  }
}
