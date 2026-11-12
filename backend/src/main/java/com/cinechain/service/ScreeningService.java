package com.cinechain.service;

import com.cinechain.dto.screening.ScreeningDto;
import com.cinechain.dto.screening.ScreeningRequest;
import com.cinechain.entity.Hall;
import com.cinechain.entity.Movie;
import com.cinechain.entity.Screening;
import com.cinechain.entity.Seat;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.repository.HallRepository;
import com.cinechain.repository.MovieRepository;
import com.cinechain.repository.ScreeningRepository;
import com.cinechain.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScreeningService {

    private final ScreeningRepository screeningRepository;
    private final MovieRepository movieRepository;
    private final HallRepository hallRepository;
    private final SeatRepository seatRepository;

    public Page<ScreeningDto> getAllScreenings(Pageable pageable) {
        return screeningRepository.findAll(pageable).map(this::toDto);
    }

    public List<ScreeningDto> getAvailableScreenings(Long movieId) {
        return screeningRepository.findAvailableByMovieId(movieId, LocalDateTime.now())
                .stream()
                .map(this::toDto)
                .toList();
    }

    public ScreeningDto getScreeningById(Long id) {
        Screening screening = screeningRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Screening not found with id: " + id));
        return toDto(screening);
    }

    @Transactional
    public ScreeningDto createScreening(ScreeningRequest request) {
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + request.getMovieId()));
        Hall hall = hallRepository.findById(request.getHallId())
                .orElseThrow(() -> new ResourceNotFoundException("Hall not found with id: " + request.getHallId()));

        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new IllegalArgumentException("Screening end time must be after start time");
        }

        List<Screening> overlapping = screeningRepository.findOverlappingScreenings(
                hall.getId(), request.getStartTime(), request.getEndTime()
        );

        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException("Hall already has a scheduled screening in the specified time frame");
        }

        Screening screening = Screening.builder()
                .movie(movie)
                .hall(hall)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .price(request.getPrice())
                .status(request.getStatus() != null ? request.getStatus() : "SCHEDULED")
                .build();

        return toDto(screeningRepository.save(screening));
    }

    @Transactional
    public ScreeningDto updateScreening(Long id, ScreeningRequest request) {
        Screening screening = screeningRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Screening not found with id: " + id));

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + request.getMovieId()));
        Hall hall = hallRepository.findById(request.getHallId())
                .orElseThrow(() -> new ResourceNotFoundException("Hall not found with id: " + request.getHallId()));

        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new IllegalArgumentException("Screening end time must be after start time");
        }

        List<Screening> overlapping = screeningRepository.findOverlappingScreenings(
                hall.getId(), request.getStartTime(), request.getEndTime()
        ).stream().filter(s -> !s.getId().equals(id)).toList();

        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException("Hall already has another scheduled screening in the specified time frame");
        }

        screening.setMovie(movie);
        screening.setHall(hall);
        screening.setStartTime(request.getStartTime());
        screening.setEndTime(request.getEndTime());
        screening.setPrice(request.getPrice());
        if (request.getStatus() != null) {
            screening.setStatus(request.getStatus());
        }

        return toDto(screeningRepository.save(screening));
    }

    @Transactional
    public void deleteScreening(Long id) {
        if (!screeningRepository.existsById(id)) {
            throw new ResourceNotFoundException("Screening not found with id: " + id);
        }
        screeningRepository.deleteById(id);
    }

    public long getOccupancy(Long screeningId) {
        return screeningRepository.countBookedSeats(screeningId);
    }

    public ScreeningDto toDto(Screening screening) {
        List<Seat> allSeats = seatRepository.findByHallId(screening.getHall().getId());
        long totalSeats = allSeats.size();
        long bookedSeats = screeningRepository.countBookedSeats(screening.getId());
        long availableSeats = Math.max(0, totalSeats - bookedSeats);
        return ScreeningDto.from(screening, availableSeats, totalSeats);
    }
}
