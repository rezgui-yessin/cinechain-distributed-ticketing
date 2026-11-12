package com.cinechain.controller;

import com.cinechain.dto.cinema.CinemaDto;
import com.cinechain.dto.cinema.CinemaRequest;
import com.cinechain.service.CinemaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaService cinemaService;

    @GetMapping("/api/cinemas")
    public ResponseEntity<List<CinemaDto>> getAllCinemas() {
        return ResponseEntity.ok(cinemaService.getAllCinemas());
    }

    @GetMapping("/api/cinemas/{id}")
    public ResponseEntity<CinemaDto> getCinemaById(@PathVariable Long id) {
        return ResponseEntity.ok(cinemaService.getCinemaById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/cinemas")
    public ResponseEntity<List<CinemaDto>> getAdminCinemas() {
        return ResponseEntity.ok(cinemaService.getAllCinemas());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/cinemas")
    public ResponseEntity<CinemaDto> createCinema(@Valid @RequestBody CinemaRequest request) {
        return new ResponseEntity<>(cinemaService.createCinema(request), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/admin/cinemas/{id}")
    public ResponseEntity<CinemaDto> updateCinema(@PathVariable Long id, @Valid @RequestBody CinemaRequest request) {
        return ResponseEntity.ok(cinemaService.updateCinema(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/cinemas/{id}")
    public ResponseEntity<Void> deleteCinema(@PathVariable Long id) {
        cinemaService.deleteCinema(id);
        return ResponseEntity.noContent().build();
    }
}
