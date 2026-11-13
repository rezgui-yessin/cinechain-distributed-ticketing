package com.cinechain.repository;

import com.cinechain.entity.ResaleListing;
import com.cinechain.enums.ResaleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResaleListingRepository extends JpaRepository<ResaleListing, Long> {

    @Query("SELECT r FROM ResaleListing r " +
           "JOIN FETCH r.ticket t " +
           "JOIN FETCH t.booking b " +
           "JOIN FETCH b.screening s " +
           "JOIN FETCH s.movie m " +
           "JOIN FETCH s.hall h " +
           "JOIN FETCH h.cinema c " +
           "WHERE r.status = 'AVAILABLE' AND s.startTime > :minStartTime " +
           "ORDER BY r.createdAt DESC")
    List<ResaleListing> findActiveListings(@Param("minStartTime") LocalDateTime minStartTime);

    @Query("SELECT r FROM ResaleListing r " +
           "WHERE r.seller.id = :sellerId " +
           "ORDER BY r.createdAt DESC")
    List<ResaleListing> findBySellerId(@Param("sellerId") Long sellerId);

    @Query("SELECT r FROM ResaleListing r " +
           "WHERE r.buyer.id = :buyerId " +
           "ORDER BY r.soldAt DESC")
    List<ResaleListing> findByBuyerId(@Param("buyerId") Long buyerId);

    Optional<ResaleListing> findByTicketIdAndStatus(Long ticketId, ResaleStatus status);
}
