package com.finguard.api.service;

import com.finguard.api.dto.StabilityResponse;
import com.finguard.api.entity.Income;
import com.finguard.api.entity.Expense;
import com.finguard.api.entity.StabilityScore;
import com.finguard.api.entity.User;
import com.finguard.api.repository.IncomeRepository;
import com.finguard.api.repository.ExpenseRepository;
import com.finguard.api.repository.StabilityScoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StabilityService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final StabilityScoreRepository stabilityScoreRepository;
    private final NotificationService notificationService;

    public StabilityService(IncomeRepository incomeRepository,
                            ExpenseRepository expenseRepository,
                            StabilityScoreRepository stabilityScoreRepository,
                            NotificationService notificationService) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.stabilityScoreRepository = stabilityScoreRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public StabilityResponse calculateStability(User user) {
        List<Income> incomes = incomeRepository.findByUser(user);
        List<Expense> expenses = expenseRepository.findByUser(user);

        double totalIncome = incomes.stream().mapToDouble(Income::getAmount).sum();
        double totalExpense = expenses.stream().mapToDouble(Expense::getAmount).sum();

        // Standard Default state if no transactions exist yet
        if (incomes.isEmpty()) {
            return new StabilityResponse(
                    70.0,
                    0.0,
                    "LOW",
                    "Welcome! Start adding your income and expenses. We will show you a simple money health score and easy tips for you.",
                    LocalDateTime.now(),
                    0.0,
                    0.0,
                    0.0
            );
        }

        // 1. Calculate Average Monthly Income
        double avgIncome = totalIncome / Math.max(1, incomes.size());
        double avgExpense = totalExpense / Math.max(1, expenses.size());

        // 2. Calculate Standard Deviation of Income (Volatility measure)
        double variance = 0.0;
        for (Income inc : incomes) {
            variance += Math.pow(inc.getAmount() - avgIncome, 2);
        }
        double stdDevIncome = Math.sqrt(variance / Math.max(1, incomes.size()));

        // Volatility Index = Coefficient of Variation (CV)
        double volatilityIndex = avgIncome > 0 ? (stdDevIncome / avgIncome) : 0.0;

        // 3. Burn Rate (ratio of average outflows to inflows)
        double burnRate = avgIncome > 0 ? (avgExpense / avgIncome) : 1.0;

        // 4. Mathematical Stability Indexing
        // FSI = 100 * (1 - (0.45 * BurnRate) - (0.3 * VolatilityIndex))
        double rawScore = 100.0 * (1.0 - (0.45 * burnRate) - (0.35 * Math.min(1.0, volatilityIndex)));

        // Adjustments based on overall standing
        double fsiScore = Math.max(5.0, Math.min(98.0, rawScore));
        double currentBalance = totalIncome - totalExpense;

        if (currentBalance < 0) {
            fsiScore = Math.min(30.0, fsiScore); // Severely capped score if account is in negative standing
        }

        // 5. savings potential & Risk Level
        double savingsPotential = Math.max(0.0, avgIncome - avgExpense);
        String riskLevel = "LOW";
        if (fsiScore < 45) {
            riskLevel = "HIGH";
        } else if (fsiScore < 75) {
            riskLevel = "MEDIUM";
        }

        // Check if risk is high and trigger notification
        if ("HIGH".equalsIgnoreCase(riskLevel)) {
            notificationService.createNotification(
                    user,
                    "Financial Stability Warning",
                    String.format("AI detected a high risk level (Stability Index: %.1f). Your burn rate is high (%.1f%%). Consider capping shopping and discretionary expenses.", fsiScore, burnRate * 100),
                    "OVERSPENDING"
            );
        }

        // 6. AI Suggestions Builder
        String aiSuggestions = buildAiSuggestions(user, fsiScore, burnRate, volatilityIndex, savingsPotential, currentBalance);

        // 7. Persist Stability Record
        StabilityScore scoreRecord = new StabilityScore();
        scoreRecord.setUser(user);
        scoreRecord.setScore(fsiScore);
        scoreRecord.setSavingsPotential(savingsPotential);
        scoreRecord.setRiskLevel(riskLevel);
        scoreRecord.setAiSuggestions(aiSuggestions);
        stabilityScoreRepository.save(scoreRecord);

        return new StabilityResponse(
                fsiScore,
                savingsPotential,
                riskLevel,
                aiSuggestions,
                scoreRecord.getCalculatedAt(),
                totalIncome,
                totalExpense,
                volatilityIndex
        );
    }

    private String buildAiSuggestions(User user, double fsi, double burnRate, double volatility, double savings, double balance) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("### Money health report for %s (%s)\n", user.getFullName(), user.getProfession()));
        sb.append(String.format("* **Your score:** %.1f out of 100 (higher is better)\n", fsi));
        sb.append(String.format("* **Income ups and downs:** %.0f%% (how much your earnings change)\n", volatility * 100));
        sb.append(String.format("* **Spending vs income:** %.1f%% of income goes to expenses\n\n", burnRate * 100));

        if (fsi < 45) {
            sb.append("⚠️ **NEEDS ATTENTION:** You are spending a lot or your income changes too much. Please slow down non-essential spending.\n\n");
            sb.append("#### What to do now:\n");
            sb.append("1. **Cut extra spending** — cook at home, pause unused subscriptions, avoid big purchases this month.\n");
            sb.append("2. **Build a safety fund** — try to save at least **6 months of basic expenses** for slow work periods.\n");
            sb.append("3. **Steady income** — look for monthly retainers or repeat clients, not only one-time gigs.");
        } else if (fsi < 75) {
            sb.append("🛡️ **OK BUT BE CAREFUL:** You are managing, but one bad month could hurt. Save a little more when income is good.\n\n");
            sb.append("#### What to do now:\n");
            sb.append("1. **Save first** — put aside **15%%** of every payment before you spend.\n");
            sb.append("2. **Pay fixed bills early** — rent and utilities in the week you get paid.\n");
            sb.append(String.format("3. **Hit your goal** — try to save **Rs %.0f per month** toward your target of **Rs %.0f**.",
                    savings, user.getTargetSavings()));
        } else {
            sb.append("💎 **GOOD NEWS:** Your money situation looks healthy. You are saving well and keeping good control.\n\n");
            sb.append("#### What to do now:\n");
            sb.append("1. **Keep saving** — move extra money to RD or safe investments.\n");
            sb.append(String.format("2. **Raise your goal** — you are close to **Rs %.0f/month** savings target; consider a higher long-term goal.", user.getTargetSavings()));
        }

        return sb.toString();
    }
}
