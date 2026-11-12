package com.cinechain.service;

import com.cinechain.dto.hall.HallDto;
import com.cinechain.dto.hall.HallRequest;
import com.cinechain.entity.Cinema;
import com.cinechain.entity.Hall;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.repository.CinemaRepository;
import com.cinechain.repository.HallRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HallService {

    private final HallRepository hallRepository;
    private final CinemaRepository cinemaRepository;

    public List<HallDto> getAllHalls() {
        return hallRepository.findAll().stream().map(HallDto::from).toList();
    }

    public List<HallDto> getByCinemaId(Long cinemaId) {
        return hallRepository.findByCinemaId(cinemaId).stream().map(HallDto::from).toList();
    }

    public HallDto getHallById(Long id) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hall not found with id: " + id));
        return HallDto.from(hall);
    }

    @Transactional
    public HallDto createHall(HallRequest request) {
        Cinema cinema = cinemaRepository.findById(request.getCinemaId())
                .orElseThrow(() -> new ResourceNotFoundException("Cinema not found with id: " + request.getCinemaId()));

        Hall hall = Hall.builder()
                .name(request.getName())
                .totalCapacity(request.getTotalCapacity())
                .cinema(cinema)
                .build();

        return HallDto.from(hallRepository.save(hall));
    }

    @Transactional
    public HallDto updateHall(Long id, HallRequest request) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hall not found with id: " + id));

        if (!hall.getCinema().getId().equals(request.getCinemaId())) {
            Cinema cinema = cinemaRepository.findById(request.getCinemaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cinema not found with id: " + request.getCinemaId()));
            hall.setCinema(cinema);
        }

        hall.setName(request.getName());
        hall.setTotalCapacity(request.getTotalCapacity());

        return HallDto.from(hallRepository.save(hall));
    }

    @Transactional
    public void deleteHall(Long id) {
        if (!hallRepository.existsById(id)) {
            throw new ResourceNotFoundException("Hall not found with id: " + id);
        }
        hallRepository.deleteById(id);
    }
}
