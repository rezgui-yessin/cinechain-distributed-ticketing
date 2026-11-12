package com.cinechain.repository;

import com.cinechain.entity.BlockchainTransaction;
import com.cinechain.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlockchainTransactionRepository extends JpaRepository<BlockchainTransaction, Long> {

    List<BlockchainTransaction> findByTicketId(Long ticketId);

    List<BlockchainTransaction> findByBookingId(Long bookingId);

    List<BlockchainTransaction> findByType(TransactionType type);

    List<BlockchainTransaction> findByStatus(String status);

    Page<BlockchainTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
