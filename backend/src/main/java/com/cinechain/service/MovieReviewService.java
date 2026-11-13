package com.cinechain.service;

import com.cinechain.dto.ai.MovieReviewDto;
import com.cinechain.dto.ai.MovieReviewRequest;
import com.cinechain.dto.ai.MovieSentimentSummaryDto;
import com.cinechain.entity.Movie;
import com.cinechain.entity.MovieReview;
import com.cinechain.entity.User;
import com.cinechain.repository.MovieRepository;
import com.cinechain.repository.MovieReviewRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MovieReviewService {

    private final MovieReviewRepository reviewRepository;
    private final MovieRepository movieRepository;
    private final GeminiApiService geminiApiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MovieReviewDto submitReview(Long movieId, MovieReviewRequest request, User author) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        ModerationResult moderation = moderateReview(request.getContent());

        MovieReview review = MovieReview.builder()
                .movie(movie)
                .author(author)
                .authorName(author.getFirstName() + " " + author.getLastName())
                .rating(request.getRating())
                .content(request.getContent())
                .sentiment(moderation.sentiment)
                .tags(moderation.tags)
                .isSpoiler(moderation.isSpoiler)
                .isFlagged(moderation.isFlagged)
                .build();

        MovieReview saved = reviewRepository.save(review);
        return MovieReviewDto.from(saved);
    }

    @Transactional(readOnly = true)
    public List<MovieReviewDto> getReviewsForMovie(Long movieId) {
        return reviewRepository.findApprovedByMovieId(movieId)
                .stream()
                .map(MovieReviewDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MovieSentimentSummaryDto getSentimentSummary(Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found with id: " + movieId));

        List<MovieReview> reviews = reviewRepository.findApprovedByMovieId(movieId);

        if (reviews.isEmpty()) {
            return MovieSentimentSummaryDto.builder()
                    .movieId(movieId)
                    .movieTitle(movie.getTitle())
                    .totalReviews(0)
                    .averageRating(0.0)
                    .overallSentiment("No reviews yet")
                    .topPros(List.of("Be the first to review this movie!"))
                    .topCons(List.of())
                    .keyThemes(List.of())
                    .aiSummary("No audience reviews have been submitted yet. Be the first to share your experience!")
                    .build();
        }

        double avgRating = reviews.stream().mapToDouble(MovieReview::getRating).average().orElse(0.0);
        long positiveCount = reviews.stream().filter(r -> "POSITIVE".equals(r.getSentiment())).count();
        long negativeCount = reviews.stream().filter(r -> "NEGATIVE".equals(r.getSentiment())).count();

        String overallSentiment;
        if (positiveCount > negativeCount * 2) overallSentiment = "Very Positive";
        else if (positiveCount > negativeCount) overallSentiment = "Mostly Positive";
        else if (negativeCount > positiveCount * 2) overallSentiment = "Very Negative";
        else if (negativeCount > positiveCount) overallSentiment = "Mostly Negative";
        else overallSentiment = "Mixed";

        StringBuilder reviewsText = new StringBuilder();
        for (int i = 0; i < Math.min(reviews.size(), 10); i++) {
            MovieReview r = reviews.get(i);
            reviewsText.append(String.format("Review %d (Rating: %.1f/5): %s\n", i + 1, r.getRating(), r.getContent()));
        }

        String systemInstruction = "You are a cinema review analyst. Analyze the following audience reviews and extract:\n" +
                "1. Top 3 pros (things audiences loved)\n2. Top 3 cons (things audiences disliked)\n3. 3-5 recurring themes\n4. A one-paragraph overall summary\n" +
                "Format your response EXACTLY as JSON: {\"pros\":[\"...\"],\"cons\":[\"...\"],\"themes\":[\"...\"],\"summary\":\"...\"}";

        String aiResponse = geminiApiService.generateContent(systemInstruction,
                "Movie: \"" + movie.getTitle() + "\"\n\n" + reviewsText);

        List<String> pros = List.of("Entertaining", "Well-acted", "Great visuals");
        List<String> cons = List.of();
        List<String> themes = List.of("Drama", "Action", "Emotion");
        String aiSummary = "Audiences have given this film a warm reception with notable praise for its performances and production quality.";

        try {
            String cleaned = aiResponse.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
            JsonNode node = objectMapper.readTree(cleaned);
            if (node.has("pros")) pros = objectMapper.convertValue(node.get("pros"), List.class);
            if (node.has("cons")) cons = objectMapper.convertValue(node.get("cons"), List.class);
            if (node.has("themes")) themes = objectMapper.convertValue(node.get("themes"), List.class);
            if (node.has("summary")) aiSummary = node.get("summary").asText();
        } catch (Exception e) {
            log.warn("Could not parse Gemini sentiment JSON, using fallback: {}", e.getMessage());
        }

        return MovieSentimentSummaryDto.builder()
                .movieId(movieId)
                .movieTitle(movie.getTitle())
                .totalReviews(reviews.size())
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .overallSentiment(overallSentiment)
                .topPros(pros)
                .topCons(cons)
                .keyThemes(themes)
                .aiSummary(aiSummary)
                .build();
    }

    private ModerationResult moderateReview(String content) {
        String systemInstruction = "You are a cinema review content moderator. Analyze the given review and respond ONLY with valid JSON (no markdown, no explanation):\n" +
                "{\"sentiment\":\"POSITIVE|NEGATIVE|MIXED|NEUTRAL\",\"tags\":\"comma-separated tags (max 4, e.g. Great Acting, Epic Visuals)\",\"isSpoiler\":true|false,\"isFlagged\":true|false}\n" +
                "Flag as isSpoiler=true if plot twists or endings are revealed. Flag as isFlagged=true if offensive/abusive language is used.";

        String response = geminiApiService.generateContent(systemInstruction, "Review to moderate:\n" + content);

        ModerationResult result = new ModerationResult();
        result.sentiment = "NEUTRAL";
        result.tags = "Audience Review";
        result.isSpoiler = false;
        result.isFlagged = false;

        try {
            String cleaned = response.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
            JsonNode node = objectMapper.readTree(cleaned);
            if (node.has("sentiment")) result.sentiment = node.get("sentiment").asText("NEUTRAL");
            if (node.has("tags")) result.tags = node.get("tags").asText("Audience Review");
            if (node.has("isSpoiler")) result.isSpoiler = node.get("isSpoiler").asBoolean(false);
            if (node.has("isFlagged")) result.isFlagged = node.get("isFlagged").asBoolean(false);
        } catch (Exception e) {
            log.warn("Could not parse moderation response, using defaults: {}", e.getMessage());
        }

        return result;
    }

    private static class ModerationResult {
        String sentiment;
        String tags;
        boolean isSpoiler;
        boolean isFlagged;
    }
}
