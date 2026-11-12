package com.cinechain.repository;

import com.cinechain.entity.Ticket;
import com.cinechain.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByBookingId(Long bookingId);

    Optional<Ticket> findByQrCodeData(String qrCodeData);

    List<Ticket> findByStatus(TicketStatus status);

    long countByStatus(TicketStatus status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.booking.customer.id = :customerId AND t.status = :status")
    long countByCustomerAndStatus(@Param("customerId") Long customerId, @Param("status") TicketStatus status);

    @Query("SELECT t FROM Ticket t WHERE t.booking.customer.id = :customerId")
    List<Ticket> findByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT t FROM Ticket t WHERE t.booking.customer.id = :customerId " +
            "AND t.status = 'ACTIVE' AND t.booking.screening.startTime >= CURRENT_TIMESTAMP " +
            "ORDER BY t.booking.screening.startTime ASC")
    List<Ticket> findUpcomingByCustomer(@Param("customerId") Long customerId);

    @Query("SELECT t FROM Ticket t WHERE t.validatedBy IS NOT NULL ORDER BY t.validatedAt DESC")
    List<Ticket> findRecentlyValidated();

    @Query("SELECT t FROM Ticket t WHERE t.status = 'ACTIVE' AND t.booking.screening.endTime < :now")
    List<Ticket> findActiveTicketsWithScreeningEnded(@Param("now") java.time.LocalDateTime now);
}
