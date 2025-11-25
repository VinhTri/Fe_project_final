import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { createBudget as createBudgetAPI, getAllBudgets } from "../../services/budget.service";

const BudgetDataContext = createContext(null);

export function BudgetDataProvider({ children }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Calculate spent amount for category+wallet combinations
  // Key format: "categoryName:walletName" or "categoryName:all" for budgets applying to all wallets
  const [transactionsByCategory, setTransactionsByCategory] = useState({
    // example: { "Ăn uống:Tiền mặt": 1200000, "Ăn uống:all": 1500000, "Mua sắm:Techcombank": 800000 }
  });
  
  // Keep a copy of all external transactions so we can compute period-based totals
  const [externalTransactionsList, setExternalTransactionsList] = useState([]);

  // Map API budget data to frontend format
  const mapBudgetToFrontend = useCallback((apiBudget) => {
    const currentMonth = new Date(apiBudget.startDate).toLocaleDateString("vi-VN", {
      month: "2-digit",
      year: "numeric",
    });

    return {
      id: apiBudget.budgetId,
      budgetId: apiBudget.budgetId,
      categoryId: apiBudget.categoryId,
      categoryName: apiBudget.categoryName,
      categoryType: "expense", // Budget chỉ áp dụng cho expense
      limitAmount: Number(apiBudget.amountLimit || 0),
      amountLimit: Number(apiBudget.amountLimit || 0),
      spentAmount: Number(apiBudget.spentAmount || 0),
      remainingAmount: Number(apiBudget.remainingAmount || 0),
      exceededAmount: Number(apiBudget.exceededAmount || 0),
      usagePercentage: Number(apiBudget.usagePercentage || 0),
      status: apiBudget.status || "OK", // OK, WARNING, EXCEEDED
      budgetStatus: apiBudget.budgetStatus || "ACTIVE", // ACTIVE, COMPLETED
      createdAt: apiBudget.createdAt,
      updatedAt: apiBudget.updatedAt,
      walletId: apiBudget.walletId || null,
      walletName: apiBudget.walletName || "Tất cả ví",
      month: currentMonth,
      startDate: apiBudget.startDate,
      endDate: apiBudget.endDate,
      alertPercentage: 90, // Default, có thể tính từ usagePercentage
      note: apiBudget.note || "",
    };
  }, []);

  // Load budgets from API
  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { response, data } = await getAllBudgets();
      
      if (response?.ok && data?.budgets) {
        const mappedBudgets = data.budgets.map(mapBudgetToFrontend);
        setBudgets(mappedBudgets);
      } else {
        console.error("Failed to load budgets:", data?.error);
        setBudgets([]);
        if (data?.error) {
          setError(data.error);
        }
      }
    } catch (err) {
      console.error("Error loading budgets:", err);
      setBudgets([]);
      setError("Không thể tải danh sách hạn mức chi tiêu.");
    } finally {
      setLoading(false);
    }
  }, [mapBudgetToFrontend]);

  // Load budgets when component mounts
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      loadBudgets();
    } else {
      setLoading(false);
    }
  }, [loadBudgets]);

  // ====== helpers ======
  const createBudget = useCallback(async (payload) => {
    // payload: { categoryId, categoryName, categoryType, limitAmount, walletId, walletName, startDate, endDate, note }
    try {
      const budgetData = {
        categoryId: payload.categoryId,
        walletId: payload.walletId || null,
        amountLimit: Number(payload.limitAmount || payload.amountLimit || 0),
        startDate: payload.startDate,
        endDate: payload.endDate,
        note: payload.note || null,
      };

      const { response, data } = await createBudgetAPI(budgetData);

      if (response?.ok && data?.budget) {
        const newBudget = mapBudgetToFrontend(data.budget);
        setBudgets((prev) => [newBudget, ...prev]);
        return newBudget;
      } else {
        throw new Error(data?.error || "Tạo hạn mức chi tiêu thất bại");
      }
    } catch (err) {
      console.error("Error creating budget:", err);
      throw err;
    }
  }, [mapBudgetToFrontend]);

  const updateBudget = useCallback((budgetId, patch) => {
    // Note: API không có endpoint update budget, nên chỉ update local state
    // Nếu backend thêm API sau, có thể tích hợp ở đây
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId || b.budgetId === budgetId ? { ...b, ...patch } : b))
    );
    return patch;
  }, []);

  const deleteBudget = useCallback((budgetId) => {
    // Note: API không có endpoint delete budget, nên chỉ xóa local state
    // Nếu backend thêm API sau, có thể tích hợp ở đây
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId && b.budgetId !== budgetId));
  }, []);

  // Compute spent amount for a budget object by scanning externalTransactionsList within the budget's date range
  const getSpentForBudget = useCallback((budget) => {
    if (!budget || !budget.categoryName) return 0;
    if (!budget.startDate || !budget.endDate) return 0;
    
    // Parse dates carefully to handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm" formats
    // For "YYYY-MM-DD", parse as local time, not UTC
    const parseDate = (dateStr) => {
      const parts = dateStr.split('T')[0].split('-'); // Get YYYY-MM-DD part
      if (parts.length !== 3) return null;
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    };
    
    const budgetStart = parseDate(budget.startDate);
    const budgetEnd = parseDate(budget.endDate);
    
    if (!budgetStart || !budgetEnd) return 0;
    
    budgetStart.setHours(0, 0, 0, 0); // Start of day
    budgetEnd.setHours(23, 59, 59, 999); // End of day

    let sum = 0;
    externalTransactionsList.forEach((t) => {
      if (t.type !== "expense") return;
      if (!t.category) return;
      if (t.category !== budget.categoryName) return;
      // Check wallet match
      if (budget.walletName && budget.walletName !== "Tất cả ví") {
        if (t.walletName !== budget.walletName) return;
      }
      
      const transactionDate = new Date(t.date);
      if (isNaN(transactionDate.getTime())) return;
      
      // Check if transaction is within budget period
      if (transactionDate >= budgetStart && transactionDate <= budgetEnd) {
        sum += t.amount;
      }
    });
    return sum;
  }, [externalTransactionsList]);

  const getRemainingAmount = useCallback((categoryName, limitAmount, walletName = null, startDate = null, endDate = null) => {
    // Create a temp budget object to calculate spent amount
    const bud = { categoryName, walletName, startDate, endDate };
    const spent = getSpentForBudget(bud);
    return limitAmount - spent;
  }, [getSpentForBudget]);
  // Backwards-compatible: return total spent using the aggregated map (no period)
  const getSpentAmount = useCallback((categoryName, walletName = null) => {
    if (!walletName) {
      return transactionsByCategory[`${categoryName}:all`] || 0;
    }
    return transactionsByCategory[`${categoryName}:${walletName}`] || 0;
  }, [transactionsByCategory]);

  // Update transactions map (called from TransactionsPage)
  // Expected format: { "categoryName:walletName": amount, "categoryName:all": amount, ... }
  const updateTransactionsByCategory = useCallback((categoryMap) => {
    setTransactionsByCategory(categoryMap);
  }, []);

  const updateAllExternalTransactions = useCallback((list) => {
    setExternalTransactionsList(list || []);
  }, []);

  const value = useMemo(
    () => ({
      budgets,
      loading,
      error,
      transactionsByCategory,
      externalTransactionsList,
      createBudget,
      updateBudget,
      deleteBudget,
      getSpentAmount,
      getSpentForBudget,
      getRemainingAmount,
      updateTransactionsByCategory,
      updateAllExternalTransactions,
      reloadBudgets: loadBudgets,
    }),
    [
      budgets,
      loading,
      error,
      transactionsByCategory,
      externalTransactionsList,
      createBudget,
      updateBudget,
      deleteBudget,
      getSpentAmount,
      getSpentForBudget,
      getRemainingAmount,
      updateTransactionsByCategory,
      updateAllExternalTransactions,
      loadBudgets,
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
