package com.cinechain.repository;

import com.cinechain.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {

    List<Movie> findByStatus(String status);

    Page<Movie> findByStatus(String status, Pageable pageable);

    List<Movie> findByGenre(String genre);

    Page<Movie> findByGenre(String genre, Pageable pageable);

    @Query("SELECT m FROM Movie m WHERE LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Movie> searchByTitle(@Param("search") String search, Pageable pageable);

    @Query("SELECT m FROM Movie m WHERE " +
            "(:status IS NULL OR m.status = :status) AND " +
            "(:genre IS NULL OR m.genre = :genre) AND " +
            "(:search IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Movie> findWithFilters(@Param("status") String status,
                                @Param("genre") String genre,
                                @Param("search") String search,
                                Pageable pageable);
}
