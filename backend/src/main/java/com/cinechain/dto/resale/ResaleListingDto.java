package com.cinechain.dto.resale;

import com.cinechain.entity.ResaleListing;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResaleListingDto {
    private Long id;
    private Long ticketId;
    private String bookingReference;
    private Long sellerId;
    private String sellerName;
    private Long buyerId;
    private String buyerName;
    private BigDecimal originalPrice;
    private BigDecimal resalePrice;
    private BigDecimal discountPercentage;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime soldAt;

    // Movie & Screening context
    private Long movieId;
    private String movieTitle;
    private String moviePosterUrl;
    private String genre;
    private Long screeningId;
    private LocalDateTime screeningStartTime;
    private LocalDateTime screeningEndTime;
    private String cinemaName;
    private String hallName;
    private String seatInfo;
    private String seatType;

    public static ResaleListingDto from(ResaleListing listing) {
        var ticket = listing.getTicket();
        var booking = ticket.getBooking();
        var screening = booking.getScreening();
        var movie = screening.getMovie();
        var hall = screening.getHall();
        var cinema = hall.getCinema();
        var seat = ticket.getSeat();

        BigDecimal discount = BigDecimal.ZERO;
        if (listing.getOriginalPrice() != null && listing.getOriginalPrice().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = listing.getOriginalPrice().subtract(listing.getResalePrice());
            if (diff.compareTo(BigDecimal.ZERO) > 0) {
                discount = diff.divide(listing.getOriginalPrice(), 4, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            }
        }

        return ResaleListingDto.builder()
                .id(listing.getId())
                .ticketId(ticket.getId())
                .bookingReference(booking.getBookingReference())
                .sellerId(listing.getSeller().getId())
                .sellerName(listing.getSeller().getFirstName() + " " + listing.getSeller().getLastName())
                .buyerId(listing.getBuyer() != null ? listing.getBuyer().getId() : null)
                .buyerName(listing.getBuyer() != null ? listing.getBuyer().getFirstName() + " " + listing.getBuyer().getLastName() : null)
                .originalPrice(listing.getOriginalPrice())
                .resalePrice(listing.getResalePrice())
                .discountPercentage(discount)
                .status(listing.getStatus().name())
                .notes(listing.getNotes())
                .createdAt(listing.getCreatedAt())
                .soldAt(listing.getSoldAt())
                .movieId(movie.getId())
                .movieTitle(movie.getTitle())
                .moviePosterUrl(movie.getPosterUrl())
                .genre(movie.getGenre())
                .screeningId(screening.getId())
                .screeningStartTime(screening.getStartTime())
                .screeningEndTime(screening.getEndTime())
                .cinemaName(cinema.getName())
                .hallName(hall.getName())
                .seatInfo(seat.getRowLabel() + seat.getSeatNumber())
                .seatType(seat.getSeatType().name())
                .build();
    }
}
