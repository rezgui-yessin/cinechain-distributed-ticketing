package com.cinechain.service;

import com.cinechain.dto.concession.ConcessionItemDto;
import com.cinechain.dto.concession.ConcessionOrderDto;
import com.cinechain.dto.concession.ConcessionOrderRequest;
import com.cinechain.dto.websocket.NotificationPayload;
import com.cinechain.entity.*;
import com.cinechain.enums.ConcessionOrderStatus;
import com.cinechain.exception.BadRequestException;
import com.cinechain.exception.ResourceNotFoundException;
import com.cinechain.repository.ConcessionItemRepository;
import com.cinechain.repository.ConcessionOrderRepository;
import com.cinechain.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConcessionService {

    private final ConcessionItemRepository itemRepository;
    private final ConcessionOrderRepository orderRepository;
    private final TicketRepository ticketRepository;
    private final WebSocketPublisher webSocketPublisher;
    private static final SecureRandom RANDOM = new SecureRandom();

    public List<ConcessionItemDto> getMenu() {
        return itemRepository.findByAvailableTrueOrderByCategoryAscNameAsc().stream()
                .map(ConcessionItemDto::from)
                .toList();
    }

    @Transactional
    public ConcessionOrderDto createOrder(ConcessionOrderRequest request, User user) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Order must have at least one item");
        }

        // Fetch items
        List<Long> itemIds = request.getItems().stream()
                .map(ConcessionOrderRequest.ItemRequest::getItemId)
                .toList();
        Map<Long, ConcessionItem> itemMap = itemRepository.findAllById(itemIds).stream()
                .collect(Collectors.toMap(ConcessionItem::getId, Function.identity()));

        String hallName = request.getHallName();
        String seatLabel = request.getSeatLabel();
        Long screeningId = request.getScreeningId();

        // If ticketId is provided, extract hall and seat details
        if (request.getTicketId() != null) {
            Ticket ticket = ticketRepository.findById(request.getTicketId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + request.getTicketId()));
            if (ticket.getSeat() != null) {
                seatLabel = "Row " + ticket.getSeat().getRowLabel() + ", Seat " + ticket.getSeat().getSeatNumber();
                if (ticket.getSeat().getHall() != null) {
                    hallName = ticket.getSeat().getHall().getName();
                }
            }
            if (ticket.getBooking() != null && ticket.getBooking().getScreening() != null) {
                screeningId = ticket.getBooking().getScreening().getId();
            }
        }

        String orderNumber = "SNK-" + String.format("%04X", RANDOM.nextInt(0xFFFF + 1)) + "-" + (System.currentTimeMillis() % 1000);

        ConcessionOrder order = ConcessionOrder.builder()
                .orderNumber(orderNumber)
                .user(user)
                .customerName(user.getFirstName() + " " + user.getLastName())
                .ticketId(request.getTicketId())
                .screeningId(screeningId)
                .hallName(hallName != null ? hallName : "Cinema Concession Lounge")
                .seatLabel(seatLabel != null ? seatLabel : "Pick-up Counter")
                .deliveryType(request.getDeliveryType())
                .status(ConcessionOrderStatus.PENDING)
                .notes(request.getNotes())
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<ConcessionOrderItem> orderItems = new ArrayList<>();

        for (ConcessionOrderRequest.ItemRequest ir : request.getItems()) {
            ConcessionItem ci = itemMap.get(ir.getItemId());
            if (ci == null) {
                throw new BadRequestException("Concession item not found: " + ir.getItemId());
            }
            if (!ci.isAvailable()) {
                throw new BadRequestException("Item currently unavailable: " + ci.getName());
            }
            int qty = Math.max(1, ir.getQuantity());
            BigDecimal itemSubtotal = ci.getPrice().multiply(BigDecimal.valueOf(qty));
            total = total.add(itemSubtotal);

            ConcessionOrderItem oi = ConcessionOrderItem.builder()
                    .order(order)
                    .item(ci)
                    .itemName(ci.getName())
                    .quantity(qty)
                    .unitPrice(ci.getPrice())
                    .subtotal(itemSubtotal)
                    .options(ir.getOptions())
                    .build();
            orderItems.add(oi);
        }

        order.setItems(orderItems);
        order.setTotalAmount(total);

        ConcessionOrder saved = orderRepository.save(order);
        log.info("Created Concession Order #{} for {} (Seat: {}, Amount: €{})",
                saved.getOrderNumber(), saved.getCustomerName(), saved.getSeatLabel(), saved.getTotalAmount());

        ConcessionOrderDto dto = ConcessionOrderDto.from(saved);

        // Push real-time event to kitchen staff
        webSocketPublisher.publishConcessionOrderCreated(dto);

        // Push confirmation to user notification queue
        webSocketPublisher.notifyCustomer(user.getId(), NotificationPayload.builder()
                .title("Snack Order Confirmed 🍿")
                .body("Your order " + saved.getOrderNumber() + " for " + saved.getSeatLabel() + " is being prepared.")
                .level(NotificationPayload.Level.INFO)
                .actionUrl("/customer/concessions")
                .referenceId(saved.getId())
                .build());

        return dto;
    }

    @Transactional
    public ConcessionOrderDto updateOrderStatus(Long orderId, ConcessionOrderStatus newStatus, User staffUser) {
        ConcessionOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Concession order not found: " + orderId));

        order.setStatus(newStatus);
        if (newStatus == ConcessionOrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        ConcessionOrder saved = orderRepository.save(order);
        log.info("Concession Order #{} updated to status {} by staff {}", saved.getOrderNumber(), newStatus, staffUser.getEmail());

        ConcessionOrderDto dto = ConcessionOrderDto.from(saved);

        // Broadcast to KDS
        webSocketPublisher.publishConcessionOrderUpdated(dto);

        // Notify customer
        String title = newStatus == ConcessionOrderStatus.DELIVERED ? "Snacks Delivered! 🎉" : "Order Update: " + newStatus;
        String message = newStatus == ConcessionOrderStatus.DELIVERED
                ? "Your order " + saved.getOrderNumber() + " has arrived at " + saved.getSeatLabel() + ". Enjoy your movie!"
                : "Your order " + saved.getOrderNumber() + " is now " + newStatus + ".";

        webSocketPublisher.notifyCustomer(order.getUser().getId(), NotificationPayload.builder()
                .title(title)
                .body(message)
                .level(NotificationPayload.Level.SUCCESS)
                .actionUrl("/customer/concessions")
                .referenceId(saved.getId())
                .build());

        return dto;
    }

    public List<ConcessionOrderDto> getMyOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(ConcessionOrderDto::from)
                .toList();
    }

    public Page<ConcessionOrderDto> getAllOrders(Pageable pageable) {
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(ConcessionOrderDto::from);
    }
}
