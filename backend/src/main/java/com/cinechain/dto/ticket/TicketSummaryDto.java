package com.cinechain.dto.ticket;

import com.cinechain.entity.Ticket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketSummaryDto {
    private Long id;
    private String holderName;
    private String qrCode;
    private String qrCodeData;
    private String status;
    private String seatLabel;
    private String seatType;

    public static TicketSummaryDto from(Ticket ticket) {
        return TicketSummaryDto.builder()
                .id(ticket.getId())
                .holderName(ticket.getHolderName())
                .qrCode(ticket.getQrCode())
                .qrCodeData(ticket.getQrCodeData())
                .status(ticket.getStatus().name())
                .seatLabel(ticket.getSeat().getRowLabel() + ticket.getSeat().getSeatNumber())
                .seatType(ticket.getSeat().getSeatType().name())
                .build();
    }
}
