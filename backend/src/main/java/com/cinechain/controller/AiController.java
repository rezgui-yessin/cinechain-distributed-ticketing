package com.cinechain.controller;

import com.cinechain.dto.ai.AiChatRequest;
import com.cinechain.dto.ai.AiChatResponse;
import com.cinechain.dto.ai.MovieReviewDto;
import com.cinechain.dto.ai.MovieReviewRequest;
import com.cinechain.dto.ai.MovieSentimentSummaryDto;
import com.cinechain.entity.User;
import com.cinechain.service.AiConciergeService;
import com.cinechain.service.MovieReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AiController {

    private final AiConciergeService aiConciergeService;
    private final MovieReviewService movieReviewService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        return ResponseEntity.ok(aiConciergeService.chat(request));
    }

    @PostMapping("/movies/{movieId}/reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<MovieReviewDto> submitReview(
            @PathVariable Long movieId,
            @Valid @RequestBody MovieReviewRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(movieReviewService.submitReview(movieId, request, currentUser));
    }

    @GetMapping("/movies/{movieId}/reviews")
    public ResponseEntity<List<MovieReviewDto>> getReviews(@PathVariable Long movieId) {
        return ResponseEntity.ok(movieReviewService.getReviewsForMovie(movieId));
    }

    @GetMapping("/movies/{movieId}/sentiment")
    public ResponseEntity<MovieSentimentSummaryDto> getSentimentSummary(@PathVariable Long movieId) {
        return ResponseEntity.ok(movieReviewService.getSentimentSummary(movieId));
    }
}
