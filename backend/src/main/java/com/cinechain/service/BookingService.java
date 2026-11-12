package com.cinechain.service;

import com.cinechain.dto.booking.BookingDto;
import com.cinechain.dto.booking.BookingRequest;
import com.cinechain.dto.ticket.TicketSummaryDto;
import com.cinechain.dto.websocket.BookingEventPayload;
import com.cinechain.dto.websocket.NotificationPayload;
import com.cinechain.dto.websocket.SeatUpdatePayload;
import com.cinechain.entity.*;
import com.cinechain.enums.BookingStatus;
import com.cinechain.enums.TicketStatus;
import com.cinechain.enums.TransactionType;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.exception.SeatAlreadyBookedException;
import com.cinechain.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ScreeningRepository screeningRepository;
    private final SeatRepository seatRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final QrCodeService qrCodeService;
    private final BlockchainService blockchainService;
    private final ObjectMapper objectMapper;
    private final WebSocketPublisher wsPublisher;

    @Transactional
    public BookingDto createBooking(BookingRequest request, Long customerId) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        Screening screening = screeningRepository.findById(request.getScreeningId())
                .orElseThrow(() -> new ResourceNotFoundException("Screening not found with id: " + request.getScreeningId()));

        String defaultHolderName = request.getHolderName() != null && !request.getHolderName().isBlank()
                ? request.getHolderName()
                : customer.getFirstName() + " " + customer.getLastName();

        List<Seat> lockedSeats = new ArrayList<>();
        // 2. Pessimistic write lock for each seat
        for (Long seatId : request.getSeatIds()) {
            Seat seat = seatRepository.findByIdWithLock(seatId)
                    .orElseThrow(() -> new ResourceNotFoundException("Seat not found with id: " + seatId));

            // Verify seat belongs to screening hall
            if (!seat.getHall().getId().equals(screening.getHall().getId())) {
                throw new IllegalArgumentException("Seat " + seatId + " does not belong to the hall for this screening");
            }

            // Check if already booked for this screening
            boolean alreadyBooked = ticketRepository.findAll().stream()
                    .anyMatch(t -> t.getBooking().getScreening().getId().equals(screening.getId())
                            && t.getSeat().getId().equals(seat.getId())
                            && t.getStatus() != TicketStatus.CANCELLED);

            if (alreadyBooked) {
                throw new SeatAlreadyBookedException("Seat " + seat.getRowLabel() + seat.getSeatNumber() + " is already booked for this screening");
            }

            lockedSeats.add(seat);
        }

        // 4. Create Booking
        String bookingRef = "BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        BigDecimal totalAmount = screening.getPrice().multiply(BigDecimal.valueOf(lockedSeats.size()));

        Booking booking = Booking.builder()
                .bookingReference(bookingRef)
                .customer(customer)
                .screening(screening)
                .status(BookingStatus.CONFIRMED)
                .totalAmount(totalAmount)
                .tickets(new ArrayList<>())
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // 5. For each seat, create Ticket and link to booking
        for (Seat seat : lockedSeats) {
            Ticket ticket = Ticket.builder()
                    .booking(savedBooking)
                    .seat(seat)
                    .holderName(defaultHolderName)
                    .status(TicketStatus.ACTIVE)
                    .build();
            savedBooking.getTickets().add(ticket);
        }

        // Save tickets via cascade or ticket repository
        List<Ticket> savedTickets = ticketRepository.saveAll(savedBooking.getTickets());

        // Now populate QR code and record blockchain transaction
        for (Ticket ticket : savedTickets) {
            try {
                Map<String, Object> qrMap = new HashMap<>();
                qrMap.put("ticketId", ticket.getId());
                qrMap.put("bookingRef", savedBooking.getBookingReference());
                qrMap.put("movie", screening.getMovie().getTitle());
                qrMap.put("screening", screening.getStartTime().toString());
                qrMap.put("seat", ticket.getSeat().getRowLabel() + ticket.getSeat().getSeatNumber());
                qrMap.put("holder", ticket.getHolderName());

                String qrData = objectMapper.writeValueAsString(qrMap);
                String qrCodeBase64 = qrCodeService.generateQrCode(qrData);

                ticket.setQrCodeData(qrData);
                ticket.setQrCode(qrCodeBase64);
                ticketRepository.save(ticket);

                // 7. Record blockchain transaction
                blockchainService.recordTransaction(
                        ticket.getId(),
                        savedBooking.getId(),
                        TransactionType.TICKET_ISSUED,
                        qrData
                );
            } catch (Exception e) {
                log.error("Error generating QR code or recording blockchain transaction", e);
                throw new RuntimeException("Booking processing failed", e);
            }
        }

        List<TicketSummaryDto> summaries = savedTickets.stream()
                .map(TicketSummaryDto::from)
                .toList();

        // 8. Broadcast real-time events via WebSocket
        try {
            // A. Broadcast seat booking updates for this screening
            for (Seat seat : lockedSeats) {
                wsPublisher.publishSeatBooked(SeatUpdatePayload.builder()
                        .screeningId(screening.getId())
                        .seatId(seat.getId())
                        .rowLabel(seat.getRowLabel())
                        .seatNumber(seat.getSeatNumber())
                        .seatType(seat.getSeatType() != null ? seat.getSeatType().name() : "STANDARD")
                        .available(false)
                        .remainingSeats(0) // dynamic on client
                        .build());
            }

            // B. Broadcast new booking event to admin channel
            wsPublisher.publishBookingCreated(BookingEventPayload.builder()
                    .bookingId(savedBooking.getId())
                    .bookingReference(savedBooking.getBookingReference())
                    .customerName(customer.getFirstName() + " " + customer.getLastName())
                    .customerEmail(customer.getEmail())
                    .movieTitle(screening.getMovie().getTitle())
                    .cinemaName(screening.getHall().getCinema().getName())
                    .screeningTime(screening.getStartTime())
                    .seatCount(lockedSeats.size())
                    .totalAmount(totalAmount)
                    .status(savedBooking.getStatus().name())
                    .createdAt(LocalDateTime.now())
                    .build());

            // C. Send personal real-time notification to the customer
            wsPublisher.notifyCustomer(customer.getId(), NotificationPayload.builder()
                    .title("Booking Confirmed!")
                    .body("Your booking " + savedBooking.getBookingReference() + " for " + screening.getMovie().getTitle() + " has been confirmed.")
                    .level(NotificationPayload.Level.SUCCESS)
                    .actionUrl("/customer/tickets")
                    .referenceId(savedBooking.getId())
                    .build());
        } catch (Exception ex) {
            log.warn("Failed to broadcast WebSocket messages for booking {}: {}", savedBooking.getId(), ex.getMessage());
        }

        return BookingDto.from(savedBooking, summaries);
    }

    public BookingDto getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        List<TicketSummaryDto> summaries = booking.getTickets().stream()
                .map(TicketSummaryDto::from)
                .toList();

        return BookingDto.from(booking, summaries);
    }

    public Page<BookingDto> getBookingsByCustomer(Long customerId, Pageable pageable) {
        return bookingRepository.findByCustomerId(customerId, pageable)
                .map(b -> BookingDto.from(b, b.getTickets().stream().map(TicketSummaryDto::from).toList()));
    }

    public Page<BookingDto> getAllBookings(Pageable pageable) {
        return bookingRepository.findAll(pageable)
                .map(b -> BookingDto.from(b, b.getTickets().stream().map(TicketSummaryDto::from).toList()));
    }
}
