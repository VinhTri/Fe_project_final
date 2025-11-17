import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { 
  createExpense as createExpenseAPI,
  createIncome as createIncomeAPI,
  getAllTransactions as getAllTransactionsAPI,
  getTransactionById as getTransactionByIdAPI,
  getTransactionsByWallet as getTransactionsByWalletAPI,
  updateTransaction as updateTransactionAPI,
  deleteTransaction as deleteTransactionAPI,
} from "../../services/transaction.service";
import { useWalletData } from "./WalletDataContext";
import { useCategoryData } from "./CategoryDataContext";

const TransactionDataContext = createContext(null);

export function TransactionDataProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lấy wallets và categories từ context khác
  const { wallets } = useWalletData();
  const { expenseCategories, incomeCategories } = useCategoryData();

  // Helper: Normalize transaction data từ API format sang format dùng trong app
  const normalizeTransaction = (apiTransaction) => {
    return {
      id: apiTransaction.transactionId || apiTransaction.id,
      code: `TX-${String(apiTransaction.transactionId || apiTransaction.id).padStart(4, "0")}`,
      type: apiTransaction.transactionType?.typeId === 1 ? "expense" : "income",
      walletName: apiTransaction.wallet?.walletName || apiTransaction.walletName || "",
      walletId: apiTransaction.wallet?.walletId || apiTransaction.walletId,
      amount: apiTransaction.amount || 0,
      currency: apiTransaction.wallet?.currencyCode || apiTransaction.currencyCode || "VND",
      date: apiTransaction.transactionDate || apiTransaction.date,
      category: apiTransaction.category?.categoryName || apiTransaction.categoryName || "",
      categoryId: apiTransaction.category?.categoryId || apiTransaction.categoryId,
      note: apiTransaction.note || "",
      attachment: apiTransaction.imageUrl || apiTransaction.image_url || "",
      creatorCode: apiTransaction.user?.userId ? `USR${String(apiTransaction.user.userId).padStart(3, "0")}` : "USR001",
      createdAt: apiTransaction.createdAt,
      updatedAt: apiTransaction.updatedAt,
    };
  };

  // Memoize loadTransactions để tránh infinite loop
  const loadTransactions = useCallback(async (filterData = {}) => {
    try {
      setLoading(true);
      console.log("TransactionDataContext: Loading transactions với filter:", filterData);
      const { response, data } = await getAllTransactionsAPI(filterData);
      console.log("TransactionDataContext: API response:", { 
        ok: response.ok, 
        status: response.status,
        hasTransactions: !!data.transactions,
        transactionCount: data.transactions?.length || 0
      });
      
      if (response.ok && data.transactions) {
        const normalizedTransactions = data.transactions.map(normalizeTransaction);
        console.log("TransactionDataContext: Normalized transactions:", normalizedTransactions.length);
        setTransactions(normalizedTransactions);
        return normalizedTransactions;
      } else {
        console.error("TransactionDataContext: Failed to load transactions:", data.error || "Unknown error");
        return [];
      }
    } catch (error) {
      console.error("TransactionDataContext: Error loading transactions:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependencies vì function này không phụ thuộc vào state/props

  // Load transactions từ API khi component mount (chỉ một lần)
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const createTransaction = async (payload) => {
    try {
      // Kiểm tra token trước
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
      }

      // Validate payload
      if (!payload.walletName) {
        throw new Error("Vui lòng chọn ví");
      }
      if (!payload.category) {
        throw new Error("Vui lòng chọn danh mục");
      }
      if (!payload.amount || Number(payload.amount) <= 0) {
        throw new Error("Số tiền phải lớn hơn 0");
      }

      // Xác định loại giao dịch và gọi API tương ứng
      const isExpense = payload.type === "expense";
      
      // Tìm walletId từ walletName
      const wallet = wallets?.find(w => w.name === payload.walletName);
      if (!wallet) {
        throw new Error(`Không tìm thấy ví "${payload.walletName}". Vui lòng chọn lại ví.`);
      }

      // Tìm categoryId từ categoryName
      const categories = isExpense ? expenseCategories : incomeCategories;
      const category = categories?.find(c => c.name === payload.category);
      if (!category) {
        throw new Error(`Không tìm thấy danh mục "${payload.category}". Vui lòng chọn lại danh mục.`);
      }

      // Chuyển đổi date sang ISO format
      let transactionDate;
      if (payload.date) {
        const dateObj = new Date(payload.date);
        if (isNaN(dateObj.getTime())) {
          throw new Error("Ngày giao dịch không hợp lệ");
        }
        transactionDate = dateObj.toISOString();
      } else {
        transactionDate = new Date().toISOString();
      }

      const transactionData = {
        walletId: wallet.id,
        categoryId: category.id,
        amount: Number(payload.amount),
        transactionDate: transactionDate,
        note: payload.note || "",
        imageUrl: payload.attachment || null,
      };

      console.log("TransactionDataContext: Creating transaction:", {
        ...transactionData,
        walletName: wallet.name,
        categoryName: category.name
      });

      let result;
      if (isExpense) {
        result = await createExpenseAPI(transactionData);
      } else {
        result = await createIncomeAPI(transactionData);
      }

      console.log("TransactionDataContext: API response:", {
        ok: result.response.ok,
        status: result.response.status,
        statusText: result.response.statusText,
        hasTransaction: !!result.data?.transaction,
        hasMessage: !!result.data?.message,
        error: result.data?.error,
        fullData: result.data
      });

      if (result.response.ok) {
        // Kiểm tra xem có transaction trong response không
        if (result.data?.transaction) {
          const newTransaction = normalizeTransaction(result.data.transaction);
          // Cập nhật state mà không trigger reload toàn bộ transactions
          setTransactions(prev => {
            // Kiểm tra xem transaction đã tồn tại chưa (tránh duplicate)
            const exists = prev.find(t => t.id === newTransaction.id);
            if (exists) {
              return prev; // Không cần update nếu đã có
            }
            return [newTransaction, ...prev];
          });
          
          // Reload wallets để cập nhật balance
          // (có thể gọi loadWallets từ WalletDataContext nếu cần)
          
          return newTransaction;
        } else if (result.data?.message) {
          // Nếu chỉ có message mà không có transaction, có thể là lỗi từ backend
          throw new Error(result.data.message || "Không thể tạo giao dịch");
        } else {
          // Response OK nhưng không có data hợp lệ
          throw new Error("Phản hồi từ máy chủ không hợp lệ. Vui lòng thử lại.");
        }
      } else {
        // Xử lý các loại lỗi khác nhau
        const errorMessage = result.data?.error || result.data?.message || `Không thể tạo giao dịch (HTTP ${result.response.status})`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      
      // Nếu là lỗi từ API (đã có message), throw lại
      if (error.message && !error.message.includes("Lỗi kết nối")) {
        throw error;
      }
      
      // Nếu là lỗi network, throw với message rõ ràng hơn
      if (error.message && error.message.includes("Lỗi kết nối")) {
        throw new Error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc đảm bảo backend đang chạy.");
      }
      
      // Các lỗi khác
      throw new Error(error.message || "Không thể tạo giao dịch. Vui lòng thử lại.");
    }
  };

  const updateTransaction = async (transactionId, payload) => {
    try {
      // Tìm transaction hiện tại để lấy thông tin
      const currentTransaction = transactions.find(t => t.id === transactionId);
      if (!currentTransaction) {
        throw new Error("Không tìm thấy giao dịch");
      }

      // Tìm walletId từ walletName
      const wallet = wallets?.find(w => w.name === payload.walletName || w.name === currentTransaction.walletName);
      if (!wallet) {
        throw new Error("Không tìm thấy ví");
      }

      // Tìm categoryId từ categoryName
      const isExpense = payload.type === "expense" || currentTransaction.type === "expense";
      const categories = isExpense ? expenseCategories : incomeCategories;
      const category = categories?.find(c => c.name === payload.category || c.name === currentTransaction.category);
      if (!category) {
        throw new Error("Không tìm thấy danh mục");
      }

      // Chuyển đổi date sang ISO format
      const transactionDate = payload.date 
        ? new Date(payload.date).toISOString()
        : currentTransaction.date;

      const updateData = {
        walletId: wallet.id,
        categoryId: category.id,
        amount: Number(payload.amount || currentTransaction.amount),
        transactionDate: transactionDate,
        note: payload.note !== undefined ? payload.note : currentTransaction.note,
        imageUrl: payload.attachment !== undefined ? (payload.attachment || null) : currentTransaction.attachment,
      };

      console.log("TransactionDataContext: Updating transaction:", transactionId, updateData);

      const result = await updateTransactionAPI(transactionId, updateData);

      console.log("TransactionDataContext: Update API response:", result);

      if (result.response.ok && result.data.transaction) {
        const updatedTransaction = normalizeTransaction(result.data.transaction);
        setTransactions(prev => prev.map(t => t.id === transactionId ? updatedTransaction : t));
        
        // Reload wallets để cập nhật balance
        // (có thể gọi loadWallets từ WalletDataContext nếu cần)
        
        return updatedTransaction;
      } else {
        throw new Error(result.data.error || "Không thể cập nhật giao dịch");
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  };

  const removeTransaction = async (transactionId) => {
    try {
      console.log("TransactionDataContext: Deleting transaction:", transactionId);

      const result = await deleteTransactionAPI(transactionId);

      console.log("TransactionDataContext: Delete API response:", result);

      if (result.response.ok) {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        
        // Reload wallets để cập nhật balance
        // (có thể gọi loadWallets từ WalletDataContext nếu cần)
        
        return true;
      } else {
        throw new Error(result.data.error || "Không thể xóa giao dịch");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  };

  const value = useMemo(() => ({
    transactions,
    loading,
    createTransaction,
    loadTransactions,
    updateTransaction,
    deleteTransaction: removeTransaction,
  }), [transactions, loading, loadTransactions]);

  return <TransactionDataContext.Provider value={value}>{children}</TransactionDataContext.Provider>;
}

export function useTransactionData() {
  const ctx = useContext(TransactionDataContext);
  if (!ctx) throw new Error("useTransactionData must be used within TransactionDataProvider");
  return ctx;
}

