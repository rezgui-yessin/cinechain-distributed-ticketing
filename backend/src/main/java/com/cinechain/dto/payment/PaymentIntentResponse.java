package com.cinechain.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentIntentResponse {
    private String clientSecret;
    private String paymentIntentId;
    private String publishableKey;
    private Long bookingId;
    private String bookingReference;
    private BigDecimal amount;
    private String currency;
    private String status;
}
