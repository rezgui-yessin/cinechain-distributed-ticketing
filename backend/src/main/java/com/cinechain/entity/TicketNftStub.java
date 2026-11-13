package com.cinechain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_nft_stubs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketNftStub {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false, unique = true)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, unique = true)
    private String tokenId; // e.g. "CC-NFT-#1234-89AF"

    @Column(nullable = false)
    private String movieTitle;

    @Column(nullable = false)
    private String cinemaName;

    @Column(nullable = false)
    private String hallName;

    @Column(nullable = false)
    private String seatInfo;

    private String experienceTier; // "IMAX Laser", "Dolby Atmos 4K", "VIP Recliner"

    private String rarityScore; // "Legendary Premiere", "Gold Attendant", "Opening Night", "Collector"

    @Column(columnDefinition = "TEXT")
    private String posterArtworkUrl;

    @Column(columnDefinition = "TEXT")
    private String badgeUrl;

    @Column(columnDefinition = "TEXT")
    private String metadataUri;

    @Column(nullable = false)
    private String mintTxHash;

    @Column(updatable = false)
    private LocalDateTime mintedAt;

    @PrePersist
    void prePersist() {
        mintedAt = LocalDateTime.now();
    }
}
