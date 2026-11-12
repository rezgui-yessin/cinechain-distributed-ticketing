package com.cinechain.controller;

import com.cinechain.dto.booking.BookingDto;
import com.cinechain.dto.booking.BookingRequest;
import com.cinechain.entity.User;
import com.cinechain.exception.UnauthorizedException;
import com.cinechain.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/api/bookings")
    public ResponseEntity<BookingDto> createBooking(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return new ResponseEntity<>(bookingService.createBooking(request, currentUser.getId()), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/api/customer/bookings")
    public ResponseEntity<Page<BookingDto>> getCustomerBookings(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(bookingService.getBookingsByCustomer(currentUser.getId(), pageRequest));
    }

    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER')")
    @GetMapping("/api/bookings/{id}")
    public ResponseEntity<BookingDto> getBookingById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        BookingDto booking = bookingService.getBookingById(id);
        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");
        if (!isAdmin && !booking.getCustomerId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You are not authorized to view this booking");
        }
        return ResponseEntity.ok(booking);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/bookings")
    public ResponseEntity<Page<BookingDto>> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(bookingService.getAllBookings(pageRequest));
    }
}
