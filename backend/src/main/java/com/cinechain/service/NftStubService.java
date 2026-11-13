package com.cinechain.service;

import com.cinechain.dto.nft.TicketNftStubDto;
import com.cinechain.entity.Ticket;
import com.cinechain.entity.TicketNftStub;
import com.cinechain.entity.User;
import com.cinechain.enums.TicketStatus;
import com.cinechain.enums.TransactionType;
import com.cinechain.exception.BadRequestException;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.exception.UnauthorizedException;
import com.cinechain.repository.TicketNftStubRepository;
import com.cinechain.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class NftStubService {

    private final TicketNftStubRepository nftStubRepository;
    private final TicketRepository ticketRepository;
    private final BlockchainService blockchainService;

    public List<TicketNftStubDto> getMyNftStubs(Long ownerId) {
        return nftStubRepository.findByOwnerId(ownerId).stream()
                .map(TicketNftStubDto::from)
                .toList();
    }

    public TicketNftStubDto getStubByTicketId(Long ticketId) {
        return nftStubRepository.findByTicketId(ticketId)
                .map(TicketNftStubDto::from)
                .orElse(null);
    }

    @Transactional
    public TicketNftStubDto claimNftStub(Long ticketId, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        // 1. Verify ownership
        if (!ticket.getBooking().getCustomer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only mint NFT stubs for your own tickets");
        }

        // 2. Verify ticket is USED (attendee scanned at cinema gate)
        if (ticket.getStatus() != TicketStatus.USED) {
            throw new BadRequestException("Commemorative NFT Stubs can only be minted after the ticket has been validated and used at the cinema gate");
        }

        // 3. Verify not already minted
        if (nftStubRepository.findByTicketId(ticketId).isPresent()) {
            throw new BadRequestException("NFT Stub has already been claimed for this ticket");
        }

        var booking = ticket.getBooking();
        var screening = booking.getScreening();
        var movie = screening.getMovie();
        var hall = screening.getHall();
        var cinema = hall.getCinema();
        var seat = ticket.getSeat();

        // 4. Generate unique token ID
        String hashSeed = ticket.getId() + ":" + currentUser.getId() + ":" + LocalDateTime.now();
        String sha = sha256Hex(hashSeed);
        String tokenId = "CC-NFT-" + ticket.getId() + "-" + sha.substring(0, 6).toUpperCase();

        // 5. Compute dynamic rarity score based on screening characteristics
        String rarity = computeRarity(screening.getStartTime(), seat.getSeatType().name());
        String tier = hall.getName().toLowerCase().contains("imax") ? "IMAX Laser 3D" :
                      hall.getName().toLowerCase().contains("vip") ? "VIP Recliner Suite" : "Dolby Atmos 4K";

        String badgeUrl = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400";
        String metadataUri = "ipfs://QmCineChainStubs/" + tokenId + ".json";

        // 6. Blockchain ledger transaction
        var bcTx = blockchainService.recordTransaction(
                ticket.getId(),
                booking.getId(),
                TransactionType.NFT_STUB_CLAIMED,
                String.format("{\"tokenId\":\"%s\",\"ticketId\":%d,\"movie\":\"%s\",\"ownerId\":%d,\"rarity\":\"%s\"}",
                        tokenId, ticket.getId(), movie.getTitle(), currentUser.getId(), rarity)
        );

        TicketNftStub stub = TicketNftStub.builder()
                .ticket(ticket)
                .owner(currentUser)
                .tokenId(tokenId)
                .movieTitle(movie.getTitle())
                .cinemaName(cinema.getName())
                .hallName(hall.getName())
                .seatInfo(seat.getRowLabel() + seat.getSeatNumber())
                .experienceTier(tier)
                .rarityScore(rarity)
                .posterArtworkUrl(movie.getPosterUrl())
                .badgeUrl(badgeUrl)
                .metadataUri(metadataUri)
                .mintTxHash(bcTx.getTransactionHash())
                .build();

        TicketNftStub saved = nftStubRepository.save(stub);
        log.info("NFT Commemorative Stub minted: tokenId={} for ticket #{}", tokenId, ticket.getId());

        return TicketNftStubDto.from(saved);
    }

    private String computeRarity(LocalDateTime screeningTime, String seatType) {
        if ("VIP".equalsIgnoreCase(seatType)) {
            return "Legendary VIP First-Row";
        }
        if (screeningTime.getHour() >= 20) {
            return "Opening Night Premiere";
        }
        return "Certified Attendance Collector";
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return UUIDString();
        }
    }

    private String UUIDString() {
        return java.util.UUID.randomUUID().toString().replace("-", "");
    }
}
