package com.finguard.api.service;

import com.finguard.api.dto.DashboardSummary;
import com.finguard.api.dto.StabilityResponse;
import com.finguard.api.entity.User;
import org.springframework.stereotype.Service;

@Service
public class AdvisorFallbackService {

    public String buildFallbackReply(User user, String message, DashboardSummary dashboard, StabilityResponse stability) {
        String textLower = message.toLowerCase();
        double fsi = dashboard.stabilityScore() != null ? dashboard.stabilityScore() : 0;
        double balance = dashboard.balance() != null ? dashboard.balance() : 0;
        double income = dashboard.totalIncome() != null ? dashboard.totalIncome() : 0;
        double expenses = dashboard.totalExpense() != null ? dashboard.totalExpense() : 0;
        String risk = dashboard.riskLevel() != null ? dashboard.riskLevel() : "MEDIUM";
        double savings = dashboard.savingsPotential() != null ? dashboard.savingsPotential() : 0;
        String runway = expenses > 0 ? String.format("%.1f", balance / expenses) : "99+";
        String profession = user.getProfession() != null ? user.getProfession() : "Freelancer";
        double targetSavings = user.getTargetSavings() != null ? user.getTargetSavings() : 5000.0;
        String name = user.getFullName() != null ? user.getFullName() : "User";

        if (containsAny(textLower, "saving", "save", "goal", "payout")) {
            return """
                    ### 💰 Tactical Savings Blueprint for %s
                    As a **%s**, FinGuard analyzed your profile:
                    * Balance: **₹%.0f** | Income: **₹%.0f** | Savings potential: **₹%.0f/mo**
                    * Target: **₹%.0f/mo**

                    **Action plan:**
                    1. Auto-sweep **15%%** of every payout into your Cushion Vault.
                    2. Build a **3-month runway** (target ₹%.0f). Current runway: **%s months**.
                    3. Trim discretionary spend by **10%%** to unlock **₹%.0f/mo** extra savings.
                    """.formatted(name, profession, balance, income, savings, targetSavings,
                    expenses * 3, runway, expenses * 0.1);
        }

        if (containsAny(textLower, "invest", "sip", "fd", "gold", "wealth", "stock")) {
            double sipMonthly = Math.max(500, Math.min(savings, 10000));
            return """
                    ### 📈 Investment Roadmap
                    Recommended SIP: **₹%.0f/month** (7.2%% CAGR projection)
                    * 1 year → **₹%.0f**
                    * 3 years → **₹%.0f**
                    * 5 years → **₹%.0f**

                    Start with emergency runway first, then large-cap index SIPs and RDs. Avoid high-risk trading with volatile gig income.
                    """.formatted(sipMonthly, sipMonthly * 12.46, sipMonthly * 40.1, sipMonthly * 72.6);
        }

        if (containsAny(textLower, "budget", "plan", "planning", "tactical")) {
            return """
                    ### 📅 Variable Budget Framework
                    For **%s** income of **₹%.0f/mo**:
                    * **50%% needs** → ₹%.0f
                    * **20%% cushion** → ₹%.0f
                    * **30%% goals/invest** → ₹%.0f

                    Set a weekly spend cap of **₹%.0f** and enable UPI limits in Profile.
                    """.formatted(profession, income, income * 0.5, income * 0.2, income * 0.3, expenses / 4.33);
        }

        if (containsAny(textLower, "score", "stability", "fsi", "volatility", "risk")) {
            return """
                    ### 🛡️ FSI Diagnostics
                    **Score:** %.1f/100 (**%s RISK**)
                    * Income: ₹%.0f | Expenses: ₹%.0f
                    * Burn rate: **%.0f%%**

                    %s
                    """.formatted(fsi, risk, income, expenses,
                    income > 0 ? (expenses / income) * 100 : 100,
                    stability.aiSuggestions() != null ? stability.aiSuggestions() : "Keep building reserves and reducing volatility.");
        }

        if (containsAny(textLower, "anomaly", "fraud", "alert", "outlier")) {
            long active = dashboard.fraudAlerts() != null
                    ? dashboard.fraudAlerts().stream().filter(a -> "ACTIVE".equalsIgnoreCase(a.status())).count()
                    : 0;
            return """
                    ### 🛡️ Anomaly Shield Status
                    Active alerts: **%d**
                    Status: **%s**

                    Review the Anomaly tab and resolve duplicate or outlier transactions quickly.
                    """.formatted(active, active > 0 ? "WARNING" : "SECURE");
        }

        if (containsAny(textLower, "hello", "hi", "hey", "help")) {
            return """
                    Hello! I'm FinGuard AI Advisor (local mode — add an API key for live LLM responses).

                    Ask about: savings, investments, budgets, FSI score, burn rate, or anomaly alerts.
                    """;
        }

        return """
                ### 🛡️ FinGuard Profile Summary
                **%s** (%s)
                * FSI: **%.1f/100** (%s)
                * Balance: **₹%.0f** | Runway: **%s months**
                * Savings potential: **₹%.0f/mo**

                Ask specific questions about saving, investing, budgeting, or risk analysis.
                """.formatted(name, profession, fsi, risk, balance, runway, savings);
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
