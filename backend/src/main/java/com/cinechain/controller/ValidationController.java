package com.cinechain.controller;

import com.cinechain.dto.ticket.TicketDto;
import com.cinechain.dto.ticket.ValidationRequest;
import com.cinechain.entity.User;
import com.cinechain.service.ValidationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/validation")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ValidationController {

    private final ValidationService validationService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/validate")
    public ResponseEntity<TicketDto> validateTicket(
            @Valid @RequestBody ValidationRequest request,
            @AuthenticationPrincipal User adminUser
    ) {
        return ResponseEntity.ok(validationService.validateTicket(request, adminUser));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/history")
    public ResponseEntity<List<TicketDto>> getValidationHistory() {
        return ResponseEntity.ok(validationService.getValidationHistory());
    }
}
