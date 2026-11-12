package com.cinechain.dto.websocket;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Generic WebSocket envelope sent to all subscribers on a topic.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WsMessage<T> {

    public enum Type {
        // Seat events
        SEAT_BOOKED,
        SEAT_RELEASED,
        SEAT_AVAILABILITY_UPDATE,

        // Booking events
        BOOKING_CREATED,
        BOOKING_CANCELLED,

        // Ticket / validation events
        TICKET_VALIDATED,
        TICKET_CANCELLED,

        // Dashboard / stats
        STATS_UPDATE,

        // Concessions / Snack Orders
        CONCESSION_ORDER_CREATED,
        CONCESSION_ORDER_UPDATED,

        // Customer notification
        NOTIFICATION,

        // Generic
        INFO,
        ERROR
    }

    private Type type;
    private T payload;
    private String message;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // ---- factory helpers ----

    public static <T> WsMessage<T> of(Type type, T payload) {
        return WsMessage.<T>builder().type(type).payload(payload).build();
    }

    public static <T> WsMessage<T> of(Type type, T payload, String message) {
        return WsMessage.<T>builder().type(type).payload(payload).message(message).build();
    }
}
