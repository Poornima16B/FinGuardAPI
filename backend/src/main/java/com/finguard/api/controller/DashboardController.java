package com.finguard.api.controller;

import com.finguard.api.dto.DashboardSummary;
import com.finguard.api.entity.User;
import com.finguard.api.service.AuthService;
import com.finguard.api.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard & Reports Module", description = "Endpoint to retrieve aggregated, high-speed finance dashboards containing stats, charts, notifications, and transactions.")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthService authService;

    public DashboardController(DashboardService dashboardService, AuthService authService) {
        this.dashboardService = dashboardService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Get unified financial dashboard details", description = "Aggregates income/expense sums, category splits, latest transactions, stability scores, risk indices, and notification updates in a single API trip.")
    public ResponseEntity<DashboardSummary> getDashboardSummary(Principal principal) {
        User user = authService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(dashboardService.getDashboardSummary(user));
    }
}
