package com.cinechain.controller;

import com.cinechain.dto.ticket.HolderNameUpdateRequest;
import com.cinechain.dto.ticket.TicketDto;
import com.cinechain.entity.User;
import com.cinechain.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/api/customer/tickets")
    public ResponseEntity<List<TicketDto>> getCustomerTickets(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.getMyTickets(currentUser.getId()));
    }

    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER')")
    @GetMapping("/api/tickets/{id}")
    public ResponseEntity<TicketDto> getTicketById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");
        return ResponseEntity.ok(ticketService.getTicketById(id, currentUser.getId(), isAdmin));
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/api/tickets/{id}/cancel")
    public ResponseEntity<TicketDto> cancelTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");
        return ResponseEntity.ok(ticketService.cancelTicket(id, currentUser.getId(), isAdmin));
    }

    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @PutMapping({"/api/tickets/{id}/holder", "/api/tickets/{id}/holder-name"})
    public ResponseEntity<TicketDto> updateHolderName(
            @PathVariable Long id,
            @Valid @RequestBody HolderNameUpdateRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");
        return ResponseEntity.ok(ticketService.changeHolderName(id, currentUser.getId(), request.getHolderName(), isAdmin));
    }
}
