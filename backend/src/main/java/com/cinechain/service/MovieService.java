package com.cinechain.service;

import com.cinechain.dto.movie.MovieDto;
import com.cinechain.dto.movie.MovieRequest;
import com.cinechain.entity.Movie;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;

    public Page<MovieDto> getAllMovies(String status, String genre, String search, Pageable pageable) {
        boolean hasStatus = status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL");
        boolean hasGenre = genre != null && !genre.trim().isEmpty() && !genre.equalsIgnoreCase("ALL");
        boolean hasSearch = search != null && !search.trim().isEmpty();

        Page<Movie> movies;
        if (hasSearch) {
            String query = search.trim();
            if (hasStatus && hasGenre) {
                movies = movieRepository.findByStatusAndGenreAndTitleContainingIgnoreCase(status, genre, query, pageable);
            } else if (hasStatus) {
                movies = movieRepository.findByStatusAndTitleContainingIgnoreCase(status, query, pageable);
            } else if (hasGenre) {
                movies = movieRepository.findByGenreAndTitleContainingIgnoreCase(genre, query, pageable);
            } else {
                movies = movieRepository.findByTitleContainingIgnoreCase(query, pageable);
            }
        } else if (hasStatus && hasGenre) {
            movies = movieRepository.findByStatusAndGenre(status, genre, pageable);
        } else if (hasStatus) {
            movies = movieRepository.findByStatus(status, pageable);
        } else if (hasGenre) {
            movies = movieRepository.findByGenre(genre, pageable);
        } else {
            movies = movieRepository.findAll(pageable);
        }
        return movies.map(MovieDto::from);
    }

    public List<MovieDto> getMoviesByStatus(String status) {
        return movieRepository.findByStatus(status).stream().map(MovieDto::from).toList();
    }

    public MovieDto getMovieById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));
        return MovieDto.from(movie);
    }

    @Transactional
    public MovieDto createMovie(MovieRequest request) {
        Movie movie = Movie.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .genre(request.getGenre())
                .language(request.getLanguage())
                .durationMinutes(request.getDurationMinutes())
                .posterUrl(request.getPosterUrl())
                .trailerUrl(request.getTrailerUrl())
                .releaseDate(request.getReleaseDate())
                .rating(request.getRating())
                .status(request.getStatus() != null ? request.getStatus() : "NOW_SHOWING")
                .build();

        return MovieDto.from(movieRepository.save(movie));
    }

    @Transactional
    public MovieDto updateMovie(Long id, MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));

        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setGenre(request.getGenre());
        movie.setLanguage(request.getLanguage());
        movie.setDurationMinutes(request.getDurationMinutes());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setTrailerUrl(request.getTrailerUrl());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setRating(request.getRating());
        if (request.getStatus() != null) {
            movie.setStatus(request.getStatus());
        }

        return MovieDto.from(movieRepository.save(movie));
    }

    @Transactional
    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Movie not found with id: " + id);
        }
        movieRepository.deleteById(id);
    }
}
