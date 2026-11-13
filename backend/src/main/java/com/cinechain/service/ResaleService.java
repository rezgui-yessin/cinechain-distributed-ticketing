package com.cinechain.service;

import com.cinechain.dto.resale.ResaleBuyRequest;
import com.cinechain.dto.resale.ResaleCreateRequest;
import com.cinechain.dto.resale.ResaleListingDto;
import com.cinechain.dto.websocket.NotificationPayload;
import com.cinechain.entity.Booking;
import com.cinechain.entity.ResaleListing;
import com.cinechain.entity.Ticket;
import com.cinechain.entity.User;
import com.cinechain.enums.ResaleStatus;
import com.cinechain.enums.TicketStatus;
import com.cinechain.enums.TransactionType;
import com.cinechain.exception.BadRequestException;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.exception.UnauthorizedException;
import com.cinechain.repository.BookingRepository;
import com.cinechain.repository.ResaleListingRepository;
import com.cinechain.repository.TicketRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResaleService {

    private final ResaleListingRepository resaleListingRepository;
    private final TicketRepository ticketRepository;
    private final BookingRepository bookingRepository;
    private final BlockchainService blockchainService;
    private final QrCodeService qrCodeService;
    private final ObjectMapper objectMapper;
    private final WebSocketPublisher wsPublisher;

    public List<ResaleListingDto> getActiveListings() {
        // Only return listings for screenings starting at least 15 minutes from now
        LocalDateTime threshold = LocalDateTime.now().plusMinutes(15);
        return resaleListingRepository.findActiveListings(threshold).stream()
                .map(ResaleListingDto::from)
                .toList();
    }

    public List<ResaleListingDto> getMyListings(Long sellerId) {
        return resaleListingRepository.findBySellerId(sellerId).stream()
                .map(ResaleListingDto::from)
                .toList();
    }

    public List<ResaleListingDto> getMyPurchasedResales(Long buyerId) {
        return resaleListingRepository.findByBuyerId(buyerId).stream()
                .map(ResaleListingDto::from)
                .toList();
    }

    @Transactional
    public ResaleListingDto createListing(ResaleCreateRequest request, User currentUser) {
        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + request.getTicketId()));

        Booking booking = ticket.getBooking();

        // 1. Ownership check
        if (!booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only resell tickets you own");
        }

        // 2. Status check
        if (ticket.getStatus() != TicketStatus.ACTIVE) {
            throw new BadRequestException("Only ACTIVE tickets can be listed for resale (Current: " + ticket.getStatus() + ")");
        }

        // 3. Timing check: screening must be at least 1 hour in the future
        LocalDateTime startTime = booking.getScreening().getStartTime();
        if (LocalDateTime.now().plusHours(1).isAfter(startTime)) {
            throw new BadRequestException("Tickets cannot be listed for resale less than 1 hour before the screening");
        }

        // 4. ANTI-SCALPING ENFORCEMENT: Price cap <= original face value
        BigDecimal faceValue = booking.getScreening().getPrice();
        if (request.getResalePrice().compareTo(faceValue) > 0) {
            throw new BadRequestException(String.format(
                    "Anti-Scalping Rule Violation: Resale price (€%.2f) cannot exceed the original face value (€%.2f).",
                    request.getResalePrice(), faceValue
            ));
        }

        // 5. Update ticket status to LISTED_FOR_RESALE
        ticket.setStatus(TicketStatus.LISTED_FOR_RESALE);
        ticketRepository.save(ticket);

        // 6. Save Listing
        ResaleListing listing = ResaleListing.builder()
                .ticket(ticket)
                .seller(currentUser)
                .originalPrice(faceValue)
                .resalePrice(request.getResalePrice())
                .status(ResaleStatus.AVAILABLE)
                .notes(request.getNotes())
                .build();
        ResaleListing saved = resaleListingRepository.save(listing);

        // 7. Record on blockchain ledger
        blockchainService.recordTransaction(
                ticket.getId(),
                booking.getId(),
                TransactionType.TICKET_LISTED_RESALE,
                String.format("{\"ticketId\":%d,\"sellerId\":%d,\"faceValue\":%.2f,\"resalePrice\":%.2f}",
                        ticket.getId(), currentUser.getId(), faceValue, request.getResalePrice())
        );

        log.info("Ticket #{} listed on P2P marketplace by user #{} at €{}", ticket.getId(), currentUser.getId(), request.getResalePrice());

        return ResaleListingDto.from(saved);
    }

    @Transactional
    public ResaleListingDto cancelListing(Long listingId, User currentUser) {
        ResaleListing listing = resaleListingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        if (!listing.getSeller().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only cancel your own listings");
        }

        if (listing.getStatus() != ResaleStatus.AVAILABLE) {
            throw new BadRequestException("Listing is no longer active (Status: " + listing.getStatus() + ")");
        }

        listing.setStatus(ResaleStatus.CANCELLED);
        listing.setCancelledAt(LocalDateTime.now());
        ResaleListing saved = resaleListingRepository.save(listing);

        // Restore ticket to ACTIVE
        Ticket ticket = listing.getTicket();
        ticket.setStatus(TicketStatus.ACTIVE);
        ticketRepository.save(ticket);

        // Blockchain record
        blockchainService.recordTransaction(
                ticket.getId(),
                ticket.getBooking().getId(),
                TransactionType.TICKET_RESALE_CANCELLED,
                String.format("{\"listingId\":%d,\"ticketId\":%d,\"cancelledBy\":%d}",
                        listingId, ticket.getId(), currentUser.getId())
        );

        return ResaleListingDto.from(saved);
    }

    @Transactional
    public ResaleListingDto buyListing(Long listingId, ResaleBuyRequest request, User buyer) {
        ResaleListing listing = resaleListingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        if (listing.getStatus() != ResaleStatus.AVAILABLE) {
            throw new BadRequestException("This ticket is no longer available for purchase");
        }

        if (listing.getSeller().getId().equals(buyer.getId())) {
            throw new BadRequestException("You cannot buy your own listed ticket");
        }

        Ticket ticket = listing.getTicket();
        Booking oldBooking = ticket.getBooking();

        // Check screening hasn't already started
        if (LocalDateTime.now().isAfter(oldBooking.getScreening().getStartTime())) {
            throw new BadRequestException("Screening has already started; ticket can no longer be acquired");
        }

        // 1. Create a new Booking entry for the buyer to transfer legal custody
        String newBookingRef = "RES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Booking newBooking = Booking.builder()
                .bookingReference(newBookingRef)
                .customer(buyer)
                .screening(oldBooking.getScreening())
                .status(com.cinechain.enums.BookingStatus.CONFIRMED)
                .totalAmount(listing.getResalePrice())
                .build();
        Booking savedNewBooking = bookingRepository.save(newBooking);

        // 2. Re-assign ticket to new booking and update holder
        ticket.setBooking(savedNewBooking);
        ticket.setHolderName(request.getNewHolderName());
        ticket.setStatus(TicketStatus.ACTIVE);

        // 3. Cryptographically re-issue QR code (revokes old QR data)
        try {
            Map<String, Object> qrMap = new HashMap<>();
            qrMap.put("ticketId", ticket.getId());
            qrMap.put("bookingRef", newBookingRef);
            qrMap.put("movie", oldBooking.getScreening().getMovie().getTitle());
            qrMap.put("screening", oldBooking.getScreening().getStartTime().toString());
            qrMap.put("seat", ticket.getSeat().getRowLabel() + ticket.getSeat().getSeatNumber());
            qrMap.put("holder", request.getNewHolderName());
            qrMap.put("resaleTransferred", true);
            qrMap.put("transferTimestamp", LocalDateTime.now().toString());

            String newQrData = objectMapper.writeValueAsString(qrMap);
            String newQrBase64 = qrCodeService.generateQrCode(newQrData);

            ticket.setQrCodeData(newQrData);
            ticket.setQrCode(newQrBase64);
        } catch (Exception ex) {
            log.error("Failed to generate regenerated QR code for resold ticket", ex);
        }

        Ticket updatedTicket = ticketRepository.save(ticket);

        // 4. Mark listing as SOLD
        listing.setStatus(ResaleStatus.SOLD);
        listing.setBuyer(buyer);
        listing.setSoldAt(LocalDateTime.now());
        ResaleListing savedListing = resaleListingRepository.save(listing);

        // 5. Blockchain record
        blockchainService.recordTransaction(
                ticket.getId(),
                savedNewBooking.getId(),
                TransactionType.TICKET_RESOLD,
                String.format("{\"ticketId\":%d,\"sellerId\":%d,\"buyerId\":%d,\"price\":%.2f,\"newHolder\":\"%s\",\"newBookingRef\":\"%s\"}",
                        ticket.getId(), listing.getSeller().getId(), buyer.getId(), listing.getResalePrice(),
                        request.getNewHolderName(), newBookingRef)
        );

        // 6. Push real-time notification to original seller
        try {
            wsPublisher.notifyCustomer(listing.getSeller().getId(), NotificationPayload.builder()
                    .title("Ticket Resold on Marketplace!")
                    .body(String.format("Your ticket for '%s' was purchased for €%.2f.",
                            oldBooking.getScreening().getMovie().getTitle(), listing.getResalePrice()))
                    .level(NotificationPayload.Level.SUCCESS)
                    .actionUrl("/customer/tickets")
                    .referenceId(ticket.getId())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to notify seller: {}", e.getMessage());
        }

        return ResaleListingDto.from(savedListing);
    }
}
