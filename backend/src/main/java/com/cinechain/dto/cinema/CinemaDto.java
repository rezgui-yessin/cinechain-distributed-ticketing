package com.cinechain.dto.cinema;

import com.cinechain.entity.Cinema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CinemaDto {
    private Long id;
    private String name;
    private String address;
    private String city;
    private String phone;
    private String email;
    private String imageUrl;
    private LocalDateTime createdAt;
    private int hallCount;

    public static CinemaDto from(Cinema cinema) {
        return CinemaDto.builder()
                .id(cinema.getId())
                .name(cinema.getName())
                .address(cinema.getAddress())
                .city(cinema.getCity())
                .phone(cinema.getPhone())
                .email(cinema.getEmail())
                .imageUrl(cinema.getImageUrl())
                .createdAt(cinema.getCreatedAt())
                .hallCount(cinema.getHalls() != null ? cinema.getHalls().size() : 0)
                .build();
    }
}
