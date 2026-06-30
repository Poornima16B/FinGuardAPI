package com.finguard.api.config;

import com.finguard.api.entity.Role;
import com.finguard.api.entity.User;
import com.finguard.api.dto.IncomeRequest;
import com.finguard.api.dto.ExpenseRequest;
import com.finguard.api.repository.UserRepository;
import com.finguard.api.service.IncomeService;
import com.finguard.api.service.ExpenseService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Random;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final int HISTORY_DAYS = 270;
    private static final int RENT_MONTHS = 9;
    private final Random random = new Random(42);

    private final UserRepository userRepository;
    private final IncomeService incomeService;
    private final ExpenseService expenseService;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           IncomeService incomeService,
                           ExpenseService expenseService,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.incomeService = incomeService;
        this.expenseService = expenseService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        String[][] workers = {
            {"demo", "demo@finguard.ai", "John Doe", "Freelance Designer & Gig Worker", "1500"},
            {"rajesh_k", "rajesh@finguard.ai", "Rajesh Kumar", "Construction Worker - Daily Wages", "5000"},
            {"priya_s", "priya@finguard.ai", "Priya Sharma", "Delivery Driver - Uber/Ola", "8000"},
            {"arun_m", "arun@finguard.ai", "Arun Murugan", "Auto Rickshaw Driver (Chennai)", "6000"},
            {"meena_r", "meena@finguard.ai", "Meena Raj", "Domestic Help - Multiple Houses", "4000"},
            {"vikram_p", "vikram@finguard.ai", "Vikram Patel", "Street Food Vendor (Telangana)", "7000"},
            {"fatima_k", "fatima@finguard.ai", "Fatima Khan", "Tailor - Home Based (Kanpur)", "3500"},
            {"suresh_g", "suresh@finguard.ai", "Suresh Gupta", "Daily Laborer - Construction", "4500"},
            {"anita_d", "anita@finguard.ai", "Anita Das", "Maid & Cooking - Multiple Clients", "5500"},
            {"ramesh_n", "ramesh@finguard.ai", "Ramesh Nair", "Painter - Contract Work", "6500"},
            {"divya_t", "divya@finguard.ai", "Divya Deva", "Online Tutor - Freelance", "7500"},
            {"kabir_v", "kabir@finguard.ai", "Kabir Verma", "Content Creator & Tech YouTuber", "9000"},
            {"rahul_d", "rahul@finguard.ai", "Rahul Das", "Quick Commerce Rider (Zepto/Blinkit)", "4000"},
            {"amit_p", "amit@finguard.ai", "Amit Patel", "Urban Company Plumber & Service Pro", "6000"}
        };

        LocalDate today = LocalDate.now();

        for (String[] worker : workers) {
            User user = new User();
            user.setUsername(worker[0]);
            user.setEmail(worker[1]);
            user.setPassword(passwordEncoder.encode("password123"));
            user.setFullName(worker[2]);
            user.setRole(Role.USER);
            user.setProfession(worker[3]);
            user.setTargetSavings(Double.parseDouble(worker[4]));

            User savedUser = userRepository.save(user);
            seedUserData(savedUser, today);
        }
    }

    private void seedUserData(User user, LocalDate today) {
        String username = user.getUsername();
        String profession = user.getProfession();

        if ("demo".equals(username)) {
            seedFreelancerData(user, today);
        } else if (profession.contains("Laborer")) {
            seedLaborerData(user, today);
        } else if (profession.contains("Construction")) {
            seedConstructionWorkerData(user, today);
        } else if (profession.contains("Quick Commerce")) {
            seedQuickCommerceData(user, today);
        } else if (profession.contains("Delivery")) {
            seedDeliveryDriverData(user, today);
        } else if (profession.contains("Auto")) {
            seedAutoRickshawData(user, today);
        } else if (profession.contains("Domestic")) {
            seedDomesticHelpData(user, today);
        } else if (profession.contains("Street")) {
            seedStreetVendorData(user, today);
        } else if (profession.contains("Tailor")) {
            seedTailorData(user, today);
        } else if (profession.contains("Maid")) {
            seedMaidData(user, today);
        } else if (profession.contains("Painter")) {
            seedPainterData(user, today);
        } else if (profession.contains("Tutor")) {
            seedTutorData(user, today);
        } else if (profession.contains("Content")) {
            seedContentCreatorData(user, today);
        } else if (profession.contains("Urban Company")) {
            seedUrbanCompanyData(user, today);
        }
    }

    private double jitter(double base, double variancePct) {
        return Math.round((base + (random.nextDouble() * base * variancePct)) * 100.0) / 100.0;
    }

    private void generateDailyExpenses(User user, LocalDate today, double monthlyRent, double dailyFood, double travelBase) {
        for (int m = RENT_MONTHS - 1; m >= 0; m--) {
            LocalDate rentDate = today.minusMonths(m).withDayOfMonth(1);
            expenseService.addExpense(new ExpenseRequest(monthlyRent, "RENT", rentDate, "Monthly room/housing rent"), user);
        }

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            expenseService.addExpense(
                    new ExpenseRequest(jitter(dailyFood, 0.3), "FOOD", date, "Daily food expenses"), user);

            if (date.getDayOfWeek().getValue() != 7) {
                expenseService.addExpense(
                        new ExpenseRequest(jitter(travelBase, 0.2), "TRAVEL", date, "Daily travel/transit"), user);
            }

            if (i % 7 == 0) {
                expenseService.addExpense(
                        new ExpenseRequest(jitter(120.0, 0.65), "BILLS", date, "Weekly phone/utilities"), user);
            }

            if (date.getDayOfMonth() == 8) {
                expenseService.addExpense(
                        new ExpenseRequest(jitter(599.0, 0.1), "BILLS", date, "Monthly broadband & mobile plan"), user);
            }

            if (i % 14 == 5) {
                expenseService.addExpense(
                        new ExpenseRequest(jitter(450.0, 0.5), "SHOPPING", date, "Household & personal supplies"), user);
            }

            if (date.getDayOfWeek().getValue() >= 6 && i % 9 == 0) {
                expenseService.addExpense(
                        new ExpenseRequest(jitter(280.0, 0.4), "OTHER", date, "Weekend leisure & dining out"), user);
            }

            if (date.getDayOfMonth() == 20 && i % 60 == 0) {
                expenseService.addExpense(
                        new ExpenseRequest(jitter(650.0, 0.25), "OTHER", date, "Medical checkup & pharmacy"), user);
            }
        }
    }

    private void seedFreelancerData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 3000.0, 150.0, 50.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            if (date.getDayOfMonth() == 1) {
                incomeService.addIncome(new IncomeRequest(1500.0, "FREELANCE", "Retainer Client A", date,
                        "Monthly website maintenance retainer"), user);
                incomeService.addIncome(new IncomeRequest(jitter(800.0, 0.2), "BUSINESS", "Invoice - Client B", date,
                        "Monthly consulting invoice"), user);
            }

            if (date.getDayOfMonth() == 15) {
                incomeService.addIncome(new IncomeRequest(jitter(2200.0, 0.3), "FREELANCE", "Fiverr Payout", date,
                        "Mid-month freelance project milestone"), user);
            }

            if (i % 12 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(3200.0, 0.35), "GIG_WORK", "Upwork Gig", date,
                        "UI design and consulting contract completion"), user);
            }

            if (i % 20 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(1800.0, 0.25), "GIG_WORK", "Client X", date,
                        "Logo & branding package delivery"), user);
            }

            if (date.getDayOfMonth() == 5) {
                expenseService.addExpense(new ExpenseRequest(jitter(185.0, 0.15), "BILLS", date,
                        "AWS Hosting, Figma & SaaS tools"), user);
            }

            if (i == 45) {
                expenseService.addExpense(new ExpenseRequest(1650.0, "SHOPPING", date,
                        "Apple MacBook Air - work laptop upgrade"), user);
            }

            if (i == 90) {
                expenseService.addExpense(new ExpenseRequest(4200.0, "SHOPPING", date,
                        "Monitor, desk chair & home office setup"), user);
            }
        }
    }

    private void seedConstructionWorkerData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 1500.0, 90.0, 20.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            if (date.getDayOfWeek().getValue() == 7) continue;

            boolean isMonsoon = (i >= 60 && i <= 150);
            double workProbability = isMonsoon ? 0.35 : 0.82;

            if (random.nextDouble() < workProbability) {
                double dailyWage = isMonsoon ? 350.0 : 500.0;
                incomeService.addIncome(new IncomeRequest(jitter(dailyWage, 0.1), "WAGE", "Site Daily Labor", date,
                        "Daily construction site labor payout"), user);
            }

            if (date.getDayOfWeek().getValue() == 6 && i % 14 == 0 && !isMonsoon) {
                incomeService.addIncome(new IncomeRequest(jitter(750.0, 0.15), "WAGE", "Overtime Shift", date,
                        "Saturday overtime site work"), user);
            }

            if (i % 45 == 0) {
                expenseService.addExpense(new ExpenseRequest(jitter(850.0, 0.2), "SHOPPING", date,
                        "Safety boots, gloves & work tools"), user);
            }
        }
    }

    private void seedDeliveryDriverData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 2000.0, 100.0, 80.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            boolean isMonsoon = (i >= 60 && i <= 150);
            double dailyBase = isMonsoon ? 1100.0 : 750.0;

            incomeService.addIncome(new IncomeRequest(jitter(dailyBase, 0.25), "GIG_WORK", "Uber Delivery", date,
                    "Daily delivery completions & surge bonuses"), user);

            if (i % 10 == 0) {
                expenseService.addExpense(new ExpenseRequest(jitter(1200.0, 0.15), "TRAVEL", date,
                        "Fuel refill & bike maintenance"), user);
            }

            if (date.getDayOfWeek().getValue() == 1) {
                incomeService.addIncome(new IncomeRequest(jitter(450.0, 0.3), "GIG_WORK", "Weekly Bonus", date,
                        "Weekly delivery target incentive"), user);
            }
        }
    }

    private void seedAutoRickshawData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 1800.0, 100.0, 110.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            boolean isMonsoon = (i >= 60 && i <= 150);
            double dailyBase = isMonsoon ? 850.0 : 600.0;

            incomeService.addIncome(new IncomeRequest(jitter(dailyBase, 0.18), "BUSINESS", "Rickshaw Fare", date,
                    "Rickshaw daily fares and local transport runs"), user);

            if (i % 12 == 0) {
                expenseService.addExpense(new ExpenseRequest(jitter(900.0, 0.2), "TRAVEL", date,
                        "CNG refill & auto servicing"), user);
            }

            if (date.getDayOfMonth() == 1) {
                incomeService.addIncome(new IncomeRequest(jitter(1200.0, 0.2), "BUSINESS", "Airport Runs", date,
                        "Monthly airport pickup contract bonus"), user);
            }
        }
    }

    private void seedDomesticHelpData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 2000.0, 110.0, 20.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            if (date.getDayOfMonth() == 2) {
                incomeService.addIncome(new IncomeRequest(8000.0, "WAGE", "Domestic Salaries", date,
                        "Monthly wages from 4 households"), user);
            }

            if (date.getDayOfMonth() == 18) {
                incomeService.addIncome(new IncomeRequest(jitter(1200.0, 0.15), "WAGE", "Extra Cleaning", date,
                        "Deep-cleaning & festival prep jobs"), user);
            }

            if (i == 120 || i == 240) {
                incomeService.addIncome(new IncomeRequest(jitter(6000.0, 0.1), "WAGE", "Festival Bonus", date,
                        "Festival bonus from employers"), user);
            }
        }
    }

    private void seedStreetVendorData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 2000.0, 120.0, 30.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            if (i % 7 == 0) {
                expenseService.addExpense(new ExpenseRequest(jitter(1200.0, 0.15), "SHOPPING", date,
                        "Stall grocery & gas refills"), user);
            }

            boolean isMonsoon = (i >= 60 && i <= 150);
            double dailySales = isMonsoon ? 350.0 : 800.0;
            incomeService.addIncome(new IncomeRequest(jitter(dailySales, 0.2), "BUSINESS", "Stall Sales", date,
                    "Daily street food stand sales"), user);

            if (date.getDayOfWeek().getValue() == 6 && !isMonsoon) {
                incomeService.addIncome(new IncomeRequest(jitter(450.0, 0.25), "BUSINESS", "Market Fair", date,
                        "Weekend market fair extra sales"), user);
            }
        }
    }

    private void seedTailorData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 1500.0, 100.0, 25.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            if (i % 3 == 0) {
                boolean isPeak = (i >= 45 && i <= 135);
                double orderAmount = isPeak ? 1500.0 : 500.0;
                incomeService.addIncome(new IncomeRequest(jitter(orderAmount, 0.2), "BUSINESS", "Tailor Order", date,
                        "Completed garments sewing & alterations contracts"), user);
            }

            if (i % 20 == 0) {
                expenseService.addExpense(new ExpenseRequest(jitter(600.0, 0.2), "SHOPPING", date,
                        "Fabric, thread & sewing supplies"), user);
            }

            if (date.getDayOfMonth() == 10) {
                incomeService.addIncome(new IncomeRequest(jitter(2500.0, 0.2), "BUSINESS", "Bulk Order", date,
                        "Bulk stitching order from local boutique"), user);
            }
        }
    }

    private void seedLaborerData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 1200.0, 85.0, 20.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            if (date.getDayOfWeek().getValue() == 7) continue;

            boolean isMonsoon = (i >= 60 && i <= 150);
            double workProbability = isMonsoon ? 0.30 : 0.78;

            if (random.nextDouble() < workProbability) {
                double wage = isMonsoon ? 300.0 : 450.0;
                incomeService.addIncome(new IncomeRequest(jitter(wage, 0.08), "WAGE", "Daily Laborer", date,
                        "Daily labor wage payout"), user);
            }

            if (i % 30 == 0) {
                expenseService.addExpense(new ExpenseRequest(jitter(400.0, 0.2), "SHOPPING", date,
                        "Work clothes & basic tools"), user);
            }
        }
    }

    private void seedMaidData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 1800.0, 100.0, 20.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            if (date.getDayOfMonth() == 3) {
                incomeService.addIncome(new IncomeRequest(7500.0, "WAGE", "Maid Salaries", date,
                        "Monthly wages from 3 households"), user);
            }

            if (date.getDayOfMonth() == 20) {
                incomeService.addIncome(new IncomeRequest(jitter(900.0, 0.15), "WAGE", "Cooking Service", date,
                        "Extra cooking & party catering"), user);
            }

            if (i == 120 || i == 240) {
                incomeService.addIncome(new IncomeRequest(jitter(5000.0, 0.1), "WAGE", "Festival Bonus", date,
                        "Festival bonus from employers"), user);
            }
        }
    }

    private void seedPainterData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 2000.0, 110.0, 40.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            if (i % 20 == 0) {
                boolean isMonsoon = (i >= 150 && i <= 210);
                boolean isPeak = (i >= 45 && i <= 120);

                if (!isMonsoon) {
                    double contract = isPeak ? 10000.0 : 5000.0;
                    incomeService.addIncome(new IncomeRequest(jitter(contract, 0.12), "FREELANCE", "Painting Contract", date,
                            "Completed residential apartment painting project"), user);
                    expenseService.addExpense(new ExpenseRequest(isPeak ? 2500.0 : 1200.0, "SHOPPING", date,
                            "Paint & materials purchase"), user);
                }
            }

            if (i % 35 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(2200.0, 0.2), "FREELANCE", "Touch-up Job", date,
                        "Small touch-up & waterproofing work"), user);
            }
        }
    }

    private void seedTutorData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 3000.0, 130.0, 30.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            if (date.getDayOfMonth() == 5) {
                boolean isSummer = (i >= 150 && i <= 210);
                boolean isExamPeak = (i <= 120);
                double incomeAmount = isSummer ? 2000.0 : (isExamPeak ? 14000.0 : 10000.0);
                incomeService.addIncome(new IncomeRequest(incomeAmount, "FREELANCE", "Online Tuition Fees", date,
                        "Monthly tuition fees from students"), user);
            }

            if (i % 15 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(1500.0, 0.25), "FREELANCE", "Crash Course", date,
                        "Exam crash course batch fees"), user);
            }

            if (date.getDayOfMonth() == 12) {
                expenseService.addExpense(new ExpenseRequest(jitter(350.0, 0.2), "SHOPPING", date,
                        "Study materials & reference books"), user);
            }
        }
    }

    private void seedContentCreatorData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 5000.0, 200.0, 80.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            if (date.getDayOfMonth() == 10) {
                expenseService.addExpense(new ExpenseRequest(1500.0, "BILLS", date,
                        "Adobe Suite & cloud storage subscriptions"), user);
            }

            if (i % 60 == 0) {
                expenseService.addExpense(new ExpenseRequest(jitter(4500.0, 0.15), "SHOPPING", date,
                        "Camera gear & editing accessories"), user);
            }

            if (date.getDayOfMonth() == 21) {
                incomeService.addIncome(new IncomeRequest(jitter(12000.0, 0.35), "FREELANCE", "Google AdSense Payout", date,
                        "Monthly YouTube partner program earnings"), user);
            }

            if (i % 45 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(15000.0, 0.35), "FREELANCE", "Sponsorship Deal", date,
                        "Tech review channel sponsorship payout"), user);
            }

            if (i % 30 == 0) {
                incomeService.addIncome(new IncomeRequest(jitter(3500.0, 0.3), "GIG_WORK", "Affiliate Commission", date,
                        "Amazon & brand affiliate earnings"), user);
            }
        }
    }

    private void seedQuickCommerceData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 1500.0, 80.0, 120.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            if (i % 30 == 0) {
                expenseService.addExpense(new ExpenseRequest(jitter(1200.0, 0.1), "TRAVEL", date,
                        "Motorcycle servicing & oil change"), user);
            }

            if (date.getDayOfWeek().getValue() == 1) {
                boolean isMonsoon = (i >= 60 && i <= 150);
                double basePayout = isMonsoon ? 5500.0 : 4000.0;
                incomeService.addIncome(new IncomeRequest(jitter(basePayout, 0.2), "GIG_WORK", "Q-Commerce Payout", date,
                        "Weekly quick commerce delivery fee & target incentives"), user);
            }

            if (date.getDayOfWeek().getValue() == 5) {
                incomeService.addIncome(new IncomeRequest(jitter(650.0, 0.25), "GIG_WORK", "Peak Hour Bonus", date,
                        "Friday evening peak delivery bonus"), user);
            }
        }
    }

    private void seedUrbanCompanyData(User user, LocalDate today) {
        generateDailyExpenses(user, today, 2500.0, 120.0, 60.0);

        for (int i = HISTORY_DAYS; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            if (i % 15 == 0) {
                expenseService.addExpense(new ExpenseRequest(jitter(1500.0, 0.15), "SHOPPING", date,
                        "Plumbing supplies & tool refills"), user);
            }

            if (i % 4 == 0) {
                boolean isPeakSeason = (i <= 120);
                double baseBatch = isPeakSeason ? 3500.0 : 2000.0;
                incomeService.addIncome(new IncomeRequest(jitter(baseBatch, 0.15), "BUSINESS", "UrbanCompany Payout", date,
                        "Completed service bookings batch payout"), user);
            }

            if (date.getDayOfMonth() == 25) {
                incomeService.addIncome(new IncomeRequest(jitter(2800.0, 0.2), "BUSINESS", "Emergency Call-out", date,
                        "Emergency plumbing & leak repair jobs"), user);
            }
        }
    }
}
