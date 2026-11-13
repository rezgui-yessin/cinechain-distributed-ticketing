package com.cinechain.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieReviewRequest {

    @NotNull(message = "Movie ID is required")
    private Long movieId;

    @NotNull(message = "Rating is required")
    private Double rating;

    @NotBlank(message = "Review content is required")
    private String content;
}
