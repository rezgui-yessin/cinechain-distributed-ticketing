package com.cinechain.dto.ai;

import com.cinechain.entity.MovieReview;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieReviewDto {
    private Long id;
    private Long movieId;
    private String movieTitle;
    private Long authorId;
    private String authorName;
    private Double rating;
    private String content;
    private String sentiment;
    private String tags;
    private Boolean isSpoiler;
    private Boolean isFlagged;
    private LocalDateTime createdAt;

    public static MovieReviewDto from(MovieReview r) {
        return MovieReviewDto.builder()
                .id(r.getId())
                .movieId(r.getMovie().getId())
                .movieTitle(r.getMovie().getTitle())
                .authorId(r.getAuthor() != null ? r.getAuthor().getId() : null)
                .authorName(r.getAuthorName())
                .rating(r.getRating())
                .content(r.getContent())
                .sentiment(r.getSentiment())
                .tags(r.getTags())
                .isSpoiler(r.getIsSpoiler())
                .isFlagged(r.getIsFlagged())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
