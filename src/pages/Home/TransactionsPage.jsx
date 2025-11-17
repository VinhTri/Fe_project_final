import React, { useMemo, useState, useEffect, useCallback } from "react";
import "../../styles/home/TransactionsPage.css";
import TransactionViewModal from "../../components/transactions/TransactionViewModal";
import TransactionFormModal from "../../components/transactions/TransactionFormModal";
import ConfirmModal from "../../components/common/Modal/ConfirmModal";
import SuccessToast from "../../components/common/Toast/SuccessToast";
import BudgetWarningModal from "../../components/budgets/BudgetWarningModal";
import { useBudgetData } from "../../home/store/BudgetDataContext";
import { useCategoryData } from "../../home/store/CategoryDataContext";
import { useWalletData } from "../../home/store/WalletDataContext";
import { useTransactionData } from "../../home/store/TransactionDataContext";

const TABS = {
  EXTERNAL: "external",
  INTERNAL: "internal",
};

const PAGE_SIZE = 10;

function toDateObj(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function TransactionsPage() {
  const [externalTransactions, setExternalTransactions] = useState([]);
  const [internalTransactions, setInternalTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS.EXTERNAL);

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterWallet, setFilterWallet] = useState("all");
  const [fromDateTime, setFromDateTime] = useState("");
  const [toDateTime, setToDateTime] = useState("");

  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "" });

  const [currentPage, setCurrentPage] = useState(1);

  // Get shared data from contexts
  const { budgets, getSpentAmount, getSpentForBudget, updateTransactionsByCategory, updateAllExternalTransactions } = useBudgetData();
  const { expenseCategories, incomeCategories } = useCategoryData();
  const { wallets, loadWallets } = useWalletData();
  const { createTransaction, loadTransactions, updateTransaction, deleteTransaction, transactions: apiTransactions } = useTransactionData();
  
  // Budget warning state
  const [budgetWarning, setBudgetWarning] = useState(null);
  const [pendingTransaction, setPendingTransaction] = useState(null);

  // Load transactions từ API khi component mount hoặc filter thay đổi
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoadingTransactions(true);
        console.log("TransactionsPage: Fetching transactions với filters:", {
          filterWallet,
          filterType,
          fromDateTime,
          toDateTime,
          walletsCount: wallets.length
        });
        
        // Build filter data từ các filter hiện tại
        const filterData = {};
        
        if (filterWallet !== "all" && filterWallet) {
          const wallet = wallets.find(w => w.name === filterWallet);
          if (wallet) {
            filterData.walletId = wallet.id;
            console.log("TransactionsPage: Filter by wallet:", wallet.id, wallet.name);
          }
        }
        
        if (filterType !== "all") {
          filterData.typeId = filterType === "expense" ? 1 : 2;
          console.log("TransactionsPage: Filter by type:", filterData.typeId);
        }
        
        if (fromDateTime) {
          filterData.startDate = new Date(fromDateTime).toISOString();
          console.log("TransactionsPage: Filter from date:", filterData.startDate);
        }
        
        if (toDateTime) {
          filterData.endDate = new Date(toDateTime).toISOString();
          console.log("TransactionsPage: Filter to date:", filterData.endDate);
        }
        
        console.log("TransactionsPage: Calling loadTransactions với filterData:", filterData);
        const loadedTransactions = await loadTransactions(filterData);
        console.log("TransactionsPage: Loaded transactions:", loadedTransactions.length);
        
        // Tách external và internal transactions
        const external = loadedTransactions.filter(t => t.type !== "transfer");
        const internal = loadedTransactions.filter(t => t.type === "transfer");
        
        console.log("TransactionsPage: External:", external.length, "Internal:", internal.length);
        
        setExternalTransactions(external);
        setInternalTransactions(internal);
      } catch (error) {
        console.error("TransactionsPage: Error loading transactions:", error);
        // Hiển thị mảng rỗng nếu có lỗi (không dùng mock data)
        setExternalTransactions([]);
        setInternalTransactions([]);
      } finally {
        setLoadingTransactions(false);
      }
    };
    
    // Chỉ fetch khi wallets đã được load (tránh race condition)
    if (wallets.length > 0 || filterWallet === "all") {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterWallet, filterType, fromDateTime, toDateTime, wallets.length]);
  // Note: loadTransactions được memoized trong TransactionDataContext, không cần thêm vào deps

  const nextCode = () => {
    const all = [...externalTransactions, ...internalTransactions];
    const max = all.reduce((m, t) => {
      const num = parseInt(String(t.code || "").replace(/\D/g, ""), 10);
      return Number.isNaN(num) ? m : Math.max(m, num);
    }, 0);
    const n = max + 1;
    return `TX-${String(n).padStart(4, "0")}`;
  };

  const handleTabChange = (e) => {
    const value = e.target.value;
    setActiveTab(value);
    setSearchText("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterWallet("all");
    setFromDateTime("");
    setToDateTime("");
    setCurrentPage(1);
    setViewing(null);
    setEditing(null);
    setConfirmDel(null);
    setCreating(false);
  };

  const handleCreate = async (payload) => {
    // Check for budget warning if this is an external expense transaction with a category
    if (activeTab === TABS.EXTERNAL && payload.type === "expense") {
      const categoryBudget = budgets.find((b) => b.categoryName === payload.category);
      if (categoryBudget) {
        // Match budget type:
        // - If budget is for specific wallet, check only category:walletName transactions
        // - If budget is for all wallets, check only category:all transactions
        let shouldCheckBudget = false;
        
        if (categoryBudget.walletName === "Tất cả ví") {
          // Budget applies to all wallets - will track category:all
          shouldCheckBudget = true;
        } else if (categoryBudget.walletName === payload.walletName) {
          // Budget is for this specific wallet
          shouldCheckBudget = true;
        }

        if (shouldCheckBudget) {
          // Get spent amount using date-range-aware calculation
          const spent = getSpentForBudget ? getSpentForBudget(categoryBudget) : getSpentAmount(payload.category, payload.walletName);
          const totalAfterTx = spent + payload.amount;
          const remaining = categoryBudget.limitAmount - spent;
          const percentAfterTx = (totalAfterTx / categoryBudget.limitAmount) * 100;

          // Show warning if: would exceed budget OR would reach 90% or more (sắp đạt hạn mức)
          if (payload.amount > remaining || percentAfterTx >= 90) {
            // Determine if this is an alert (approaching) or a warning (exceeding)
            const isExceeding = payload.amount > remaining;
            
            setBudgetWarning({
              categoryName: payload.category,
              budgetLimit: categoryBudget.limitAmount,
              spent,
              transactionAmount: payload.amount,
              totalAfterTx,
              isExceeding,
            });
            setPendingTransaction(payload);
            setCreating(false);
            return;
          }
        }
      }
    }

    // Proceed with transaction creation
    if (activeTab === TABS.EXTERNAL) {
      // Gọi API để tạo giao dịch thực tế
      try {
        const newTransaction = await createTransaction(payload);
        
        // Cập nhật local state để hiển thị ngay (không cần reload toàn bộ)
        setExternalTransactions((list) => {
          // Kiểm tra xem transaction đã tồn tại chưa (tránh duplicate)
          const exists = list.find(t => t.id === newTransaction.id);
          if (exists) {
            return list; // Không cần update nếu đã có
          }
          return [newTransaction, ...list];
        });
        
        // Reload wallets để cập nhật balance
        await loadWallets();
        
        setCreating(false);
        setToast({ open: true, message: "Đã thêm giao dịch mới." });
        setCurrentPage(1);
      } catch (error) {
        console.error("Error creating transaction:", error);
        const errorMessage = error.message || "Không thể tạo giao dịch. Vui lòng thử lại.";
        setToast({ 
          open: true, 
          message: errorMessage
        });
        setCreating(false);
      }
    } else {
      // Internal transaction (transfer) - sử dụng transferMoney từ WalletDataContext
      // Logic này đã được xử lý ở WalletInspector, không cần tạo transaction riêng
      const tx = {
        id: Date.now(),
        code: nextCode(),
        type: "transfer",
        sourceWallet: payload.sourceWallet,
        targetWallet: payload.targetWallet,
        amount: payload.amount,
        currency: payload.currency || "VND",
        date: payload.date,
        category: "Chuyển tiền giữa các ví",
        note: payload.note || "",
        creatorCode: "USR001",
        attachment: payload.attachment || "",
      };
      setInternalTransactions((list) => [tx, ...list]);
      
      setCreating(false);
      setToast({ open: true, message: "Đã thêm giao dịch mới." });
      setCurrentPage(1);
    }
  };

  // Handle budget warning confirmation (user wants to continue)
  const handleBudgetWarningConfirm = async () => {
    if (!pendingTransaction) return;

    // Create the transaction anyway
    if (activeTab === TABS.EXTERNAL) {
      try {
        const newTransaction = await createTransaction(pendingTransaction);
        
        // Cập nhật local state để hiển thị ngay
        setExternalTransactions((list) => [newTransaction, ...list]);
        
        // Reload wallets để cập nhật balance
        await loadWallets();
        
        setBudgetWarning(null);
        setPendingTransaction(null);
        setToast({ open: true, message: "Đã thêm giao dịch mới (vượt hạn mức)." });
        setCurrentPage(1);
      } catch (error) {
        console.error("Error creating transaction:", error);
        setToast({ 
          open: true, 
          message: error.message || "Không thể tạo giao dịch. Vui lòng thử lại." 
        });
        setBudgetWarning(null);
        setPendingTransaction(null);
      }
    }
  };

  // Handle budget warning cancellation
  const handleBudgetWarningCancel = () => {
    setBudgetWarning(null);
    setPendingTransaction(null);
    setCreating(true); // Go back to create form
  };

  const handleUpdate = async (payload) => {
    if (!editing) return;
    const isTransfer = !!editing.sourceWallet && !!editing.targetWallet;

    // Internal transaction (transfer) - không có API update, chỉ update local state
    if (isTransfer) {
      setInternalTransactions((list) =>
        list.map((t) =>
          t.id === editing.id
            ? {
                ...t,
                sourceWallet: payload.sourceWallet,
                targetWallet: payload.targetWallet,
                amount: payload.amount,
                date: payload.date,
                note: payload.note || "",
                currency: payload.currency || t.currency,
                attachment: payload.attachment || t.attachment,
              }
            : t
        )
      );
      setEditing(null);
      setToast({ open: true, message: "Đã cập nhật giao dịch." });
      return;
    }

    // External transaction - gọi API để update
    try {
      const updatedTransaction = await updateTransaction(editing.id, payload);
      
      // Cập nhật local state
      setExternalTransactions((list) =>
        list.map((t) =>
          t.id === editing.id ? updatedTransaction : t
        )
      );
      
      // Reload wallets để cập nhật balance
      await loadWallets();
      
      setEditing(null);
      setToast({ open: true, message: "Đã cập nhật giao dịch." });
    } catch (error) {
      console.error("Error updating transaction:", error);
      setToast({ 
        open: true, 
        message: error.message || "Không thể cập nhật giao dịch. Vui lòng thử lại." 
      });
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    const isTransfer = !!confirmDel.sourceWallet && !!confirmDel.targetWallet;

    // Internal transaction (transfer) - không có API delete, chỉ xóa local state
    if (isTransfer) {
      setInternalTransactions((list) =>
        list.filter((t) => t.id !== confirmDel.id)
      );
      setConfirmDel(null);
      setToast({ open: true, message: "Đã xóa giao dịch." });
      return;
    }

    // External transaction - gọi API để delete
    try {
      await deleteTransaction(confirmDel.id);
      
      // Cập nhật local state
      setExternalTransactions((list) =>
        list.filter((t) => t.id !== confirmDel.id)
      );
      
      // Reload wallets để cập nhật balance
      await loadWallets();
      
      setConfirmDel(null);
      setToast({ open: true, message: "Đã xóa giao dịch." });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setToast({ 
        open: true, 
        message: error.message || "Không thể xóa giao dịch. Vui lòng thử lại." 
      });
      setConfirmDel(null);
    }
  };

  // Update budget data when transactions change
  useEffect(() => {
    // Build transaction map keyed by category:wallet and category:all
    // category:walletName = spent for transactions of that category in that specific wallet
    // category:all = sum of all wallets for that category (for "apply to all wallets" budgets)
    const categoryMap = {};
    const categoryAllTotals = {}; // Temp to sum by category

    externalTransactions.forEach((t) => {
      if (t.type === "expense" && t.category && t.walletName) {
        // Add to specific wallet key
        const walletKey = `${t.category}:${t.walletName}`;
        categoryMap[walletKey] = (categoryMap[walletKey] || 0) + t.amount;

        // Track total for category:all calculation
        categoryAllTotals[t.category] = (categoryAllTotals[t.category] || 0) + t.amount;
      }
    });

    // Add category:all totals to map
    Object.entries(categoryAllTotals).forEach(([category, total]) => {
      categoryMap[`${category}:all`] = total;
    });

    updateTransactionsByCategory(categoryMap);
    // also provide the full transactions list to budget context for period-based calculations
    updateAllExternalTransactions(externalTransactions);
  }, [externalTransactions, updateTransactionsByCategory]);


  const currentTransactions = useMemo(
    () =>
      activeTab === TABS.EXTERNAL
        ? externalTransactions
        : internalTransactions,
    [activeTab, externalTransactions, internalTransactions]
  );

  const allCategories = useMemo(() => {
    const s = new Set(currentTransactions.map((t) => t.category).filter(Boolean));
    return Array.from(s);
  }, [currentTransactions]);

  const allWallets = useMemo(() => {
    if (activeTab === TABS.EXTERNAL) {
      const s = new Set(
        externalTransactions.map((t) => t.walletName).filter(Boolean)
      );
      return Array.from(s);
    }
    const s = new Set();
    internalTransactions.forEach((t) => {
      if (t.sourceWallet) s.add(t.sourceWallet);
      if (t.targetWallet) s.add(t.targetWallet);
    });
    return Array.from(s);
  }, [activeTab, externalTransactions, internalTransactions]);

  const filteredSorted = useMemo(() => {
    let list = currentTransactions.slice();

    list = list.filter((t) => {
      if (activeTab === TABS.EXTERNAL) {
        if (filterType !== "all" && t.type !== filterType) return false;
      }

      if (filterCategory !== "all" && t.category !== filterCategory) return false;

      if (filterWallet !== "all") {
        if (activeTab === TABS.EXTERNAL) {
          if (t.walletName !== filterWallet) return false;
        } else {
          if (
            t.sourceWallet !== filterWallet &&
            t.targetWallet !== filterWallet
          )
            return false;
        }
      }

      const d = toDateObj(t.date);
      if (!d) return false;

      if (fromDateTime) {
        const from = toDateObj(fromDateTime);
        if (from && d < from) return false;
      }
      if (toDateTime) {
        const to = toDateObj(toDateTime);
        if (to && d > to) return false;
      }

      if (searchText) {
        const keyword = searchText.toLowerCase();
        const joined =
          activeTab === TABS.EXTERNAL
            ? [
                t.code,
                t.walletName,
                t.category,
                t.note,
                t.amount?.toString(),
              ]
                .join(" ")
                .toLowerCase()
            : [
                t.code,
                t.sourceWallet,
                t.targetWallet,
                t.category,
                t.note,
                t.amount?.toString(),
              ]
                .join(" ")
                .toLowerCase();
        if (!joined.includes(keyword)) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      const da = toDateObj(a.date)?.getTime() || 0;
      const db = toDateObj(b.date)?.getTime() || 0;
      return db - da;
    });

    return list;
  }, [
    currentTransactions,
    activeTab,
    filterType,
    filterCategory,
    filterWallet,
    fromDateTime,
    toDateTime,
    searchText,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSorted.slice(start, start + PAGE_SIZE);
  }, [filteredSorted, currentPage]);

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const handleDateChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchText("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterWallet("all");
    setFromDateTime("");
    setToDateTime("");
    setCurrentPage(1);
  };

  return (
    <div className="tx-page container py-4">
      {/* HEADER – dùng màu giống trang Danh sách ví */}
      <div
        className="tx-header card border-0 mb-3"
        style={{
          borderRadius: 18,
          background:
            "linear-gradient(90deg, #00325d 0%, #004b8f 40%, #005fa8 100%)",
          color: "#ffffff",
        }}
      >
        <div className="card-body d-flex justify-content-between align-items-center">
          {/* BÊN TRÁI: ICON + TEXT */}
          <div className="d-flex align-items-center gap-2">
            <div className="tx-header-icon-wrap">
              {/* icon giống sidebar: Giao dịch = bi-cash-stack */}
              <i className="bi bi-cash-stack tx-header-icon" />
            </div>
            <div>
              <h2 className="tx-title mb-1" style={{ color: "#ffffff" }}>
                Quản lý Giao dịch
              </h2>
              <p className="mb-0" style={{ color: "rgba(255,255,255,0.82)" }}>
                Xem, tìm kiếm và quản lý các khoản thu chi gần đây.
              </p>
            </div>
          </div>

          {/* BÊN PHẢI: CHỌN LOẠI TRANG + THÊM GIAO DỊCH */}
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ minWidth: 220 }}
              value={activeTab}
              onChange={handleTabChange}
            >
              <option value={TABS.EXTERNAL}>Giao dịch ngoài</option>
              <option value={TABS.INTERNAL}>Giao dịch giữa các ví</option>
            </select>

            <button
              className="btn btn-primary tx-add-btn d-flex align-items-center"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => setCreating(true)}
            >
              <i className="bi bi-plus-lg me-2" />
              Thêm giao dịch mới
            </button>
          </div>
        </div>
      </div>


      {/* Filters */}
      <div className="tx-filters card border-0 mb-3">
        <div className="card-body d-flex flex-column gap-2">
          <div className="d-flex flex-wrap gap-2">
            <div className="tx-filter-item flex-grow-1">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  className="form-control border-start-0"
                  placeholder="Tìm kiếm giao dịch..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {activeTab === TABS.EXTERNAL && (
              <div className="tx-filter-item">
                <select
                  className="form-select"
                  value={filterType}
                  onChange={handleFilterChange(setFilterType)}
                >
                  <option value="all">Loại giao dịch</option>
                  <option value="income">Thu nhập</option>
                  <option value="expense">Chi tiêu</option>
                </select>
              </div>
            )}

            <div className="tx-filter-item">
              <select
                className="form-select"
                value={filterCategory}
                onChange={handleFilterChange(setFilterCategory)}
              >
                <option value="all">Danh mục</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center">
            <div className="tx-filter-item">
              <select
                className="form-select"
                value={filterWallet}
                onChange={handleFilterChange(setFilterWallet)}
              >
                <option value="all">Ví</option>
                {allWallets.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="tx-filter-item d-flex align-items-center gap-1">
              <input
                type="datetime-local"
                className="form-control"
                value={fromDateTime}
                onChange={handleDateChange(setFromDateTime)}
              />
              <span className="text-muted small px-1">đến</span>
              <input
                type="datetime-local"
                className="form-control"
                value={toDateTime}
                onChange={handleDateChange(setToDateTime)}
              />
            </div>

            <div className="ms-auto">
              <button
                className="btn btn-outline-secondary btn-sm"
                type="button"
                onClick={clearFilters}
              >
                <i className="bi bi-x-circle me-1" />
                Xóa lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng danh sách */}
      <div className="card border-0 shadow-sm tx-table-card">
        <div className="table-responsive">
          {activeTab === TABS.EXTERNAL ? (
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>STT</th>
                  <th>Ngày</th>
                  <th>Thời gian</th>
                  <th>Loại</th>
                  <th>Ví</th>
                  <th>Danh mục</th>
                  <th className="tx-note-col">Mô tả</th>
                  <th className="text-end">Số tiền</th>
                  <th className="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-4">
                      Không có giao dịch nào.
                    </td>
                  </tr>
                ) : (
                  paginated.map((t, i) => {
                    const serial = (currentPage - 1) * PAGE_SIZE + i + 1;
                    const d = toDateObj(t.date);
                    const dateStr = d
                      ? d.toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "";
                    const timeStr = d
                      ? d.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";

                    return (
                      <tr key={t.id}>
                        <td>{serial}</td>
                        <td>{dateStr}</td>
                        <td>{timeStr}</td>
                        <td>{t.type === "income" ? "Thu nhập" : "Chi tiêu"}</td>
                        <td>{t.walletName}</td>
                        <td>{t.category}</td>
                        <td className="tx-note-cell" title={t.note || "-"}>
                          {t.note || "-"}
                        </td>
                        <td className="text-end">
                          <span
                            className={
                              t.type === "expense"
                                ? "tx-amount-expense"
                                : "tx-amount-income"
                            }
                          >
                            {t.type === "expense" ? "-" : "+"}
                            {t.amount.toLocaleString("vi-VN")} {t.currency}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-link btn-sm text-muted me-1"
                            title="Xem chi tiết"
                            onClick={() => setViewing(t)}
                          >
                            <i className="bi bi-eye" />
                          </button>
                          <button
                            className="btn btn-link btn-sm text-muted me-1"
                            title="Chỉnh sửa"
                            onClick={() => setEditing(t)}
                          >
                            <i className="bi bi-pencil-square" />
                          </button>
                          <button
                            className="btn btn-link btn-sm text-danger"
                            title="Xóa"
                            onClick={() => setConfirmDel(t)}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>STT</th>
                  <th>Ngày</th>
                  <th>Thời gian</th>
                  <th>Ví gửi</th>
                  <th>Ví nhận</th>
                  <th className="tx-note-col">Ghi chú</th>
                  <th className="text-end">Số tiền</th>
                  <th className="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      Không có giao dịch nào.
                    </td>
                  </tr>
                ) : (
                  paginated.map((t, i) => {
                    const serial = (currentPage - 1) * PAGE_SIZE + i + 1;
                    const d = toDateObj(t.date);
                    const dateStr = d
                      ? d.toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "";
                    const timeStr = d
                      ? d.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";

                    return (
                      <tr key={t.id}>
                        <td>{serial}</td>
                        <td>{dateStr}</td>
                        <td>{timeStr}</td>
                        <td>{t.sourceWallet}</td>
                        <td>{t.targetWallet}</td>
                        <td className="tx-note-cell" title={t.note || "-"}>
                          {t.note || "-"}
                        </td>
                        <td className="text-end">
                          <span className="tx-amount-transfer">
                            {t.amount.toLocaleString("vi-VN")} {t.currency}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-link btn-sm text-muted me-1"
                            title="Xem chi tiết"
                            onClick={() => setViewing(t)}
                          >
                            <i className="bi bi-eye" />
                          </button>
                          <button
                            className="btn btn-link btn-sm text-muted me-1"
                            title="Chỉnh sửa"
                            onClick={() => setEditing(t)}
                          >
                            <i className="bi bi-pencil-square" />
                          </button>
                          <button
                            className="btn btn-link btn-sm text-danger"
                            title="Xóa"
                            onClick={() => setConfirmDel(t)}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="card-footer d-flex justify-content-between align-items-center">
          <span className="text-muted small">
            Trang {currentPage}/{totalPages}
          </span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              « Trước
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Sau »
            </button>
          </div>
        </div>
      </div>

      <TransactionViewModal
        open={!!viewing}
        tx={viewing}
        onClose={() => setViewing(null)}
      />

      <TransactionFormModal
        open={creating}
        mode="create"
        variant={activeTab === TABS.EXTERNAL ? "external" : "internal"}
        onSubmit={handleCreate}
        onClose={() => setCreating(false)}
        onError={(errorMsg) => setToast({ open: true, message: errorMsg })}
      />

      <TransactionFormModal
        open={!!editing}
        mode="edit"
        variant={editing && editing.sourceWallet ? "internal" : "external"}
        initialData={editing}
        onSubmit={handleUpdate}
        onClose={() => setEditing(null)}
        onError={(errorMsg) => setToast({ open: true, message: errorMsg })}
      />

      <ConfirmModal
        open={!!confirmDel}
        title="Xóa giao dịch"
        message={
          confirmDel ? `Bạn chắc chắn muốn xóa giao dịch ${confirmDel.code}?` : ""
        }
        okText="Xóa"
        cancelText="Hủy"
        onOk={handleDelete}
        onClose={() => setConfirmDel(null)}
      />

      <BudgetWarningModal
        open={!!budgetWarning}
        categoryName={budgetWarning?.categoryName}
        budgetLimit={budgetWarning?.budgetLimit || 0}
        spent={budgetWarning?.spent || 0}
        transactionAmount={budgetWarning?.transactionAmount || 0}
        totalAfterTx={budgetWarning?.totalAfterTx || 0}
        isExceeding={budgetWarning?.isExceeding || false}
        onConfirm={handleBudgetWarningConfirm}
        onCancel={handleBudgetWarningCancel}
      />

      <SuccessToast
        open={toast.open}
        message={toast.message}
        duration={2200}
        onClose={() => setToast({ open: false, message: "" })}
      />
    </div>
  );
}