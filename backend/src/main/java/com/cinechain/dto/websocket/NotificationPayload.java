package com.cinechain.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Personal notification pushed to a specific customer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPayload {
    public enum Level { INFO, SUCCESS, WARNING, ERROR }

    private String title;
    private String body;
    private Level level;
    private String actionUrl;  // e.g. "/customer/tickets/42"
    private Long referenceId;  // bookingId, ticketId, etc.
}
