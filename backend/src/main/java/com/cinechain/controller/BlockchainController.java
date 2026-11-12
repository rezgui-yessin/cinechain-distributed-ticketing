package com.cinechain.controller;

import com.cinechain.entity.BlockchainTransaction;
import com.cinechain.service.BlockchainService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blockchain")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BlockchainController {

    private final BlockchainService blockchainService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/transactions")
    public ResponseEntity<Page<BlockchainTransaction>> getAllTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(blockchainService.getAllTransactions(pageRequest));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/transactions/{ticketId}")
    public ResponseEntity<List<BlockchainTransaction>> getTransactionsByTicket(@PathVariable Long ticketId) {
        return ResponseEntity.ok(blockchainService.getTransactionsByTicket(ticketId));
    }
}
