package com.cinechain.service;

import com.cinechain.dto.ai.AiChatRequest;
import com.cinechain.dto.ai.AiChatResponse;
import com.cinechain.entity.Movie;
import com.cinechain.entity.Screening;
import com.cinechain.repository.MovieRepository;
import com.cinechain.repository.ScreeningRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiConciergeService {

    private final GeminiApiService geminiApiService;
    private final MovieRepository movieRepository;
    private final ScreeningRepository screeningRepository;

    private static final DateTimeFormatter DISPLAY_FMT = DateTimeFormatter.ofPattern("EEE dd MMM 'at' HH:mm");

    public AiChatResponse chat(AiChatRequest request) {
        List<Movie> activeMovies = movieRepository.findByStatus("NOW_SHOWING");
        List<Screening> upcomingScreenings = screeningRepository.findAll().stream()
                .filter(s -> "SCHEDULED".equals(s.getStatus()) && s.getStartTime().isAfter(LocalDateTime.now()))
                .sorted((a, b) -> a.getStartTime().compareTo(b.getStartTime()))
                .limit(30)
                .collect(Collectors.toList());

        String movieContext = buildMovieContext(activeMovies, upcomingScreenings);
        String systemInstruction = buildSystemInstruction(movieContext);
        String userPrompt = buildUserPrompt(request);

        String geminiReply = geminiApiService.generateContent(systemInstruction, userPrompt);
        List<Long> mentionedIds = extractMentionedMovieIds(geminiReply, activeMovies);

        List<AiChatResponse.RecommendedMovie> recommendations = activeMovies.stream()
                .filter(m -> mentionedIds.contains(m.getId()))
                .map(m -> AiChatResponse.RecommendedMovie.builder()
                        .id(m.getId())
                        .title(m.getTitle())
                        .posterUrl(m.getPosterUrl())
                        .genre(m.getGenre())
                        .rating(m.getRating())
                        .reason("Recommended by AI Concierge based on your request")
                        .build())
                .collect(Collectors.toList());

        return AiChatResponse.builder()
                .reply(geminiReply)
                .recommendedMovies(recommendations)
                .build();
    }

    private String buildMovieContext(List<Movie> movies, List<Screening> screenings) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== CURRENTLY SHOWING MOVIES ===\n");
        for (Movie m : movies) {
            sb.append(String.format("[ID:%d] \"%s\" | Genre: %s | Duration: %d min | Rating: %.1f | Language: %s\n",
                    m.getId(), m.getTitle(), m.getGenre(),
                    m.getDurationMinutes() != null ? m.getDurationMinutes() : 120,
                    m.getRating() != null ? m.getRating() : 0.0,
                    m.getLanguage() != null ? m.getLanguage() : "EN"));
        }

        sb.append("\n=== UPCOMING SCREENINGS (next 30) ===\n");
        for (Screening s : screenings) {
            long booked = screeningRepository.countBookedSeats(s.getId());
            int total = s.getHall().getTotalCapacity();
            long availSeats = Math.max(0, total - booked);
            sb.append(String.format("  Movie [ID:%d] \"%s\" | %s | Hall: %s | Price: $%.2f | Available Seats: %d/%d\n",
                    s.getMovie().getId(), s.getMovie().getTitle(),
                    s.getStartTime().format(DISPLAY_FMT),
                    s.getHall().getName(),
                    s.getPrice(),
                    availSeats,
                    total));
        }
        return sb.toString();
    }

    private String buildSystemInstruction(String movieContext) {
        return "You are CineChain's friendly and knowledgeable AI Movie Concierge. " +
                "Your job is to help cinema guests find the perfect movie, suggest great seats, and answer cinema questions. " +
                "Be concise, warm, and enthusiastic. Use emojis sparingly. " +
                "When recommending movies, refer to them by their exact title and mention their ID in brackets (e.g. [ID:3]) " +
                "so the system can show clickable cards. " +
                "For seat advice: front rows (A-B) are great for immersion, center rows (C-E) for balanced view, back rows for comfort. " +
                "Never invent movies not in the list below.\n\n" +
                movieContext;
    }

    private String buildUserPrompt(AiChatRequest request) {
        if (request.getHistory() == null || request.getHistory().isEmpty()) {
            return request.getMessage();
        }
        StringBuilder sb = new StringBuilder();
        sb.append("Previous conversation:\n");
        for (AiChatRequest.ChatMessage msg : request.getHistory()) {
            String role = "model".equalsIgnoreCase(msg.getRole()) ? "Assistant" : "User";
            sb.append(role).append(": ").append(msg.getText()).append("\n");
        }
        sb.append("\nUser: ").append(request.getMessage());
        return sb.toString();
    }

    private List<Long> extractMentionedMovieIds(String reply, List<Movie> movies) {
        List<Long> ids = new ArrayList<>();
        Pattern pattern = Pattern.compile("\\[ID:(\\d+)\\]");
        Matcher matcher = pattern.matcher(reply);
        while (matcher.find()) {
            try {
                ids.add(Long.parseLong(matcher.group(1)));
            } catch (NumberFormatException ignored) {}
        }
        if (ids.isEmpty()) {
            String replyLower = reply.toLowerCase();
            for (Movie m : movies) {
                if (replyLower.contains(m.getTitle().toLowerCase())) {
                    ids.add(m.getId());
                }
            }
        }
        return ids;
    }
}
