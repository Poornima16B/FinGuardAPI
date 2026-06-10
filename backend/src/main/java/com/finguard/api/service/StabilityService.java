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
                    "Welcome to FinGuard AI! Start logging your daily gig earnings and expenses. Once logged, our AI engine will construct a personalized Volatility Index and Stability Score for you.",
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
        sb.append(String.format("### FinGuard AI Advisor Report for %s (%s)\n", user.getFullName(), user.getProfession()));
        sb.append(String.format("* **Financial Stability Score (FSI):** %.1f/100\n", fsi));
        sb.append(String.format("* **Income Volatility Factor:** %.2f\n", volatility));
        sb.append(String.format("* **Expense Burn Rate:** %.1f%%\n\n", burnRate * 100));

        if (fsi < 45) {
            sb.append("⚠️ **CRITICAL WARNING:** Your financial stability index is in the warning tier due to high outflows or extreme income volatility. \n\n");
            sb.append("#### Action Items:\n");
            sb.append("1. **Trim Burn Rate:** Discretionary costs should be capped immediately. Focus on cooking at home and halting subscriptions.\n");
            sb.append("2. **Build Buffer Fund:** Since you work as a gig worker or freelancer, we advise maintaining an emergency deposit of at least 6 months of absolute basic expenses to cushion against dry spells.\n");
            sb.append("3. **Income Diversification:** Look into booking consistent monthly retainer contracts rather than purely transactional gig jobs.");
        } else if (fsi < 75) {
            sb.append("🛡️ **MODERATE STANDING:** Your cash flow is positive but vulnerable to sudden dry spells due to moderate spending and income swings.\n\n");
            sb.append("#### Action Items:\n");
            sb.append("1. **Establish Rules:** Try setting aside 15% of every paycheck as soon as it clears, before you commit to any spending.\n");
            sb.append("2. **Target Bills First:** Schedule automated rent and utilities sweeps during peak income weeks.\n");
            sb.append(String.format("3. **Focus on Target Savings:** You are currently saving positive funds. Let's aim to allocate Rs %.2f monthly to close the gap on your annual goal of Rs %.2f.",
                    savings, user.getTargetSavings()));
        } else {
            sb.append("💎 **EXCELLENT STABILITY:** Your financial system is healthy. Volatility is minimal, and you are maintaining excellent cash margins!\n\n");
            sb.append("#### Action Items:\n");
            sb.append("1. **Sweep and Invest:** Your passive reserves are excellent. Sweep 20% of your current balance into a high-yield instrument to make your money work actively.\n");
            sb.append(String.format("2. **Increase Targets:** Since you are comfortably on track to hit your savings goal (Rs %.2f), consider raising your threshold to build long-term capital assets.", user.getTargetSavings()));
        }

        return sb.toString();
    }
}
