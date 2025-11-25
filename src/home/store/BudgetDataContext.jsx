import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { createBudget as createBudgetAPI, getAllBudgets, updateBudget as updateBudgetAPI, deleteBudget as deleteBudgetAPI } from "../../services/budget.service";
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
      alertPercentage: Number(apiBudget.warningThreshold ?? apiBudget.alertPercentage ?? 80), // Map từ warningThreshold API
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
        // Filter out soft-deleted budgets (if backend returns them)
        // Backend may already filter soft-deleted, but we check just in case
        const activeBudgets = data.budgets.filter(
          (budget) => {
            // Check for soft delete indicators
            if (budget.deletedAt || budget.isDeleted === true) return false;
            // budgetStatus can be "ACTIVE" or "COMPLETED", not "DELETED" (backend handles this)
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
        // Map transactions to frontend format (simplified version for budget calculation)
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
        walletId: payload.walletId || null,
        amountLimit: Number(payload.limitAmount || payload.amountLimit || 0),
        startDate: payload.startDate,
        endDate: payload.endDate,
        warningThreshold: Number(payload.alertPercentage ?? payload.warningThreshold ?? 80), // Map alertPercentage to warningThreshold
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

  const updateBudget = useCallback(async (budgetId, payload) => {
    // payload: { categoryId, limitAmount, walletId, startDate, endDate, note }
    // Lưu ý: API không cho phép thay đổi categoryId khi update
    try {
      // Map frontend payload to API format
      // Chỉ gửi các field được phép: walletId, amountLimit, startDate, endDate, warningThreshold, note
      const budgetData = {
        walletId: payload.walletId === "ALL" || payload.walletId === null ? null : payload.walletId,
        amountLimit: Number(payload.limitAmount || payload.amountLimit || 0),
        startDate: payload.startDate,
        endDate: payload.endDate,
        warningThreshold: Number(payload.alertPercentage ?? payload.warningThreshold ?? 80), // Map alertPercentage to warningThreshold
        note: payload.note || null,
      };

      const { response, data } = await updateBudgetAPI(budgetId, budgetData);

      if (response?.ok && data?.budget) {
        const updatedBudget = mapBudgetToFrontend(data.budget);
        setBudgets((prev) =>
          prev.map((b) => (b.id === budgetId || b.budgetId === budgetId ? updatedBudget : b))
        );
        return updatedBudget;
      } else {
        // Xử lý error message từ API
        const errorMessage = data?.error || data?.message || "Cập nhật hạn mức chi tiêu thất bại";
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("Error updating budget:", err);
      // Nếu err đã là Error object với message, throw lại
      if (err instanceof Error) {
        throw err;
      }
      // Nếu là object khác, wrap thành Error
      throw new Error(err?.message || err?.error || "Cập nhật hạn mức chi tiêu thất bại");
    }
  }, [mapBudgetToFrontend]);

  const deleteBudget = useCallback(async (budgetId) => {
    try {
      const { response, data } = await deleteBudgetAPI(budgetId);

      if (response?.ok) {
        // Xóa khỏi local state
        setBudgets((prev) => prev.filter((b) => b.id !== budgetId && b.budgetId !== budgetId));
        return true;
      } else {
        // Xử lý error message từ API
        const errorMessage = data?.error || data?.message || "Xóa hạn mức chi tiêu thất bại";
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("Error deleting budget:", err);
      // Nếu err đã là Error object với message, throw lại
      if (err instanceof Error) {
        throw err;
      }
      // Nếu là object khác, wrap thành Error
      throw new Error(err?.message || err?.error || "Xóa hạn mức chi tiêu thất bại");
    }
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
