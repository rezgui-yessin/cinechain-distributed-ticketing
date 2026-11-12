package com.cinechain.service;

import com.cinechain.dto.dashboard.AdminDashboardStats;
import com.cinechain.dto.dashboard.CustomerDashboardStats;
import com.cinechain.dto.movie.MovieDto;
import com.cinechain.dto.ticket.TicketDto;
import com.cinechain.entity.Booking;
import com.cinechain.entity.Movie;
import com.cinechain.entity.Ticket;
import com.cinechain.enums.Role;
import com.cinechain.enums.TicketStatus;
import com.cinechain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final MovieRepository movieRepository;
    private final CinemaRepository cinemaRepository;
    private final HallRepository hallRepository;
    private final UserRepository userRepository;
    private final ScreeningRepository screeningRepository;
    private final TicketRepository ticketRepository;
    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;

    public AdminDashboardStats getAdminStats() {
        long totalMovies = movieRepository.count();
        long totalCinemas = cinemaRepository.count();
        long totalHalls = hallRepository.count();
        long totalCustomers = userRepository.findByRole(Role.CUSTOMER).size();
        long totalScreenings = screeningRepository.count();

        long ticketsSold = ticketRepository.countByStatus(TicketStatus.ACTIVE)
                + ticketRepository.countByStatus(TicketStatus.USED);
        long usedTickets = ticketRepository.countByStatus(TicketStatus.USED);
        long cancelledTickets = ticketRepository.countByStatus(TicketStatus.CANCELLED);

        long totalSeatsInAllHalls = seatRepository.count();
        long availableSeats = Math.max(0, (totalSeatsInAllHalls * Math.max(1, totalScreenings)) - ticketsSold);

        BigDecimal revenue = bookingRepository.sumTotalRevenue();
        if (revenue == null) {
            revenue = BigDecimal.ZERO;
        }

        return AdminDashboardStats.builder()
                .totalMovies(totalMovies)
                .totalCinemas(totalCinemas)
                .totalHalls(totalHalls)
                .totalCustomers(totalCustomers)
                .totalScreenings(totalScreenings)
                .ticketsSold(ticketsSold)
                .availableSeats(availableSeats)
                .usedTickets(usedTickets)
                .cancelledTickets(cancelledTickets)
                .totalRevenue(revenue)
                .build();
    }

    public CustomerDashboardStats getCustomerStats(Long userId) {
        List<Booking> bookings = bookingRepository.findByCustomerId(userId);
        long totalBookings = bookings.size();
        long upcomingScreenings = bookingRepository.countUpcomingByCustomer(userId);

        long activeTickets = ticketRepository.countByCustomerAndStatus(userId, TicketStatus.ACTIVE);
        long usedTickets = ticketRepository.countByCustomerAndStatus(userId, TicketStatus.USED);
        long cancelledTickets = ticketRepository.countByCustomerAndStatus(userId, TicketStatus.CANCELLED);

        List<Ticket> upcoming = ticketRepository.findUpcomingByCustomer(userId);
        List<TicketDto> upcomingDtos = upcoming.stream()
                .limit(5)
                .map(TicketDto::from)
                .toList();

        Set<Movie> uniqueMovies = new LinkedHashSet<>();
        for (Booking b : bookings) {
            if (b.getScreening() != null && b.getScreening().getMovie() != null) {
                uniqueMovies.add(b.getScreening().getMovie());
            }
            if (uniqueMovies.size() >= 5) break;
        }

        List<MovieDto> recentlyBooked = uniqueMovies.stream()
                .map(MovieDto::from)
                .toList();

        return CustomerDashboardStats.builder()
                .totalBookings(totalBookings)
                .upcomingScreenings(upcomingScreenings)
                .activeTickets(activeTickets)
                .usedTickets(usedTickets)
                .cancelledTickets(cancelledTickets)
                .upcomingTickets(upcomingDtos)
                .recentlyBooked(recentlyBooked)
                .build();
    }
}
