package com.cinechain.service;

import com.cinechain.dto.ticket.TicketDto;
import com.cinechain.dto.ticket.ValidationRequest;
import com.cinechain.entity.Ticket;
import com.cinechain.entity.User;
import com.cinechain.enums.TicketStatus;
import com.cinechain.enums.TransactionType;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ValidationService {

    private final TicketRepository ticketRepository;
    private final BlockchainService blockchainService;

    @Transactional
    public TicketDto validateTicket(ValidationRequest request, User adminUser) {
        String qrData = request.getQrCodeData().trim();
        Ticket ticket = ticketRepository.findByQrCodeData(qrData)
                .orElseThrow(() -> new ResourceNotFoundException("No ticket found with the provided QR data"));

        if (ticket.getStatus() == TicketStatus.USED) {
            throw new IllegalArgumentException("Ticket has already been used and validated at " + ticket.getValidatedAt());
        }

        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new IllegalArgumentException("Ticket has been cancelled and cannot be used");
        }

        ticket.setStatus(TicketStatus.USED);
        ticket.setValidatedAt(LocalDateTime.now());
        ticket.setValidatedBy(adminUser);

        Ticket savedTicket = ticketRepository.save(ticket);

        blockchainService.recordTransaction(
                savedTicket.getId(),
                savedTicket.getBooking().getId(),
                TransactionType.TICKET_VALIDATED,
                String.format("{\"ticketId\":%d,\"validatedBy\":\"%s\",\"validatedAt\":\"%s\"}",
                        savedTicket.getId(), adminUser.getEmail(), savedTicket.getValidatedAt())
        );

        log.info("Ticket id={} successfully validated by admin={}", savedTicket.getId(), adminUser.getEmail());
        return TicketDto.from(savedTicket);
    }

    public List<TicketDto> getValidationHistory() {
        return ticketRepository.findRecentlyValidated().stream()
                .map(TicketDto::from)
                .toList();
    }
}
