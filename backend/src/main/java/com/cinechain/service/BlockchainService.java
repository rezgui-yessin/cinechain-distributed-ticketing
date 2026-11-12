package com.cinechain.service;

import com.cinechain.entity.BlockchainTransaction;
import com.cinechain.enums.TransactionType;
import com.cinechain.repository.BlockchainTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlockchainService {

    private final BlockchainTransactionRepository transactionRepository;

    public BlockchainTransaction recordTransaction(Long ticketId, Long bookingId, TransactionType type, String data) {
        long timestamp = System.currentTimeMillis();
        String rawData = String.format("ticket:%s:booking:%s:type:%s:ts:%d", ticketId, bookingId, type, timestamp);
        String txHash = "0x" + sha256(rawData);

        long fakeBlockNumber = ThreadLocalRandom.current().nextLong(1_000_000L, 9_999_999L);
        long gasUsed = ThreadLocalRandom.current().nextLong(21_000L, 50_000L);

        BlockchainTransaction transaction = BlockchainTransaction.builder()
                .transactionHash(txHash)
                .ticketId(ticketId)
                .bookingId(bookingId)
                .type(type)
                .status("CONFIRMED")
                .blockNumber(fakeBlockNumber)
                .gasUsed(gasUsed)
                .data(data)
                .confirmedAt(LocalDateTime.now())
                .build();

        BlockchainTransaction saved = transactionRepository.save(transaction);
        log.info("Recorded blockchain transaction hash={} type={} ticketId={}", txHash, type, ticketId);
        return saved;
    }

    public Page<BlockchainTransaction> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public List<BlockchainTransaction> getTransactionsByTicket(Long ticketId) {
        return transactionRepository.findByTicketId(ticketId);
    }

    public List<BlockchainTransaction> getTransactionsByBooking(Long bookingId) {
        return transactionRepository.findByBookingId(bookingId);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : encodedHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
