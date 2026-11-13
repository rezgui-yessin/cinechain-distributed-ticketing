package com.cinechain.dto.resale;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResaleBuyRequest {

    @NotBlank(message = "New ticket holder name is required")
    private String newHolderName;
}
