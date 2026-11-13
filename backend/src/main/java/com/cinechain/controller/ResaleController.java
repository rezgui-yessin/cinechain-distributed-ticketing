package com.cinechain.controller;

import com.cinechain.dto.resale.ResaleBuyRequest;
import com.cinechain.dto.resale.ResaleCreateRequest;
import com.cinechain.dto.resale.ResaleListingDto;
import com.cinechain.entity.User;
import com.cinechain.service.ResaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resale")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ResaleController {

    private final ResaleService resaleService;

    @GetMapping("/marketplace")
    public ResponseEntity<List<ResaleListingDto>> getMarketplaceListings() {
        return ResponseEntity.ok(resaleService.getActiveListings());
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/my-listings")
    public ResponseEntity<List<ResaleListingDto>> getMyListings(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(resaleService.getMyListings(currentUser.getId()));
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/my-purchases")
    public ResponseEntity<List<ResaleListingDto>> getMyPurchases(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(resaleService.getMyPurchasedResales(currentUser.getId()));
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/list")
    public ResponseEntity<ResaleListingDto> createListing(
            @Valid @RequestBody ResaleCreateRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return new ResponseEntity<>(resaleService.createListing(request, currentUser), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/{id}/buy")
    public ResponseEntity<ResaleListingDto> buyListing(
            @PathVariable Long id,
            @Valid @RequestBody ResaleBuyRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(resaleService.buyListing(id, request, currentUser));
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ResaleListingDto> cancelListing(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(resaleService.cancelListing(id, currentUser));
    }
}
