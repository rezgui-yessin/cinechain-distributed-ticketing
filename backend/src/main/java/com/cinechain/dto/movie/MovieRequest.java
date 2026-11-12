package com.cinechain.dto.movie;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MovieRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Genre is required")
    private String genre;

    private String language;

    @NotNull(message = "Duration is required")
    private Integer durationMinutes;

    private String posterUrl;

    private String trailerUrl;

    private LocalDate releaseDate;

    private Double rating;

    private String status;
}
