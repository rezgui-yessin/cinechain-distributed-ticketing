package com.cinechain.controller;

import com.cinechain.dto.nft.TicketNftStubDto;
import com.cinechain.entity.User;
import com.cinechain.service.NftStubService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nft-stubs")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class NftStubController {

    private final NftStubService nftStubService;

    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/my-stubs")
    public ResponseEntity<List<TicketNftStubDto>> getMyNftStubs(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(nftStubService.getMyNftStubs(currentUser.getId()));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<TicketNftStubDto> getStubByTicketId(@PathVariable Long ticketId) {
        TicketNftStubDto stub = nftStubService.getStubByTicketId(ticketId);
        return stub != null ? ResponseEntity.ok(stub) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/claim/{ticketId}")
    public ResponseEntity<TicketNftStubDto> claimNftStub(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal User currentUser
    ) {
        return new ResponseEntity<>(nftStubService.claimNftStub(ticketId, currentUser), HttpStatus.CREATED);
    }
}
