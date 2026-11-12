package com.cinechain.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ValidationRequest {

    @NotBlank(message = "QR code data is required")
    private String qrCodeData;
}
