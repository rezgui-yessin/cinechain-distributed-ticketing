package com.cinechain.service;

import com.cinechain.dto.websocket.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Central service for broadcasting WebSocket events to all connected clients.
 *
 * Topics:
 *   /topic/seats/{screeningId}   — seat availability changes
 *   /topic/bookings              — new booking / cancellation events (admin)
 *   /topic/validation            — ticket validation events (admin)
 *   /topic/dashboard             — admin dashboard stats refresh
 *   /user/{userId}/queue/notifications — personal customer notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    // -------------------------------------------------------------------------
    // Seat availability
    // -------------------------------------------------------------------------

    /**
     * Broadcast when one or more seats are booked for a screening.
     */
    public void publishSeatBooked(SeatUpdatePayload payload) {
        String topic = "/topic/seats/" + payload.getScreeningId();
        WsMessage<SeatUpdatePayload> msg = WsMessage.of(WsMessage.Type.SEAT_BOOKED, payload,
                "Seat " + payload.getRowLabel() + payload.getSeatNumber() + " just booked");
        messagingTemplate.convertAndSend(topic, msg);
        log.debug("WS >> {} : seat {} booked", topic, payload.getSeatId());
    }

    /**
     * Broadcast when a seat is released (ticket cancelled).
     */
    public void publishSeatReleased(SeatUpdatePayload payload) {
        String topic = "/topic/seats/" + payload.getScreeningId();
        WsMessage<SeatUpdatePayload> msg = WsMessage.of(WsMessage.Type.SEAT_RELEASED, payload,
                "Seat " + payload.getRowLabel() + payload.getSeatNumber() + " is now available");
        messagingTemplate.convertAndSend(topic, msg);
        log.debug("WS >> {} : seat {} released", topic, payload.getSeatId());
    }

    // -------------------------------------------------------------------------
    // Booking events
    // -------------------------------------------------------------------------

    /**
     * Notify admin topic of a new booking.
     */
    public void publishBookingCreated(BookingEventPayload payload) {
        WsMessage<BookingEventPayload> msg = WsMessage.of(WsMessage.Type.BOOKING_CREATED, payload,
                "New booking: " + payload.getBookingReference());
        messagingTemplate.convertAndSend("/topic/bookings", msg);
        log.debug("WS >> /topic/bookings : new booking {}", payload.getBookingReference());
    }

    /**
     * Notify admin topic of a booking cancellation.
     */
    public void publishBookingCancelled(BookingEventPayload payload) {
        WsMessage<BookingEventPayload> msg = WsMessage.of(WsMessage.Type.BOOKING_CANCELLED, payload,
                "Booking cancelled: " + payload.getBookingReference());
        messagingTemplate.convertAndSend("/topic/bookings", msg);
        log.debug("WS >> /topic/bookings : cancelled {}", payload.getBookingReference());
    }

    // -------------------------------------------------------------------------
    // Ticket validation
    // -------------------------------------------------------------------------

    /**
     * Notify admin validation topic of a successful validation.
     */
    public void publishValidation(ValidationEventPayload payload) {
        WsMessage<ValidationEventPayload> msg = WsMessage.of(WsMessage.Type.TICKET_VALIDATED, payload,
                payload.isSuccess()
                        ? "Ticket #" + payload.getTicketId() + " validated"
                        : "Validation failed: " + payload.getFailureReason());
        messagingTemplate.convertAndSend("/topic/validation", msg);
        log.debug("WS >> /topic/validation : ticket {}, success={}", payload.getTicketId(), payload.isSuccess());
    }

    // -------------------------------------------------------------------------
    // Dashboard stats
    // -------------------------------------------------------------------------

    /**
     * Push updated stats to all admin dashboard subscribers.
     */
    public void publishDashboardStats(DashboardStatsPayload payload) {
        WsMessage<DashboardStatsPayload> msg = WsMessage.of(WsMessage.Type.STATS_UPDATE, payload);
        messagingTemplate.convertAndSend("/topic/dashboard", msg);
        log.debug("WS >> /topic/dashboard : stats pushed");
    }

    // -------------------------------------------------------------------------
    // Customer personal notifications
    // -------------------------------------------------------------------------

    /**
     * Send a personal notification to a specific customer.
     * Delivered to: /user/{userId}/queue/notifications
     */
    public void notifyCustomer(Long userId, NotificationPayload payload) {
        WsMessage<NotificationPayload> msg = WsMessage.of(WsMessage.Type.NOTIFICATION, payload, payload.getTitle());
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/notifications", msg);
        log.debug("WS >> /user/{}/queue/notifications : {}", userId, payload.getTitle());
    }
}
