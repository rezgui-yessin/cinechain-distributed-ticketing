package com.cinechain.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieSentimentSummaryDto {
    private Long movieId;
    private String movieTitle;
    private long totalReviews;
    private double averageRating;
    private String overallSentiment; // POSITIVE, MOSTLY_POSITIVE, MIXED, NEGATIVE
    private String aiSummary;
    private List<String> topPros;
    private List<String> topCons;
    private List<String> keyThemes;
}
