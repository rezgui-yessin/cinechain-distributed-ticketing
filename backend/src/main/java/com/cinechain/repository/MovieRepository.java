package com.cinechain.repository;

import com.cinechain.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {

    List<Movie> findByStatus(String status);

    Page<Movie> findByStatus(String status, Pageable pageable);

    List<Movie> findByGenre(String genre);

    Page<Movie> findByGenre(String genre, Pageable pageable);

    Page<Movie> findByStatusAndGenre(String status, String genre, Pageable pageable);

    Page<Movie> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    Page<Movie> findByStatusAndTitleContainingIgnoreCase(String status, String title, Pageable pageable);

    Page<Movie> findByGenreAndTitleContainingIgnoreCase(String genre, String title, Pageable pageable);

    Page<Movie> findByStatusAndGenreAndTitleContainingIgnoreCase(String status, String genre, String title, Pageable pageable);
}
