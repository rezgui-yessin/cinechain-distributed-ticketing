package com.cinechain.dto.hall;

import com.cinechain.entity.Hall;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HallDto {
    private Long id;
    private String name;
    private Integer totalCapacity;
    private Long cinemaId;
    private String cinemaName;

    public static HallDto from(Hall hall) {
        return HallDto.builder()
                .id(hall.getId())
                .name(hall.getName())
                .totalCapacity(hall.getTotalCapacity())
                .cinemaId(hall.getCinema() != null ? hall.getCinema().getId() : null)
                .cinemaName(hall.getCinema() != null ? hall.getCinema().getName() : null)
                .build();
    }
}
