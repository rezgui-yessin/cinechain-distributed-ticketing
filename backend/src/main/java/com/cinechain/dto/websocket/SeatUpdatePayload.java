package com.cinechain.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload sent when a seat's availability changes in a screening.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatUpdatePayload {
    private Long screeningId;
    private Long seatId;
    private String rowLabel;
    private int seatNumber;
    private String seatType;   // STANDARD, PREMIUM, VIP
    private boolean available; // false = just booked, true = released
    private int remainingSeats;
}
