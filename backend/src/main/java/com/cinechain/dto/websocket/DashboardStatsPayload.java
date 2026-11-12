package com.cinechain.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Lightweight stats snapshot pushed to admin dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsPayload {
    private long totalMovies;
    private long totalCinemas;
    private long totalHalls;
    private long totalCustomers;
    private long totalScreenings;
    private long ticketsSold;
    private long availableSeats;
    private long usedTickets;
    private long cancelledTickets;
    private BigDecimal totalRevenue;
}
