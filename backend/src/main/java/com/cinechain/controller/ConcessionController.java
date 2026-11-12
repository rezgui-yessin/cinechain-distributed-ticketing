package com.cinechain.controller;

import com.cinechain.dto.concession.ConcessionItemDto;
import com.cinechain.dto.concession.ConcessionOrderDto;
import com.cinechain.dto.concession.ConcessionOrderRequest;
import com.cinechain.entity.User;
import com.cinechain.enums.ConcessionOrderStatus;
import com.cinechain.service.ConcessionService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/concessions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ConcessionController {

    private final ConcessionService concessionService;

    @GetMapping("/menu")
    public ResponseEntity<List<ConcessionItemDto>> getMenu() {
        return ResponseEntity.ok(concessionService.getMenu());
    }

    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @PostMapping("/orders")
    public ResponseEntity<ConcessionOrderDto> createOrder(
            @Valid @RequestBody ConcessionOrderRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return new ResponseEntity<>(concessionService.createOrder(request, currentUser), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @GetMapping("/my-orders")
    public ResponseEntity<List<ConcessionOrderDto>> getMyOrders(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(concessionService.getMyOrders(currentUser.getId()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/orders")
    public ResponseEntity<Page<ConcessionOrderDto>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(concessionService.getAllOrders(pageRequest));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ConcessionOrderDto> updateStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest body,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(concessionService.updateOrderStatus(id, body.getStatus(), currentUser));
    }

    @Data
    public static class StatusUpdateRequest {
        private ConcessionOrderStatus status;
    }
}
