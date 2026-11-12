package com.cinechain.entity;

import com.cinechain.enums.ConcessionCategory;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "concession_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConcessionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConcessionCategory category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    private String imageUrl;

    private String badge;

    private Integer calories;

    @Builder.Default
    @Column(nullable = false)
    private boolean available = true;
}
