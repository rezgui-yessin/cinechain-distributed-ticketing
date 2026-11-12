package com.cinechain.dto.dashboard;

import com.cinechain.dto.movie.MovieDto;
import com.cinechain.dto.ticket.TicketDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDashboardStats {
    private long totalBookings;
    private long upcomingScreenings;
    private long activeTickets;
    private long usedTickets;
    private long cancelledTickets;
    private List<TicketDto> upcomingTickets;
    private List<MovieDto> recentlyBooked;
}
