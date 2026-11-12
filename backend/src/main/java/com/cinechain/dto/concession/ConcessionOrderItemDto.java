package com.cinechain.dto.concession;

import com.cinechain.entity.ConcessionOrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConcessionOrderItemDto {
    private Long id;
    private Long itemId;
    private String itemName;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String options;

    public static ConcessionOrderItemDto from(ConcessionOrderItem item) {
        return ConcessionOrderItemDto.builder()
                .id(item.getId())
                .itemId(item.getItem() != null ? item.getItem().getId() : null)
                .itemName(item.getItemName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .options(item.getOptions())
                .build();
    }
}
