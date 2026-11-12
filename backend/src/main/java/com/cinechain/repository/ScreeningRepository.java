package com.cinechain.repository;

import com.cinechain.entity.Screening;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScreeningRepository extends JpaRepository<Screening, Long> {

    List<Screening> findByMovieId(Long movieId);

    Page<Screening> findByMovieId(Long movieId, Pageable pageable);

    List<Screening> findByHallId(Long hallId);

    List<Screening> findByStatus(String status);

    Page<Screening> findByStatus(String status, Pageable pageable);

    @Query("SELECT s FROM Screening s WHERE s.hall.id = :hallId " +
            "AND s.status <> 'CANCELLED' " +
            "AND s.startTime < :endTime AND s.endTime > :startTime")
    List<Screening> findOverlappingScreenings(@Param("hallId") Long hallId,
                                               @Param("startTime") LocalDateTime startTime,
                                               @Param("endTime") LocalDateTime endTime);

    @Query("SELECT s FROM Screening s WHERE s.movie.id = :movieId " +
            "AND s.status = 'SCHEDULED' AND s.startTime >= :now " +
            "ORDER BY s.startTime ASC")
    List<Screening> findAvailableByMovieId(@Param("movieId") Long movieId,
                                            @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.booking.screening.id = :screeningId AND t.status <> 'CANCELLED'")
    long countBookedSeats(@Param("screeningId") Long screeningId);
}
