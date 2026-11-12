package com.cinechain.dto.hall;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class HallRequest {
    @NotBlank(message = "Hall name is required")
    private String name;

    @NotNull(message = "Total capacity is required")
    private Integer totalCapacity;

    @NotNull(message = "Cinema ID is required")
    private Long cinemaId;
}
