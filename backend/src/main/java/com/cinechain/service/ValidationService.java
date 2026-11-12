package com.cinechain.service;

import com.cinechain.dto.ticket.TicketDto;
import com.cinechain.dto.ticket.ValidationRequest;
import com.cinechain.dto.websocket.NotificationPayload;
import com.cinechain.dto.websocket.ValidationEventPayload;
import com.cinechain.entity.Ticket;
import com.cinechain.entity.User;
import com.cinechain.enums.TicketStatus;
import com.cinechain.enums.TransactionType;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ValidationService {

    private final TicketRepository ticketRepository;
    private final BlockchainService blockchainService;
    private final WebSocketPublisher wsPublisher;

    @Transactional
    public TicketDto validateTicket(ValidationRequest request, User adminUser) {
        String qrData = request.getQrCodeData().trim();
        Ticket ticket = ticketRepository.findByQrCodeData(qrData)
                .orElseThrow(() -> new ResourceNotFoundException("No ticket found with the provided QR data"));

        if (ticket.getStatus() == TicketStatus.USED) {
            throw new IllegalArgumentException("Ticket has already been used and validated at " + ticket.getValidatedAt());
        }

        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new IllegalArgumentException("Ticket has been cancelled and cannot be used");
        }

        if (ticket.getStatus() == TicketStatus.EXPIRED) {
            throw new IllegalArgumentException("Ticket has expired because the event has already ended");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = ticket.getBooking().getScreening().getStartTime();
        LocalDateTime endTime = ticket.getBooking().getScreening().getEndTime();

        // Check if event has already finished
        if (endTime != null && now.isAfter(endTime)) {
            ticket.setStatus(TicketStatus.EXPIRED);
            ticketRepository.save(ticket);
            blockchainService.recordTransaction(
                    ticket.getId(),
                    ticket.getBooking().getId(),
                    TransactionType.TICKET_EXPIRED,
                    String.format("{\"ticketId\":%d,\"expiredAt\":\"%s\",\"reason\":\"Event ended at %s\"}",
                            ticket.getId(), now, endTime)
            );
            throw new IllegalArgumentException("Event has ended. Ticket is expired and can no longer be used");
        }

        // Check if event start time is reached (allowing 45-minute early admission)
        if (startTime != null && now.isBefore(startTime.minusMinutes(45))) {
            throw new IllegalArgumentException("Admission gate not open yet. Doors open 45 minutes before start time (" + startTime + ")");
        }

        ticket.setStatus(TicketStatus.USED);
        ticket.setValidatedAt(LocalDateTime.now());
        ticket.setValidatedBy(adminUser);

        Ticket savedTicket = ticketRepository.save(ticket);

        blockchainService.recordTransaction(
                savedTicket.getId(),
                savedTicket.getBooking().getId(),
                TransactionType.TICKET_VALIDATED,
                String.format("{\"ticketId\":%d,\"validatedBy\":\"%s\",\"validatedAt\":\"%s\"}",
                        savedTicket.getId(), adminUser.getEmail(), savedTicket.getValidatedAt())
        );

        log.info("Ticket id={} successfully validated by admin={}", savedTicket.getId(), adminUser.getEmail());

        // Broadcast real-time ticket validation event
        try {
            wsPublisher.publishValidation(ValidationEventPayload.builder()
                    .ticketId(savedTicket.getId())
                    .bookingReference(savedTicket.getBooking().getBookingReference())
                    .holderName(savedTicket.getHolderName())
                    .movieTitle(savedTicket.getBooking().getScreening().getMovie().getTitle())
                    .seatInfo(savedTicket.getSeat().getRowLabel() + savedTicket.getSeat().getSeatNumber())
                    .cinemaName(savedTicket.getBooking().getScreening().getHall().getCinema().getName())
                    .screeningTime(savedTicket.getBooking().getScreening().getStartTime())
                    .validatedAt(savedTicket.getValidatedAt())
                    .validatedBy(adminUser.getEmail())
                    .success(true)
                    .build());

            // Notify the customer who owns this ticket
            wsPublisher.notifyCustomer(savedTicket.getBooking().getCustomer().getId(), NotificationPayload.builder()
                    .title("Ticket Checked In")
                    .body("Your ticket for " + savedTicket.getBooking().getScreening().getMovie().getTitle() + " has been scanned and verified at the cinema entrance.")
                    .level(NotificationPayload.Level.INFO)
                    .actionUrl("/customer/tickets")
                    .referenceId(savedTicket.getId())
                    .build());
        } catch (Exception ex) {
            log.warn("Failed to publish validation event via WebSocket: {}", ex.getMessage());
        }

        return TicketDto.from(savedTicket);
    }

    public List<TicketDto> getValidationHistory() {
        return ticketRepository.findRecentlyValidated().stream()
                .map(TicketDto::from)
                .toList();
    }
}
