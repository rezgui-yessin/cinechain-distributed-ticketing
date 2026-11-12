package com.cinechain.entity;

import com.cinechain.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "blockchain_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockchainTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String transactionHash;

    private Long ticketId;

    private Long bookingId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    private Long blockNumber;

    private Long gasUsed;

    @Column(columnDefinition = "TEXT")
    private String data;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime confirmedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
