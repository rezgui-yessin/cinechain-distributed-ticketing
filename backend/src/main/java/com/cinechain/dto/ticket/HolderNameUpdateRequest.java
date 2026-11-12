package com.cinechain.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HolderNameUpdateRequest {
    @NotBlank(message = "Holder name is required")
    private String holderName;
}
