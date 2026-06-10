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

@Component
public class DataInitializer implements CommandLineRunner {

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
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            return; // DB already contains records, bypass seeding
        }

        // Indian Daily Wage Workers & Variable Income Profiles
        String[][] workers = {
            // {username, email, fullName, profession, targetSavings}
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
        
        // Create all users
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
        if (user.getUsername().equals("demo")) {
            seedFreelancerData(user, today);
        } else if (user.getProfession().contains("Construction")) {
            seedConstructionWorkerData(user, today);
        } else if (user.getProfession().contains("Delivery")) {
            seedDeliveryDriverData(user, today);
        } else if (user.getProfession().contains("Auto")) {
            seedAutoRickshawData(user, today);
        } else if (user.getProfession().contains("Domestic")) {
            seedDomesticHelpData(user, today);
        } else if (user.getProfession().contains("Street")) {
            seedStreetVendorData(user, today);
        } else if (user.getProfession().contains("Tailor")) {
            seedTailorData(user, today);
        } else if (user.getProfession().contains("Laborer")) {
            seedLaborerData(user, today);
        } else if (user.getProfession().contains("Maid")) {
            seedMaidData(user, today);
        } else if (user.getProfession().contains("Painter")) {
            seedPainterData(user, today);
        } else if (user.getProfession().contains("Tutor")) {
            seedTutorData(user, today);
        } else if (user.getProfession().contains("Content")) {
            seedContentCreatorData(user, today);
        } else if (user.getProfession().contains("Quick Commerce")) {
            seedQuickCommerceData(user, today);
        } else if (user.getProfession().contains("Urban Company")) {
            seedUrbanCompanyData(user, today);
        }
    }

    // --- REUSABLE SEED GENERATOR HELPERS ---

    private void generateDailyExpenses(User user, LocalDate today, double monthlyRent, double dailyFood, double travelBase) {
        // Rent (6 monthly payments)
        for (int m = 5; m >= 0; m--) {
            LocalDate rentDate = today.minusMonths(m).withDayOfMonth(1);
            expenseService.addExpense(new ExpenseRequest(monthlyRent, "RENT", rentDate, "Monthly room/housing rent"), user);
        }

        // Daily food & travel & weekly utilities
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            // Food
            double foodCost = dailyFood + (Math.random() * dailyFood * 0.3);
            expenseService.addExpense(new ExpenseRequest(Math.round(foodCost * 100.0) / 100.0, "FOOD", date, "Daily food expenses"), user);

            // Travel (except Sundays)
            if (date.getDayOfWeek().getValue() != 7) {
                double travelCost = travelBase + (Math.random() * travelBase * 0.2);
                expenseService.addExpense(new ExpenseRequest(Math.round(travelCost * 100.0) / 100.0, "TRAVEL", date, "Daily travel/transit"), user);
            }

            // Weekly utilities
            if (i % 7 == 0) {
                double utilities = 120.0 + (Math.random() * 80.0);
                expenseService.addExpense(new ExpenseRequest(Math.round(utilities * 100.0) / 100.0, "BILLS", date, "Weekly phone/utilities"), user);
            }
        }
    }

    // --- PROFILE SPECIFIC SEED IMPLEMENTATIONS ---

    private void seedFreelancerData(User user, LocalDate today) {
        // Rent & food/utilities
        generateDailyExpenses(user, today, 3000.0, 150.0, 50.0);

        // Incomes: monthly retainer + gigs
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            // Retainer on 1st of every month
            if (date.getDayOfMonth() == 1) {
                incomeService.addIncome(new IncomeRequest(1500.0, "FREELANCE", "Retainer Client A", date, "Monthly website maintenance retainer"), user);
            }

            // Gigs every 25 days
            if (i % 25 == 0) {
                double amount = 3000.0 + (Math.random() * 1500.0);
                incomeService.addIncome(new IncomeRequest(Math.round(amount * 100.0) / 100.0, "GIG_WORK", "Upwork Gig", date, "UI design and consulting contract completion"), user);
            }
        }
    }

    private void seedConstructionWorkerData(User user, LocalDate today) {
        // Expenses
        generateDailyExpenses(user, today, 1500.0, 90.0, 20.0);

        // Daily wages (low in monsoon: July-Sept = days 45 to 135 ago)
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            if (date.getDayOfWeek().getValue() == 7) continue;

            boolean isMonsoon = (i >= 45 && i <= 135);
            double workProbability = isMonsoon ? 0.35 : 0.80; // work halts in rain
            
            if (Math.random() < workProbability) {
                double dailyWage = isMonsoon ? 350.0 : 500.0;
                double finalWage = dailyWage + (Math.random() * 50.0);
                incomeService.addIncome(new IncomeRequest(Math.round(finalWage * 100.0) / 100.0, "WAGE", "Site Daily Labor", date, "Daily construction site labor payout"), user);
            }
        }
    }

    private void seedDeliveryDriverData(User user, LocalDate today) {
        // Expenses (higher fuel costs)
        generateDailyExpenses(user, today, 2000.0, 100.0, 80.0);

        // Daily wages (high in monsoon: July-Sept = days 45 to 135 ago)
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            boolean isMonsoon = (i >= 45 && i <= 135);
            double dailyBase = isMonsoon ? 1100.0 : 750.0; // monsoon surge pricing & high order volumes
            double finalEarning = dailyBase + (Math.random() * 200.0);
            
            incomeService.addIncome(new IncomeRequest(Math.round(finalEarning * 100.0) / 100.0, "GIG", "Uber Delivery", date, "Daily delivery completions & surge bonuses"), user);
        }
    }

    private void seedAutoRickshawData(User user, LocalDate today) {
        // Expenses (higher travel/fuel cost)
        generateDailyExpenses(user, today, 1800.0, 100.0, 110.0);

        // Rickshaw daily fares (high in monsoon: July-Sept = days 45 to 135)
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            boolean isMonsoon = (i >= 45 && i <= 135);
            double dailyBase = isMonsoon ? 850.0 : 600.0; // high demand to avoid rain
            double finalFare = dailyBase + (Math.random() * 100.0);
            
            incomeService.addIncome(new IncomeRequest(Math.round(finalFare * 100.0) / 100.0, "AUTO", "Rickshaw Fare", date, "Rickshaw daily fares and local transport runs"), user);
        }
    }

    private void seedDomesticHelpData(User user, LocalDate today) {
        // Expenses
        generateDailyExpenses(user, today, 2000.0, 110.0, 20.0);

        // Fixed salary from 4 houses on 2nd of every month + Diwali bonus in October/November (120 days ago)
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            if (date.getDayOfMonth() == 2) {
                // Fixed wages
                incomeService.addIncome(new IncomeRequest(8000.0, "WAGE", "Domestic Salaries", date, "Monthly wages from 4 households"), user);
            }

            // Festival bonus (paid around 120 days ago)
            if (i == 120) {
                incomeService.addIncome(new IncomeRequest(6000.0, "BONUS", "Diwali Bonus", date, "Diwali festival bonus from employers"), user);
            }
        }
    }

    private void seedStreetVendorData(User user, LocalDate today) {
        // Expenses + Weekly grocery stall supplies
        generateDailyExpenses(user, today, 2000.0, 120.0, 30.0);
        
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            // Weekly stall supplies/ingredients expense
            if (i % 7 == 0) {
                expenseService.addExpense(new ExpenseRequest(1200.0, "SHOPPING", date, "Stall grocery & gas refills"), user);
            }

            // Daily sales (low in monsoon: July-Sept = days 45 to 135 ago)
            boolean isMonsoon = (i >= 45 && i <= 135);
            double dailySales = isMonsoon ? 350.0 : 800.0; // rain washes out street vendor locations
            double finalSales = dailySales + (Math.random() * 150.0);
            
            incomeService.addIncome(new IncomeRequest(Math.round(finalSales * 100.0) / 100.0, "BUSINESS", "Stall Sales", date, "Daily street food stand sales"), user);
        }
    }

    private void seedTailorData(User user, LocalDate today) {
        // Expenses
        generateDailyExpenses(user, today, 1500.0, 100.0, 25.0);

        // Tailor orders every 3 days. Peak during wedding season (days 45 to 135)
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            if (i % 3 == 0) {
                boolean isPeak = (i >= 45 && i <= 135); // Wedding and festival rush
                double orderAmount = isPeak ? 1500.0 : 500.0;
                double finalAmount = orderAmount + (Math.random() * 150.0);
                
                incomeService.addIncome(new IncomeRequest(Math.round(finalAmount * 100.0) / 100.0, "BUSINESS", "Tailor Order", date, "Completed garments sewing & alterations contracts"), user);
            }
        }
    }

    private void seedLaborerData(User user, LocalDate today) {
        // Expenses
        generateDailyExpenses(user, today, 1200.0, 85.0, 20.0);

        // Daily wages (low in monsoon: July-Sept = days 45 to 135 ago)
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            if (date.getDayOfWeek().getValue() == 7) continue;

            boolean isMonsoon = (i >= 45 && i <= 135);
            double workProbability = isMonsoon ? 0.30 : 0.75;
            
            if (Math.random() < workProbability) {
                double wage = isMonsoon ? 300.0 : 450.0;
                double finalWage = wage + (Math.random() * 30.0);
                incomeService.addIncome(new IncomeRequest(Math.round(finalWage * 100.0) / 100.0, "WAGE", "Daily Laborer", date, "Daily labor wage payout"), user);
            }
        }
    }

    private void seedMaidData(User user, LocalDate today) {
        // Expenses
        generateDailyExpenses(user, today, 1800.0, 100.0, 20.0);

        // Fixed salary from 3 houses on 3rd of every month + Diwali bonus
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            if (date.getDayOfMonth() == 3) {
                incomeService.addIncome(new IncomeRequest(7500.0, "WAGE", "Maid Salaries", date, "Monthly wages from 3 households"), user);
            }

            if (i == 120) {
                incomeService.addIncome(new IncomeRequest(5000.0, "BONUS", "Diwali Bonus", date, "Diwali festival bonus from employers"), user);
            }
        }
    }

    private void seedPainterData(User user, LocalDate today) {
        // Expenses
        generateDailyExpenses(user, today, 2000.0, 110.0, 40.0);

        // Painting contracts. Very high in pre-festivals (days 45 to 120 ago); Zero in monsoon (days 121 to 180 ago)
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            // Painting contracts every 20 days
            if (i % 20 == 0) {
                // If it is in July-August monsoon (let's say 121 to 180 days ago), painting is impossible.
                boolean isMonsoon = (i >= 121 && i <= 180);
                boolean isPeak = (i >= 45 && i <= 120); // festival house prep
                
                if (!isMonsoon) {
                    double contract = isPeak ? 10000.0 : 5000.0;
                    double finalContract = contract + (Math.random() * 1000.0);
                    incomeService.addIncome(new IncomeRequest(Math.round(finalContract * 100.0) / 100.0, "CONTRACT", "Painting Contract", date, "Completed residential apartment painting project"), user);
                    
                    // Material cost expense during painting contracts
                    expenseService.addExpense(new ExpenseRequest(isPeak ? 2500.0 : 1200.0, "SHOPPING", date, "Paint & materials purchase"), user);
                }
            }
        }
    }

    private void seedTutorData(User user, LocalDate today) {
        // Expenses (internet/utilities)
        generateDailyExpenses(user, today, 3000.0, 130.0, 30.0);

        // Fixed tuition income on 5th of every month. Crash course peak (days 0 to 120 ago). Summer dip (days 121 to 180 ago)
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            if (date.getDayOfMonth() == 5) {
                boolean isSummer = (i >= 121 && i <= 180); // Summer holidays (June-July)
                boolean isExamPeak = (i >= 0 && i <= 120);   // Exams coaching (Feb-May)
                
                double incomeAmount = isSummer ? 2000.0 : (isExamPeak ? 14000.0 : 10000.0);
                incomeService.addIncome(new IncomeRequest(incomeAmount, "FREELANCE", "Online Tuition Fees", date, "Monthly tuition fees from students"), user);
            }
        }
    }

    private void seedContentCreatorData(User user, LocalDate today) {
        // Expenses: Rent, food, travel
        generateDailyExpenses(user, today, 5000.0, 200.0, 80.0);

        // Hardware purchases (software subscriptions or editing gear)
        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            // Subscriptions once a month
            if (date.getDayOfMonth() == 10) {
                expenseService.addExpense(new ExpenseRequest(1500.0, "BILLS", date, "Adobe Suite & Cloud Storage Subscriptions"), user);
            }

            // Gear upgrades every 60 days
            if (i % 60 == 0) {
                expenseService.addExpense(new ExpenseRequest(4500.0, "SHOPPING", date, "Camera gear & editing accessories"), user);
            }

            // AdSense on 21st of every month
            if (date.getDayOfMonth() == 21) {
                double adSense = 12000.0 + (Math.random() * 8000.0 - 4000.0);
                incomeService.addIncome(new IncomeRequest(Math.round(adSense * 100.0) / 100.0, "FREELANCE", "Google AdSense Payout", date, "Monthly YouTube partner program earnings"), user);
            }

            // Brand Sponsor contracts every 45 days
            if (i % 45 == 0) {
                double sponsor = 15000.0 + (Math.random() * 10000.0 - 5000.0);
                incomeService.addIncome(new IncomeRequest(Math.round(sponsor * 100.0) / 100.0, "CONTRACT", "Sponsorship Deal", date, "Tech review channel sponsorship payout"), user);
            }
        }
    }

    private void seedQuickCommerceData(User user, LocalDate today) {
        // Expenses: low rent, low food, higher fuel
        generateDailyExpenses(user, today, 1500.0, 80.0, 120.0);

        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            // Bike servicing every 30 days
            if (i % 30 == 0) {
                expenseService.addExpense(new ExpenseRequest(1200.0, "TRAVEL", date, "Motorcycle servicing & oil change"), user);
            }

            // Weekly rider payouts (every Monday)
            if (date.getDayOfWeek().getValue() == 1) {
                boolean isMonsoon = (i >= 45 && i <= 135);
                double basePayout = isMonsoon ? 5500.0 : 4000.0; // higher surges during rains
                double finalPayout = basePayout + (Math.random() * 800.0);
                incomeService.addIncome(new IncomeRequest(Math.round(finalPayout * 100.0) / 100.0, "GIG", "Q-Commerce Payout", date, "Weekly quick commerce delivery fee & target incentives"), user);
            }
        }
    }

    private void seedUrbanCompanyData(User user, LocalDate today) {
        // Expenses
        generateDailyExpenses(user, today, 2500.0, 120.0, 60.0);

        for (int i = 180; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            // Plumbing materials restock
            if (i % 15 == 0) {
                expenseService.addExpense(new ExpenseRequest(1500.0, "SHOPPING", date, "Plumbing supplies & tool refills"), user);
            }

            // Batch payouts every 4 days
            if (i % 4 == 0) {
                boolean isPeakSeason = (i <= 90); // high summer leak calls
                double baseBatch = isPeakSeason ? 3500.0 : 2000.0;
                double finalBatch = baseBatch + (Math.random() * 500.0);
                incomeService.addIncome(new IncomeRequest(Math.round(finalBatch * 100.0) / 100.0, "BUSINESS", "UrbanCompany Payout", date, "Completed service bookings batch payout"), user);
            }
        }
    }
}
