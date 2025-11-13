import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const BudgetDataContext = createContext(null);

export function BudgetDataProvider({ children }) {
  const [budgets, setBudgets] = useState([
    {
      id: 1,
      categoryId: 1,
      categoryName: "Ăn uống",
      categoryType: "expense", // expense or income
      limitAmount: 3000000,
      createdAt: "2025-11-01T09:00:00Z",
      walletId: null,
      walletName: "Ví tiền mặt",
      month: "11/2025", // track which month the budget is for
    },
    {
      id: 2,
      categoryId: 3,
      categoryName: "Mua sắm",
      categoryType: "expense",
      limitAmount: 2000000,
      createdAt: "2025-11-02T08:30:00Z",
      walletId: null,
      walletName: "Techcombank",
      month: "11/2025",
    },
  ]);

  // Calculate spent amount for category+wallet combinations
  // Key format: "categoryName:walletName" or "categoryName:all" for budgets applying to all wallets
  const [transactionsByCategory, setTransactionsByCategory] = useState({
    // example: { "Ăn uống:Tiền mặt": 1200000, "Ăn uống:all": 1500000, "Mua sắm:Techcombank": 800000 }
  });

  // ====== helpers ======
  const createBudget = useCallback((payload) => {
    // payload: { categoryId, categoryName, categoryType, limitAmount, walletId, walletName }
    const currentMonth = new Date().toLocaleDateString("vi-VN", {
      month: "2-digit",
      year: "numeric",
    });
    const newBudget = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      month: currentMonth,
      // include wallet fields if provided
      walletId: payload.walletId || null,
      walletName: payload.walletName || null,
      ...payload,
    };
    setBudgets((prev) => [newBudget, ...prev]);
    return newBudget;
  }, []);

  const updateBudget = useCallback((budgetId, patch) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, ...patch } : b))
    );
    return patch;
  }, []);

  const deleteBudget = useCallback((budgetId) => {
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
  }, []);

  // Get spent amount for a specific category+wallet combination
  // Matches budget type:
  // - If budget is for specific wallet (walletName !== "Tất cả ví"), track only category:walletName
  // - If budget is for all wallets (walletName === "Tất cả ví"), track only category:all
  const getSpentAmount = useCallback((categoryName, walletName = null) => {
    if (!walletName) {
      // No wallet specified, return the "all wallets" total
      return transactionsByCategory[`${categoryName}:all`] || 0;
    }
    // Return spent for this specific category:wallet combo only
    return transactionsByCategory[`${categoryName}:${walletName}`] || 0;
  }, [transactionsByCategory]);

  // Get remaining amount for a category+wallet
  const getRemainingAmount = useCallback((categoryName, limitAmount, walletName = null) => {
    const spent = getSpentAmount(categoryName, walletName);
    return limitAmount - spent;
  }, [getSpentAmount]);

  // Update transactions map (called from TransactionsPage)
  // Expected format: { "categoryName:walletName": amount, "categoryName:all": amount, ... }
  const updateTransactionsByCategory = useCallback((categoryMap) => {
    setTransactionsByCategory(categoryMap);
  }, []);

  const value = useMemo(
    () => ({
      budgets,
      transactionsByCategory,
      createBudget,
      updateBudget,
      deleteBudget,
      getSpentAmount,
      getRemainingAmount,
      updateTransactionsByCategory,
    }),
    [
      budgets,
      transactionsByCategory,
      createBudget,
      updateBudget,
      deleteBudget,
      getSpentAmount,
      getRemainingAmount,
      updateTransactionsByCategory,
    ]
  );

  return (
    <BudgetDataContext.Provider value={value}>
      {children}
    </BudgetDataContext.Provider>
  );
}

export function useBudgetData() {
  const ctx = useContext(BudgetDataContext);
  if (!ctx) throw new Error("useBudgetData must be used within BudgetDataProvider");
  return ctx;
}
