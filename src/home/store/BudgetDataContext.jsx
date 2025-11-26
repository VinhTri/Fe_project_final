import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { budgetAPI } from "../../services/api-client";
import { transactionAPI } from "../../services/api-client";

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
      alertPercentage: Number(apiBudget.warningThreshold ?? apiBudget.alertPercentage ?? 80),
      note: apiBudget.note || "",
    };
  }, []);

  // Load budgets from API
  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await budgetAPI.getAllBudgets();
      
      if (data?.budgets && Array.isArray(data.budgets)) {
        // Filter out soft-deleted budgets
        const activeBudgets = data.budgets.filter(
          (budget) => {
            if (budget.deletedAt || budget.isDeleted === true) return false;
            return true;
          }
        );
        const mappedBudgets = activeBudgets.map(mapBudgetToFrontend);
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

  // Load external transactions from API
  const loadExternalTransactions = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setExternalTransactionsList([]);
        return;
      }

      const txResponse = await transactionAPI.getAllTransactions();
      if (txResponse?.transactions && Array.isArray(txResponse.transactions)) {
        // Map transactions to frontend format
        const mapped = txResponse.transactions.map((tx) => {
          const typeName = tx.transactionType?.typeName || "";
          const type = typeName === "Chi tiêu" ? "expense" : "income";
          
          return {
            id: tx.transactionId,
            type: type,
            walletName: tx.wallet?.walletName || "Unknown",
            amount: parseFloat(tx.amount || 0),
            currency: tx.wallet?.currencyCode || "VND",
            date: tx.createdAt || tx.transactionDate || new Date().toISOString(),
            category: tx.category?.categoryName || "Unknown",
            note: tx.note || "",
          };
        });
        setExternalTransactionsList(mapped);
      } else {
        setExternalTransactionsList([]);
      }
    } catch (err) {
      console.error("Error loading external transactions in BudgetDataContext:", err);
      setExternalTransactionsList([]);
    }
  }, []);

  // Load budgets and transactions when component mounts
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      loadBudgets();
      loadExternalTransactions();
    } else {
      setLoading(false);
      setExternalTransactionsList([]);
    }

    // Reload when user changes (login/logout)
    const handleUserChange = () => {
      const newToken = localStorage.getItem("accessToken");
      if (newToken) {
        loadBudgets();
        loadExternalTransactions();
      } else {
        setBudgets([]);
        setExternalTransactionsList([]);
        setLoading(false);
      }
    };
    window.addEventListener("userChanged", handleUserChange);

    // Reload when storage changes (login/logout from another tab)
    const handleStorageChange = (e) => {
      if (e.key === "accessToken" || e.key === "user" || e.key === "auth_user") {
        const newToken = localStorage.getItem("accessToken");
        if (newToken) {
          loadBudgets();
          loadExternalTransactions();
        } else {
          setBudgets([]);
          setExternalTransactionsList([]);
          setLoading(false);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("userChanged", handleUserChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadBudgets, loadExternalTransactions]);

  // ====== helpers ======
  const createBudget = useCallback(async (payload) => {
    // payload: { categoryId, categoryName, categoryType, limitAmount, walletId, walletName, startDate, endDate, alertPercentage, note }
    try {
      const budgetData = {
        categoryId: payload.categoryId,
        walletId: payload.walletId === "ALL" ? null : (payload.walletId || null),
        amountLimit: Number(payload.limitAmount || payload.amountLimit || 0),
        startDate: payload.startDate,
        endDate: payload.endDate,
        warningThreshold: Number(payload.alertPercentage ?? payload.warningThreshold ?? 80),
        note: payload.note || null,
      };

      const data = await budgetAPI.createBudget(budgetData);

      if (data?.budget) {
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

  const updateBudget = useCallback(async (budgetId, payload) => {
    // payload: { categoryId, limitAmount, walletId, startDate, endDate, note }
    try {
      const budgetData = {
        walletId: payload.walletId === "ALL" || payload.walletId === null ? null : payload.walletId,
        amountLimit: Number(payload.limitAmount || payload.amountLimit || 0),
        startDate: payload.startDate,
        endDate: payload.endDate,
        warningThreshold: Number(payload.alertPercentage ?? payload.warningThreshold ?? 80),
        note: payload.note || null,
      };

      const data = await budgetAPI.updateBudget(budgetId, budgetData);

      if (data?.budget) {
        const updatedBudget = mapBudgetToFrontend(data.budget);
        setBudgets((prev) =>
          prev.map((b) => (b.id === budgetId || b.budgetId === budgetId ? updatedBudget : b))
        );
        return updatedBudget;
      } else {
        const errorMessage = data?.error || data?.message || "Cập nhật hạn mức chi tiêu thất bại";
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("Error updating budget:", err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(err?.message || err?.error || "Cập nhật hạn mức chi tiêu thất bại");
    }
  }, [mapBudgetToFrontend]);

  const deleteBudget = useCallback(async (budgetId) => {
    try {
      const data = await budgetAPI.deleteBudget(budgetId);

      // Xóa khỏi local state
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId && b.budgetId !== budgetId));
      return true;
    } catch (err) {
      console.error("Error deleting budget:", err);
      const errorMessage = err?.message || err?.error || "Xóa hạn mức chi tiêu thất bại";
      throw new Error(errorMessage);
    }
  }, []);

  // Compute spent amount for a budget object
  // Ưu tiên sử dụng spentAmount từ API, nếu không có thì tính từ transactions
  const getSpentForBudget = useCallback((budget) => {
    if (!budget) return 0;
    
    // Nếu budget đã có spentAmount từ API, sử dụng nó
    if (budget.spentAmount !== undefined && budget.spentAmount !== null) {
      return Number(budget.spentAmount) || 0;
    }
    
    // Nếu không có, tính từ externalTransactionsList (fallback)
    if (!budget.categoryName || !budget.startDate || !budget.endDate) return 0;
    
    // Parse dates carefully to handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm" formats
    const parseDate = (dateStr) => {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length !== 3) return null;
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    };
    
    const budgetStart = parseDate(budget.startDate);
    const budgetEnd = parseDate(budget.endDate);
    
    if (!budgetStart || !budgetEnd) return 0;
    
    budgetStart.setHours(0, 0, 0, 0);
    budgetEnd.setHours(23, 59, 59, 999);

    let sum = 0;
    externalTransactionsList.forEach((t) => {
      if (t.type !== "expense") return;
      if (!t.category) return;
      if (t.category !== budget.categoryName) return;
      if (budget.walletName && budget.walletName !== "Tất cả ví") {
        if (t.walletName !== budget.walletName) return;
      }
      
      const transactionDate = new Date(t.date);
      if (isNaN(transactionDate.getTime())) return;
      
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
