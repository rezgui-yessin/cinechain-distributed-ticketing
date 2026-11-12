package com.cinechain.service;

import com.cinechain.dto.ticket.TicketDto;
import com.cinechain.dto.websocket.BookingEventPayload;
import com.cinechain.dto.websocket.NotificationPayload;
import com.cinechain.dto.websocket.SeatUpdatePayload;
import com.cinechain.entity.Booking;
import com.cinechain.entity.Seat;
import com.cinechain.entity.Ticket;
import com.cinechain.enums.BookingStatus;
import com.cinechain.enums.TicketStatus;
import com.cinechain.enums.TransactionType;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.exception.UnauthorizedException;
import com.cinechain.repository.BookingRepository;
import com.cinechain.repository.TicketRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final BookingRepository bookingRepository;
    private final BlockchainService blockchainService;
    private final QrCodeService qrCodeService;
    private final ObjectMapper objectMapper;
    private final WebSocketPublisher wsPublisher;

    public List<TicketDto> getMyTickets(Long customerId) {
        return ticketRepository.findByCustomerId(customerId).stream()
                .map(TicketDto::from)
                .toList();
    }

    public TicketDto getTicketById(Long ticketId, Long customerId, boolean isAdmin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        if (!isAdmin && !ticket.getBooking().getCustomer().getId().equals(customerId)) {
            throw new UnauthorizedException("You are not authorized to view this ticket");
        }

        return TicketDto.from(ticket);
    }

    @Transactional
    public TicketDto cancelTicket(Long ticketId, Long customerId, boolean isAdmin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        Booking booking = ticket.getBooking();
        if (!isAdmin && !booking.getCustomer().getId().equals(customerId)) {
            throw new UnauthorizedException("You are not authorized to cancel this ticket");
        }

        if (ticket.getStatus() != TicketStatus.ACTIVE) {
            throw new IllegalArgumentException("Ticket cannot be cancelled because its status is: " + ticket.getStatus());
        }

        LocalDateTime screeningTime = booking.getScreening().getStartTime();
        if (LocalDateTime.now().plusHours(2).isAfter(screeningTime)) {
            throw new IllegalArgumentException("Tickets cannot be cancelled less than 2 hours before the screening time");
        }

        ticket.setStatus(TicketStatus.CANCELLED);
        Ticket updatedTicket = ticketRepository.save(ticket);

        // Record cancellation on blockchain
        blockchainService.recordTransaction(
                ticket.getId(),
                booking.getId(),
                TransactionType.TICKET_CANCELLED,
                "{\"ticketId\":" + ticket.getId() + ",\"status\":\"CANCELLED\"}"
        );

        // Check if all tickets in booking are cancelled
        boolean allCancelled = booking.getTickets().stream()
                .allMatch(t -> t.getStatus() == TicketStatus.CANCELLED);
        if (allCancelled) {
            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
        }

        // Real-time WebSocket updates
        try {
            Seat seat = ticket.getSeat();
            wsPublisher.publishSeatReleased(SeatUpdatePayload.builder()
                    .screeningId(booking.getScreening().getId())
                    .seatId(seat.getId())
                    .rowLabel(seat.getRowLabel())
                    .seatNumber(seat.getSeatNumber())
                    .seatType(seat.getSeatType() != null ? seat.getSeatType().name() : "STANDARD")
                    .available(true)
                    .build());

            if (allCancelled) {
                wsPublisher.publishBookingCancelled(BookingEventPayload.builder()
                        .bookingId(booking.getId())
                        .bookingReference(booking.getBookingReference())
                        .status("CANCELLED")
                        .build());
            }

            wsPublisher.notifyCustomer(booking.getCustomer().getId(), NotificationPayload.builder()
                    .title("Ticket Cancelled")
                    .body("Your ticket #" + ticket.getId() + " has been successfully cancelled.")
                    .level(NotificationPayload.Level.INFO)
                    .actionUrl("/customer/tickets")
                    .referenceId(ticket.getId())
                    .build());
        } catch (Exception ex) {
            log.warn("Failed to broadcast WebSocket cancellation update: {}", ex.getMessage());
        }

        return TicketDto.from(updatedTicket);
    }

    @Transactional
    public TicketDto changeHolderName(Long ticketId, Long customerId, String newHolderName, boolean isAdmin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        Booking booking = ticket.getBooking();
        if (!isAdmin && !booking.getCustomer().getId().equals(customerId)) {
            throw new UnauthorizedException("You are not authorized to modify this ticket");
        }

        if (ticket.getStatus() != TicketStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot modify holder for inactive ticket");
        }

        ticket.setHolderName(newHolderName);

        // Re-generate QR Code
        try {
            Map<String, Object> qrMap = new HashMap<>();
            qrMap.put("ticketId", ticket.getId());
            qrMap.put("bookingRef", booking.getBookingReference());
            qrMap.put("movie", booking.getScreening().getMovie().getTitle());
            qrMap.put("screening", booking.getScreening().getStartTime().toString());
            qrMap.put("seat", ticket.getSeat().getRowLabel() + ticket.getSeat().getSeatNumber());
            qrMap.put("holder", newHolderName);

            String qrData = objectMapper.writeValueAsString(qrMap);
            String qrCodeBase64 = qrCodeService.generateQrCode(qrData);

            ticket.setQrCodeData(qrData);
            ticket.setQrCode(qrCodeBase64);
        } catch (Exception e) {
            log.error("Failed to re-generate QR code upon holder change", e);
        }

        return TicketDto.from(ticketRepository.save(ticket));
    }
}
