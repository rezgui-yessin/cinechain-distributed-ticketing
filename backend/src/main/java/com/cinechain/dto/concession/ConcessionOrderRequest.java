package com.cinechain.dto.concession;

import com.cinechain.enums.ConcessionDeliveryType;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ConcessionOrderRequest {

    private Long ticketId;

    private Long screeningId;

    private String hallName;

    private String seatLabel;

    private ConcessionDeliveryType deliveryType = ConcessionDeliveryType.IN_SEAT;

    private String notes;

    @NotEmpty(message = "Order must contain at least one item")
    private List<ItemRequest> items;

    @Data
    public static class ItemRequest {
        private Long itemId;
        private int quantity;
        private String options;
    }
}
