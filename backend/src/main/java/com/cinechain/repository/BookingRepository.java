package com.cinechain.repository;

import com.cinechain.entity.Booking;
import com.cinechain.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCustomerId(Long customerId);

    Page<Booking> findByCustomerId(Long customerId, Pageable pageable);

    List<Booking> findByCustomerIdAndStatus(Long customerId, BookingStatus status);

    Page<Booking> findByCustomerIdAndStatus(Long customerId, BookingStatus status, Pageable pageable);

    Optional<Booking> findByBookingReference(String bookingReference);

    @Query("SELECT SUM(b.totalAmount) FROM Booking b WHERE b.status <> 'CANCELLED'")
    BigDecimal sumTotalRevenue();

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.customer.id = :customerId AND b.screening.startTime >= CURRENT_TIMESTAMP")
    long countUpcomingByCustomer(@Param("customerId") Long customerId);
}
