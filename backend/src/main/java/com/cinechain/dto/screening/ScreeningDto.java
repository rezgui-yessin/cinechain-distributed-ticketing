package com.cinechain.dto.screening;

import com.cinechain.entity.Screening;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreeningDto {
    private Long id;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal price;
    private String status;
    private Long movieId;
    private String movieTitle;
    private Long hallId;
    private String hallName;
    private Long cinemaId;
    private String cinemaName;
    private long availableSeats;
    private long totalSeats;

    public static ScreeningDto from(Screening screening, long availableSeats, long totalSeats) {
        return ScreeningDto.builder()
                .id(screening.getId())
                .startTime(screening.getStartTime())
                .endTime(screening.getEndTime())
                .price(screening.getPrice())
                .status(screening.getStatus())
                .movieId(screening.getMovie().getId())
                .movieTitle(screening.getMovie().getTitle())
                .hallId(screening.getHall().getId())
                .hallName(screening.getHall().getName())
                .cinemaId(screening.getHall().getCinema().getId())
                .cinemaName(screening.getHall().getCinema().getName())
                .availableSeats(availableSeats)
                .totalSeats(totalSeats)
                .build();
    }
}
