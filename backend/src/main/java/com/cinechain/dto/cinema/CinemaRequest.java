package com.cinechain.dto.cinema;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CinemaRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String address;

    @NotBlank(message = "City is required")
    private String city;

    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    private String imageUrl;
}
