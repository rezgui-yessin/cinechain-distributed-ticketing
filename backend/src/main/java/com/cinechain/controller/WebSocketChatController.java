package com.cinechain.controller;

import com.cinechain.dto.websocket.WsMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Handles incoming STOMP messages sent from clients to /app/...
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

    /**
     * Heartbeat / ping endpoint.
     * Client sends to: /app/ping
     * Receives on:     /topic/pong
     */
    @MessageMapping("/ping")
    @SendTo("/topic/pong")
    public WsMessage<Map<String, Object>> ping(@Payload Map<String, Object> payload, Principal principal) {
        log.debug("Received ping from: {}", principal != null ? principal.getName() : "anonymous");
        return WsMessage.of(WsMessage.Type.INFO,
                Map.of("status", "pong", "serverTime", LocalDateTime.now().toString()),
                "pong");
    }

    /**
     * Client subscribes / sends heartbeat on a screening room.
     * Client sends to: /app/screening/{screeningId}/join
     */
    @MessageMapping("/screening/{screeningId}/join")
    @SendTo("/topic/seats/{screeningId}")
    public WsMessage<Map<String, Object>> joinScreeningRoom(
            @DestinationVariable Long screeningId,
            @Payload(required = false) Map<String, Object> data,
            Principal principal) {
        String user = principal != null ? principal.getName() : "viewer";
        log.debug("User {} joined screening room {}", user, screeningId);
        return WsMessage.of(WsMessage.Type.INFO,
                Map.of("screeningId", screeningId, "action", "USER_VIEWING", "time", LocalDateTime.now().toString()),
                "Live viewing screening " + screeningId);
    }
}
