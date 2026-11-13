package com.cinechain.controller;

import com.cinechain.dto.booking.BookingDto;
import com.cinechain.dto.payment.ConfirmPaymentRequest;
import com.cinechain.dto.payment.CreatePaymentIntentRequest;
import com.cinechain.dto.payment.PaymentIntentResponse;
import com.cinechain.entity.User;
import com.cinechain.service.StripePaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class PaymentController {

    private final StripePaymentService stripePaymentService;

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        return ResponseEntity.ok(Map.of("publishableKey", stripePaymentService.getPublishableKey()));
    }

    @PostMapping("/create-payment-intent")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent(
            @Valid @RequestBody CreatePaymentIntentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(stripePaymentService.createPaymentIntent(request, currentUser));
    }

    @PostMapping("/confirm-payment")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingDto> confirmPayment(
            @Valid @RequestBody ConfirmPaymentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(stripePaymentService.confirmPayment(request, currentUser));
    }
}
