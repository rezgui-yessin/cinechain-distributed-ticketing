package com.cinechain.dto.booking;

import com.cinechain.dto.ticket.TicketSummaryDto;
import com.cinechain.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDto {
    private Long id;
    private String bookingReference;
    private Long customerId;
    private String customerName;
    private Long screeningId;
    private String movieTitle;
    private LocalDateTime screeningStartTime;
    private String hallName;
    private String cinemaName;
    private String status;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private List<TicketSummaryDto> tickets;

    public static BookingDto from(Booking booking, List<TicketSummaryDto> ticketSummaries) {
        return BookingDto.builder()
                .id(booking.getId())
                .bookingReference(booking.getBookingReference())
                .customerId(booking.getCustomer().getId())
                .customerName(booking.getCustomer().getFirstName() + " " + booking.getCustomer().getLastName())
                .screeningId(booking.getScreening().getId())
                .movieTitle(booking.getScreening().getMovie().getTitle())
                .screeningStartTime(booking.getScreening().getStartTime())
                .hallName(booking.getScreening().getHall().getName())
                .cinemaName(booking.getScreening().getHall().getCinema().getName())
                .status(booking.getStatus().name())
                .totalAmount(booking.getTotalAmount())
                .createdAt(booking.getCreatedAt())
                .tickets(ticketSummaries)
                .build();
    }
}
