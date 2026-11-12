package com.cinechain.dto.ticket;

import com.cinechain.entity.Ticket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketDto {
    private Long id;
    private Long bookingId;
    private String bookingReference;
    private String holderName;
    private String qrCode;
    private String qrCodeData;
    private String status;
    private LocalDateTime validatedAt;
    private LocalDateTime createdAt;

    // Seat info
    private Long seatId;
    private String rowLabel;
    private int seatNumber;
    private String seatType;

    // Movie info
    private Long movieId;
    private String movieTitle;
    private String moviePosterUrl;

    // Screening info
    private Long screeningId;
    private LocalDateTime screeningStartTime;
    private LocalDateTime screeningEndTime;
    private String hallName;
    private String cinemaName;

    public static TicketDto from(Ticket ticket) {
        return TicketDto.builder()
                .id(ticket.getId())
                .bookingId(ticket.getBooking().getId())
                .bookingReference(ticket.getBooking().getBookingReference())
                .holderName(ticket.getHolderName())
                .qrCode(ticket.getQrCode())
                .qrCodeData(ticket.getQrCodeData())
                .status(ticket.getStatus().name())
                .validatedAt(ticket.getValidatedAt())
                .createdAt(ticket.getCreatedAt())
                .seatId(ticket.getSeat().getId())
                .rowLabel(ticket.getSeat().getRowLabel())
                .seatNumber(ticket.getSeat().getSeatNumber())
                .seatType(ticket.getSeat().getSeatType().name())
                .movieId(ticket.getBooking().getScreening().getMovie().getId())
                .movieTitle(ticket.getBooking().getScreening().getMovie().getTitle())
                .moviePosterUrl(ticket.getBooking().getScreening().getMovie().getPosterUrl())
                .screeningId(ticket.getBooking().getScreening().getId())
                .screeningStartTime(ticket.getBooking().getScreening().getStartTime())
                .screeningEndTime(ticket.getBooking().getScreening().getEndTime())
                .hallName(ticket.getBooking().getScreening().getHall().getName())
                .cinemaName(ticket.getBooking().getScreening().getHall().getCinema().getName())
                .build();
    }
}
