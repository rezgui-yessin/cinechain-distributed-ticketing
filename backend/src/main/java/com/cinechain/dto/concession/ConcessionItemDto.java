package com.cinechain.dto.concession;

import com.cinechain.entity.ConcessionItem;
import com.cinechain.enums.ConcessionCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConcessionItemDto {
    private Long id;
    private String name;
    private ConcessionCategory category;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private String badge;
    private Integer calories;
    private boolean available;

    public static ConcessionItemDto from(ConcessionItem item) {
        return ConcessionItemDto.builder()
                .id(item.getId())
                .name(item.getName())
                .category(item.getCategory())
                .description(item.getDescription())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .badge(item.getBadge())
                .calories(item.getCalories())
                .available(item.isAvailable())
                .build();
    }
}
