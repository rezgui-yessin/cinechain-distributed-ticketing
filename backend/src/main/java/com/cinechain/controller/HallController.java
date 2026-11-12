package com.cinechain.controller;

import com.cinechain.dto.hall.HallDto;
import com.cinechain.dto.hall.HallRequest;
import com.cinechain.service.HallService;
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
public class HallController {

    private final HallService hallService;

    @GetMapping("/api/halls/cinema/{cinemaId}")
    public ResponseEntity<List<HallDto>> getHallsByCinema(@PathVariable Long cinemaId) {
        return ResponseEntity.ok(hallService.getByCinemaId(cinemaId));
    }

    @GetMapping("/api/halls/{id}")
    public ResponseEntity<HallDto> getHallById(@PathVariable Long id) {
        return ResponseEntity.ok(hallService.getHallById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/halls")
    public ResponseEntity<List<HallDto>> getAllHalls() {
        return ResponseEntity.ok(hallService.getAllHalls());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/halls")
    public ResponseEntity<HallDto> createHall(@Valid @RequestBody HallRequest request) {
        return new ResponseEntity<>(hallService.createHall(request), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/admin/halls/{id}")
    public ResponseEntity<HallDto> updateHall(@PathVariable Long id, @Valid @RequestBody HallRequest request) {
        return ResponseEntity.ok(hallService.updateHall(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/halls/{id}")
    public ResponseEntity<Void> deleteHall(@PathVariable Long id) {
        hallService.deleteHall(id);
        return ResponseEntity.noContent().build();
    }
}
