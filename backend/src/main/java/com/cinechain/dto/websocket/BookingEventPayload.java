package com.cinechain.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Payload sent to admin topic when a new booking is created or cancelled.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingEventPayload {
    private Long bookingId;
    private String bookingReference;
    private String customerName;
    private String customerEmail;
    private String movieTitle;
    private String cinemaName;
    private LocalDateTime screeningTime;
    private int seatCount;
    private BigDecimal totalAmount;
    private String status; // CONFIRMED, CANCELLED
    private LocalDateTime createdAt;
}
