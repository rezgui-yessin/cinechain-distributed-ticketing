package com.cinechain.dto.nft;

import com.cinechain.entity.TicketNftStub;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketNftStubDto {
    private Long id;
    private Long ticketId;
    private String tokenId;
    private Long ownerId;
    private String ownerName;
    private String movieTitle;
    private String cinemaName;
    private String hallName;
    private String seatInfo;
    private String experienceTier;
    private String rarityScore;
    private String posterArtworkUrl;
    private String badgeUrl;
    private String metadataUri;
    private String mintTxHash;
    private LocalDateTime mintedAt;

    public static TicketNftStubDto from(TicketNftStub stub) {
        return TicketNftStubDto.builder()
                .id(stub.getId())
                .ticketId(stub.getTicket().getId())
                .tokenId(stub.getTokenId())
                .ownerId(stub.getOwner().getId())
                .ownerName(stub.getOwner().getFirstName() + " " + stub.getOwner().getLastName())
                .movieTitle(stub.getMovieTitle())
                .cinemaName(stub.getCinemaName())
                .hallName(stub.getHallName())
                .seatInfo(stub.getSeatInfo())
                .experienceTier(stub.getExperienceTier())
                .rarityScore(stub.getRarityScore())
                .posterArtworkUrl(stub.getPosterArtworkUrl())
                .badgeUrl(stub.getBadgeUrl())
                .metadataUri(stub.getMetadataUri())
                .mintTxHash(stub.getMintTxHash())
                .mintedAt(stub.getMintedAt())
                .build();
    }
}
