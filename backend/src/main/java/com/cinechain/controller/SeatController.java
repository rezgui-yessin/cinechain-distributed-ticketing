package com.cinechain.controller;

import com.cinechain.dto.seat.SeatDto;
import com.cinechain.service.SeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SeatController {

    private final SeatService seatService;

    @GetMapping("/api/screenings/{screeningId}/seats")
    public ResponseEntity<List<SeatDto>> getSeatsForScreening(@PathVariable Long screeningId) {
        return ResponseEntity.ok(seatService.getAvailableSeats(screeningId));
    }

    @GetMapping("/api/halls/{hallId}/seats")
    public ResponseEntity<List<SeatDto>> getSeatsForHall(@PathVariable Long hallId) {
        return ResponseEntity.ok(seatService.getByHallId(hallId));
    }
}
