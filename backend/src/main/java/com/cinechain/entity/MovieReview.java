package com.cinechain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "movie_reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(nullable = false)
    private String authorName;

    @Column(nullable = false)
    private Double rating;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(length = 50)
    @Builder.Default
    private String sentiment = "NEUTRAL"; // POSITIVE, NEGATIVE, MIXED, NEUTRAL

    private String tags; // e.g. "Visual Masterpiece, Stellar Audio, Great Acting"

    @Builder.Default
    private Boolean isSpoiler = false;

    @Builder.Default
    private Boolean isFlagged = false;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
