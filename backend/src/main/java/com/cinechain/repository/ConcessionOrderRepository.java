package com.cinechain.repository;

import com.cinechain.entity.ConcessionOrder;
import com.cinechain.enums.ConcessionOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConcessionOrderRepository extends JpaRepository<ConcessionOrder, Long> {

    List<ConcessionOrder> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<ConcessionOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<ConcessionOrder> findByStatusOrderByCreatedAtAsc(ConcessionOrderStatus status);

    Optional<ConcessionOrder> findByOrderNumber(String orderNumber);
}
