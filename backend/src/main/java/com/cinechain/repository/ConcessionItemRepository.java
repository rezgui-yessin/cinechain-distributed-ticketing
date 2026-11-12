package com.cinechain.repository;

import com.cinechain.entity.ConcessionItem;
import com.cinechain.enums.ConcessionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConcessionItemRepository extends JpaRepository<ConcessionItem, Long> {

    List<ConcessionItem> findByAvailableTrueOrderByCategoryAscNameAsc();

    List<ConcessionItem> findByCategoryAndAvailableTrue(ConcessionCategory category);
}
