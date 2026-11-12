package com.cinechain.dto.seat;

import com.cinechain.entity.Seat;
import com.cinechain.enums.SeatStatus;
import com.cinechain.enums.SeatType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatDto {
    private Long id;
    private String rowLabel;
    private int seatNumber;
    private SeatType seatType;
    private SeatStatus status;
    private Long hallId;

    public static SeatDto from(Seat seat, SeatStatus status) {
        return SeatDto.builder()
                .id(seat.getId())
                .rowLabel(seat.getRowLabel())
                .seatNumber(seat.getSeatNumber())
                .seatType(seat.getSeatType())
                .status(status != null ? status : SeatStatus.AVAILABLE)
                .hallId(seat.getHall() != null ? seat.getHall().getId() : null)
                .build();
    }
}
