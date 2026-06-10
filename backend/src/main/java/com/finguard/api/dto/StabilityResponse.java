package com.finguard.api.dto;

import java.time.LocalDateTime;

public record StabilityResponse(
        Double score,
        Double savingsPotential,
        String riskLevel,
        String aiSuggestions,
        LocalDateTime calculatedAt,
        Double totalIncome,
        Double totalExpense,
        Double volatilityIndex
) {}
