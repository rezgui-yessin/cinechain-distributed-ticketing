package com.cinechain.dto.concession;

import com.cinechain.entity.ConcessionOrder;
import com.cinechain.enums.ConcessionDeliveryType;
import com.cinechain.enums.ConcessionOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConcessionOrderDto {
    private Long id;
    private String orderNumber;
    private Long userId;
    private String customerName;
    private Long ticketId;
    private Long screeningId;
    private String hallName;
    private String seatLabel;
    private BigDecimal totalAmount;
    private ConcessionOrderStatus status;
    private ConcessionDeliveryType deliveryType;
    private String notes;
    private List<ConcessionOrderItemDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deliveredAt;

    public static ConcessionOrderDto from(ConcessionOrder order) {
        return ConcessionOrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .customerName(order.getCustomerName())
                .ticketId(order.getTicketId())
                .screeningId(order.getScreeningId())
                .hallName(order.getHallName())
                .seatLabel(order.getSeatLabel())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .deliveryType(order.getDeliveryType())
                .notes(order.getNotes())
                .items(order.getItems() != null
                        ? order.getItems().stream().map(ConcessionOrderItemDto::from).toList()
                        : List.of())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .deliveredAt(order.getDeliveredAt())
                .build();
    }
}
