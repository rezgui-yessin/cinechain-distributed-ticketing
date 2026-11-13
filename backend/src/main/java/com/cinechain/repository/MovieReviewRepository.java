package com.cinechain.repository;

import com.cinechain.entity.MovieReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieReviewRepository extends JpaRepository<MovieReview, Long> {

    @Query("SELECT r FROM MovieReview r WHERE r.movie.id = :movieId AND r.isFlagged = false ORDER BY r.createdAt DESC")
    List<MovieReview> findApprovedByMovieId(@Param("movieId") Long movieId);

    List<MovieReview> findByMovieId(Long movieId);
}
