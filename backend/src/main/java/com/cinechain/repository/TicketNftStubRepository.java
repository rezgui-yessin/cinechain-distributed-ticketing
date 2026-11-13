package com.cinechain.repository;

import com.cinechain.entity.TicketNftStub;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketNftStubRepository extends JpaRepository<TicketNftStub, Long> {

    @Query("SELECT n FROM TicketNftStub n WHERE n.owner.id = :ownerId ORDER BY n.mintedAt DESC")
    List<TicketNftStub> findByOwnerId(@Param("ownerId") Long ownerId);

    Optional<TicketNftStub> findByTicketId(Long ticketId);

    Optional<TicketNftStub> findByTokenId(String tokenId);
}
