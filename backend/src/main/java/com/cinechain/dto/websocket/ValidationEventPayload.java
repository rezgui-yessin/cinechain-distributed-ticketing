package com.cinechain.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Payload sent to admin validation topic when a ticket is validated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidationEventPayload {
    private Long ticketId;
    private String bookingReference;
    private String holderName;
    private String movieTitle;
    private String seatInfo;
    private String cinemaName;
    private LocalDateTime screeningTime;
    private LocalDateTime validatedAt;
    private String validatedBy; // admin email
    private boolean success;
    private String failureReason;
}
