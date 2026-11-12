package com.cinechain.service;

import com.cinechain.dto.seat.SeatDto;
import com.cinechain.entity.Seat;
import com.cinechain.enums.SeatStatus;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.repository.ScreeningRepository;
import com.cinechain.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeatService {

    private final SeatRepository seatRepository;
    private final ScreeningRepository screeningRepository;

    public List<SeatDto> getByHallId(Long hallId) {
        return seatRepository.findByHallId(hallId).stream()
                .map(seat -> SeatDto.from(seat, SeatStatus.AVAILABLE))
                .toList();
    }

    public List<SeatDto> getAvailableSeats(Long screeningId) {
        var screening = screeningRepository.findById(screeningId)
                .orElseThrow(() -> new ResourceNotFoundException("Screening not found with id: " + screeningId));

        Long hallId = screening.getHall().getId();
        List<Seat> allSeats = seatRepository.findByHallId(hallId);
        List<Seat> availableSeats = seatRepository.findAvailableSeatsByHallAndScreening(hallId, screeningId);
        Set<Long> availableIds = availableSeats.stream().map(Seat::getId).collect(Collectors.toSet());

        return allSeats.stream()
                .map(seat -> {
                    SeatStatus status = availableIds.contains(seat.getId()) ? SeatStatus.AVAILABLE : SeatStatus.BOOKED;
                    return SeatDto.from(seat, status);
                })
                .toList();
    }
}
