package com.cinechain.controller;

import com.cinechain.dto.dashboard.CustomerDashboardStats;
import com.cinechain.entity.User;
import com.cinechain.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CustomerDashboardController {

    private final DashboardService dashboardService;

    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/stats")
    public ResponseEntity<CustomerDashboardStats> getCustomerStats(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(dashboardService.getCustomerStats(currentUser.getId()));
    }
}
