import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './statistics.component.html',
})
export class StatisticsComponent implements OnInit {
  stats: any = null;
  loading = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loading = true;
    this.dashboardService.getAdminStats().subscribe({
      next: (data) => { this.stats = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get revenueRate(): number {
    if (!this.stats) return 0;
    return this.stats.ticketsSold > 0
      ? Math.round((this.stats.usedTickets / this.stats.ticketsSold) * 100)
      : 0;
  }

  get occupancyRate(): number {
    if (!this.stats) return 0;
    const total = (this.stats.availableSeats || 0) + (this.stats.ticketsSold || 0);
    return total > 0 ? Math.round((this.stats.ticketsSold / total) * 100) : 0;
  }
}
