package com.finguard.api.service;

import com.finguard.api.dto.ExpenseRequest;
import com.finguard.api.entity.Expense;
import com.finguard.api.entity.Transaction;
import com.finguard.api.entity.User;
import com.finguard.api.exception.ResourceNotFoundException;
import com.finguard.api.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final TransactionService transactionService;
    private final FraudDetectionService fraudDetectionService;
    private final StabilityService stabilityService;

    public ExpenseService(ExpenseRepository expenseRepository,
                          TransactionService transactionService,
                          FraudDetectionService fraudDetectionService,
                          StabilityService stabilityService) {
        this.expenseRepository = expenseRepository;
        this.transactionService = transactionService;
        this.fraudDetectionService = fraudDetectionService;
        this.stabilityService = stabilityService;
    }

    @Transactional
    public Expense addExpense(ExpenseRequest request, User user) {
        Expense expense = new Expense();
        expense.setUser(user);
        expense.setAmount(request.amount());
        expense.setCategory(request.category());
        expense.setDate(request.date());
        expense.setDescription(request.description());
        expense.setAccountName(request.accountName());
        expense.setAccountType(request.accountType());
        expense.setUpiId(request.upiId());

        Expense savedExpense = expenseRepository.save(expense);

        // Sync to unified Transaction ledger
        Transaction transaction = transactionService.logTransaction(
                user,
                "EXPENSE",
                savedExpense.getAmount(),
                savedExpense.getCategory(),
                savedExpense.getDate(),
                savedExpense.getDescription(),
                savedExpense.getAccountName(),
                savedExpense.getAccountType(),
                savedExpense.getUpiId(),
                savedExpense.getId()
        );

        // Trigger real-time AI Fraud & Anomaly Analysis
        fraudDetectionService.analyzeTransaction(transaction);

        // Recalculate stability index
        stabilityService.calculateStability(user);

        return savedExpense;
    }

    @Transactional
    public Expense updateExpense(Long id, ExpenseRequest request, User user) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense record not found"));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Expense record not found");
        }

        expense.setAmount(request.amount());
        expense.setCategory(request.category());
        expense.setDate(request.date());
        expense.setDescription(request.description());
        expense.setAccountName(request.accountName());
        expense.setAccountType(request.accountType());
        expense.setUpiId(request.upiId());

        Expense updatedExpense = expenseRepository.save(expense);

        // Sync to Transaction ledger
        transactionService.updateTransaction(
                updatedExpense.getId(),
                "EXPENSE",
                updatedExpense.getAmount(),
                updatedExpense.getCategory(),
                updatedExpense.getDate(),
                updatedExpense.getDescription(),
                updatedExpense.getAccountName(),
                updatedExpense.getAccountType(),
                updatedExpense.getUpiId()
        );

        // Recalculate stability
        stabilityService.calculateStability(user);

        return updatedExpense;
    }

    @Transactional
    public void deleteExpense(Long id, User user) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense record not found"));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Expense record not found");
        }

        expenseRepository.delete(expense);

        // Remove from ledger
        transactionService.deleteTransaction(id, "EXPENSE");

        // Recalculate stability
        stabilityService.calculateStability(user);
    }

    public List<Expense> getUserExpenses(User user) {
        return expenseRepository.findByUserOrderByDateDesc(user);
    }
}
