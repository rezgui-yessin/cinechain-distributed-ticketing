package com.cinechain.controller;

import com.cinechain.dto.screening.ScreeningDto;
import com.cinechain.dto.screening.ScreeningRequest;
import com.cinechain.service.ScreeningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ScreeningController {

    private final ScreeningService screeningService;

    @GetMapping("/api/screenings")
    public ResponseEntity<Page<ScreeningDto>> getAllScreenings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "startTime"));
        return ResponseEntity.ok(screeningService.getAllScreenings(pageRequest));
    }

    @GetMapping("/api/screenings/{id}")
    public ResponseEntity<ScreeningDto> getScreeningById(@PathVariable Long id) {
        return ResponseEntity.ok(screeningService.getScreeningById(id));
    }

    @GetMapping("/api/screenings/movie/{movieId}")
    public ResponseEntity<List<ScreeningDto>> getScreeningsByMovie(@PathVariable Long movieId) {
        return ResponseEntity.ok(screeningService.getAvailableScreenings(movieId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/screenings")
    public ResponseEntity<Page<ScreeningDto>> getAdminScreenings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startTime"));
        return ResponseEntity.ok(screeningService.getAllScreenings(pageRequest));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/screenings")
    public ResponseEntity<ScreeningDto> createScreening(@Valid @RequestBody ScreeningRequest request) {
        return new ResponseEntity<>(screeningService.createScreening(request), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/admin/screenings/{id}")
    public ResponseEntity<ScreeningDto> updateScreening(@PathVariable Long id, @Valid @RequestBody ScreeningRequest request) {
        return ResponseEntity.ok(screeningService.updateScreening(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/screenings/{id}")
    public ResponseEntity<Void> deleteScreening(@PathVariable Long id) {
        screeningService.deleteScreening(id);
        return ResponseEntity.noContent().build();
    }
}
