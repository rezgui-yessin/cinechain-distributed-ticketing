package com.cinechain.service;

import com.cinechain.dto.cinema.CinemaDto;
import com.cinechain.dto.cinema.CinemaRequest;
import com.cinechain.entity.Cinema;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.repository.CinemaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CinemaService {

    private final CinemaRepository cinemaRepository;

    public List<CinemaDto> getAllCinemas() {
        return cinemaRepository.findAll().stream().map(CinemaDto::from).toList();
    }

    public CinemaDto getCinemaById(Long id) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cinema not found with id: " + id));
        return CinemaDto.from(cinema);
    }

    @Transactional
    public CinemaDto createCinema(CinemaRequest request) {
        Cinema cinema = Cinema.builder()
                .name(request.getName())
                .address(request.getAddress())
                .city(request.getCity())
                .phone(request.getPhone())
                .email(request.getEmail())
                .imageUrl(request.getImageUrl())
                .build();
        return CinemaDto.from(cinemaRepository.save(cinema));
    }

    @Transactional
    public CinemaDto updateCinema(Long id, CinemaRequest request) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cinema not found with id: " + id));

        cinema.setName(request.getName());
        cinema.setAddress(request.getAddress());
        cinema.setCity(request.getCity());
        cinema.setPhone(request.getPhone());
        cinema.setEmail(request.getEmail());
        cinema.setImageUrl(request.getImageUrl());

        return CinemaDto.from(cinemaRepository.save(cinema));
    }

    @Transactional
    public void deleteCinema(Long id) {
        if (!cinemaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cinema not found with id: " + id);
        }
        cinemaRepository.deleteById(id);
    }
}
