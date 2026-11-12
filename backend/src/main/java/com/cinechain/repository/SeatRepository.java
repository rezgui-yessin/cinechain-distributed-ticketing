package com.cinechain.repository;

import com.cinechain.entity.Seat;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {

    List<Seat> findByHallId(Long hallId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Seat s WHERE s.id = :id")
    Optional<Seat> findByIdWithLock(@Param("id") Long id);

    @Query("SELECT s FROM Seat s WHERE s.hall.id = :hallId " +
            "AND s.id NOT IN (" +
            "  SELECT t.seat.id FROM Ticket t " +
            "  WHERE t.booking.screening.id = :screeningId " +
            "  AND t.status <> 'CANCELLED'" +
            ")")
    List<Seat> findAvailableSeatsByHallAndScreening(@Param("hallId") Long hallId,
                                                     @Param("screeningId") Long screeningId);
}
