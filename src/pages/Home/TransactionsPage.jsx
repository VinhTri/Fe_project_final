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
import { useLanguage } from "../../home/store/LanguageContext";

// ===== GIAO DỊCH NGOÀI – 20 dữ liệu mẫu =====
const MOCK_TRANSACTIONS = [
  {
    id: 1,
    code: "TX-0001",
    type: "expense",
    walletName: "Tiền mặt",
    amount: 50000,
    currency: "VND",
    date: "2025-11-20T12:00",
    category: "Ăn uống",
    note: "Bữa trưa với đồng nghiệp",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 2,
    code: "TX-0002",
    type: "income",
    walletName: "Ngân hàng A",
    amount: 1500000,
    currency: "VND",
    date: "2025-11-19T09:00",
    category: "Lương",
    note: "Lương tháng 11",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 3,
    code: "TX-0003",
    type: "expense",
    walletName: "Momo",
    amount: 120000,
    currency: "VND",
    date: "2025-11-18T18:30",
    category: "Giải trí",
    note: "Xem phim",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 4,
    code: "TX-0004",
    type: "expense",
    walletName: "Tiền mặt",
    amount: 80000,
    currency: "VND",
    date: "2025-11-18T07:45",
    category: "Ăn uống",
    note: "Ăn sáng",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 5,
    code: "TX-0005",
    type: "income",
    walletName: "Ngân hàng B",
    amount: 300000,
    currency: "VND",
    date: "2025-11-17T16:10",
    category: "Thưởng",
    note: "Thưởng dự án",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 6,
    code: "TX-0006",
    type: "expense",
    walletName: "Techcombank",
    amount: 450000,
    currency: "VND",
    date: "2025-11-17T20:05",
    category: "Mua sắm",
    note: "Mua áo khoác",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 7,
    code: "TX-0007",
    type: "expense",
    walletName: "Tiền mặt",
    amount: 30000,
    currency: "VND",
    date: "2025-11-16T10:20",
    category: "Di chuyển",
    note: "Gửi xe",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 8,
    code: "TX-0008",
    type: "income",
    walletName: "Momo",
    amount: 200000,
    currency: "VND",
    date: "2025-11-16T21:00",
    category: "Bán đồ",
    note: "Bán sách cũ",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 9,
    code: "TX-0009",
    type: "expense",
    walletName: "Ngân hàng A",
    amount: 900000,
    currency: "VND",
    date: "2025-11-15T08:30",
    category: "Hóa đơn",
    note: "Thanh toán tiền điện",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 10,
    code: "TX-0010",
    type: "expense",
    walletName: "Ngân hàng B",
    amount: 350000,
    currency: "VND",
    date: "2025-11-15T19:15",
    category: "Ăn uống",
    note: "Đi ăn với gia đình",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 11,
    code: "TX-0011",
    type: "income",
    walletName: "Techcombank",
    amount: 1200000,
    currency: "VND",
    date: "2025-11-14T09:05",
    category: "Lãi tiết kiệm",
    note: "Lãi tháng 11",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 12,
    code: "TX-0012",
    type: "expense",
    walletName: "Momo",
    amount: 60000,
    currency: "VND",
    date: "2025-11-14T13:25",
    category: "Giải trí",
    note: "Mua game",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 13,
    code: "TX-0013",
    type: "expense",
    walletName: "Tiền mặt",
    amount: 40000,
    currency: "VND",
    date: "2025-11-13T07:50",
    category: "Ăn uống",
    note: "Ăn sáng",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 14,
    code: "TX-0014",
    type: "income",
    walletName: "Ngân hàng A",
    amount: 250000,
    currency: "VND",
    date: "2025-11-13T18:40",
    category: "Tiền thưởng",
    note: "Thưởng KPI quý",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 15,
    code: "TX-0015",
    type: "expense",
    walletName: "Techcombank",
    amount: 150000,
    currency: "VND",
    date: "2025-11-12T20:10",
    category: "Mua sắm",
    note: "Mua giày",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 16,
    code: "TX-0016",
    type: "expense",
    walletName: "Tiền mặt",
    amount: 20000,
    currency: "VND",
    date: "2025-11-12T09:15",
    category: "Di chuyển",
    note: "Xe buýt",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 17,
    code: "TX-0017",
    type: "income",
    walletName: "Momo",
    amount: 500000,
    currency: "VND",
    date: "2025-11-11T14:00",
    category: "Bán đồ",
    note: "Bán tai nghe cũ",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 18,
    code: "TX-0018",
    type: "expense",
    walletName: "Ngân hàng B",
    amount: 700000,
    currency: "VND",
    date: "2025-11-11T19:30",
    category: "Hóa đơn",
    note: "Thanh toán tiền nước",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 19,
    code: "TX-0019",
    type: "expense",
    walletName: "Tiền mặt",
    amount: 100000,
    currency: "VND",
    date: "2025-11-10T11:45",
    category: "Giải trí",
    note: "Đi cafe",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 20,
    code: "TX-0020",
    type: "income",
    walletName: "Ngân hàng A",
    amount: 1000000,
    currency: "VND",
    date: "2025-11-10T08:00",
    category: "Lương phụ",
    note: "Làm thêm",
    creatorCode: "USR001",
    attachment: "",
  },
];

// ===== GIAO DỊCH GIỮA CÁC VÍ – 20 dữ liệu mẫu =====
const MOCK_INTERNAL_TRANSFERS = [
  {
    id: 101,
    code: "TR-0101",
    type: "transfer",
    sourceWallet: "Tiền mặt",
    targetWallet: "Techcombank",
    amount: 200000,
    currency: "VND",
    date: "2025-11-20T09:00",
    category: "Chuyển tiền giữa các ví",
    note: "Chuyển tiền tiết kiệm",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 102,
    code: "TR-0102",
    type: "transfer",
    sourceWallet: "Techcombank",
    targetWallet: "Momo",
    amount: 150000,
    currency: "VND",
    date: "2025-11-19T20:10",
    category: "Chuyển tiền giữa các ví",
    note: "Chuyển tiền tiêu vặt",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 103,
    code: "TR-0103",
    type: "transfer",
    sourceWallet: "Ngân hàng A",
    targetWallet: "Tiền mặt",
    amount: 300000,
    currency: "VND",
    date: "2025-11-19T08:30",
    category: "Chuyển tiền giữa các ví",
    note: "Rút tiền mặt",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 104,
    code: "TR-0104",
    type: "transfer",
    sourceWallet: "Techcombank",
    targetWallet: "Ngân hàng B",
    amount: 500000,
    currency: "VND",
    date: "2025-11-18T15:00",
    category: "Chuyển tiền giữa các ví",
    note: "Chuyển tiền trả nợ",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 105,
    code: "TR-0105",
    type: "transfer",
    sourceWallet: "Momo",
    targetWallet: "Tiền mặt",
    amount: 100000,
    currency: "VND",
    date: "2025-11-18T11:20",
    category: "Chuyển tiền giữa các ví",
    note: "Rút tiền từ ví điện tử",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 106,
    code: "TR-0106",
    type: "transfer",
    sourceWallet: "Ngân hàng B",
    targetWallet: "Techcombank",
    amount: 800000,
    currency: "VND",
    date: "2025-11-17T09:30",
    category: "Chuyển tiền giữa các ví",
    note: "Gộp tài khoản",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 107,
    code: "TR-0107",
    type: "transfer",
    sourceWallet: "Tiền mặt",
    targetWallet: "Momo",
    amount: 50000,
    currency: "VND",
    date: "2025-11-17T18:45",
    category: "Chuyển tiền giữa các ví",
    note: "Nạp ví Momo",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 108,
    code: "TR-0108",
    type: "transfer",
    sourceWallet: "Techcombank",
    targetWallet: "Ngân hàng A",
    amount: 2000000,
    currency: "VND",
    date: "2025-11-16T10:15",
    category: "Chuyển tiền giữa các ví",
    note: "Chuyển về tài khoản chính",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 109,
    code: "TR-0109",
    type: "transfer",
    sourceWallet: "Ngân hàng A",
    targetWallet: "Techcombank",
    amount: 400000,
    currency: "VND",
    date: "2025-11-16T21:05",
    category: "Chuyển tiền giữa các ví",
    note: "Đầu tư",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 110,
    code: "TR-0110",
    type: "transfer",
    sourceWallet: "Ngân hàng B",
    targetWallet: "Momo",
    amount: 60000,
    currency: "VND",
    date: "2025-11-15T19:40",
    category: "Chuyển tiền giữa các ví",
    note: "Thanh toán hóa đơn online",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 111,
    code: "TR-0111",
    type: "transfer",
    sourceWallet: "Tiền mặt",
    targetWallet: "Ngân hàng A",
    amount: 250000,
    currency: "VND",
    date: "2025-11-15T08:20",
    category: "Chuyển tiền giữa các ví",
    note: "Nộp vào ngân hàng",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 112,
    code: "TR-0112",
    type: "transfer",
    sourceWallet: "Momo",
    targetWallet: "Ngân hàng A",
    amount: 90000,
    currency: "VND",
    date: "2025-11-14T13:00",
    category: "Chuyển tiền giữa các ví",
    note: "Rút tiền hoàn",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 113,
    code: "TR-0113",
    type: "transfer",
    sourceWallet: "Ngân hàng A",
    targetWallet: "Tiền mặt",
    amount: 150000,
    currency: "VND",
    date: "2025-11-14T09:45",
    category: "Chuyển tiền giữa các ví",
    note: "Tiền đi chơi",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 114,
    code: "TR-0114",
    type: "transfer",
    sourceWallet: "Techcombank",
    targetWallet: "Tiền mặt",
    amount: 100000,
    currency: "VND",
    date: "2025-11-13T18:15",
    category: "Chuyển tiền giữa các ví",
    note: "Rút tiền tiêu",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 115,
    code: "TR-0115",
    type: "transfer",
    sourceWallet: "Ngân hàng B",
    targetWallet: "Techcombank",
    amount: 300000,
    currency: "VND",
    date: "2025-11-13T11:35",
    category: "Chuyển tiền giữa các ví",
    note: "Chuyển khoản chung",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 116,
    code: "TR-0116",
    type: "transfer",
    sourceWallet: "Momo",
    targetWallet: "Ngân hàng B",
    amount: 70000,
    currency: "VND",
    date: "2025-11-12T20:25",
    category: "Chuyển tiền giữa các ví",
    note: "Hoàn tiền về ngân hàng",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 117,
    code: "TR-0117",
    type: "transfer",
    sourceWallet: "Tiền mặt",
    targetWallet: "Momo",
    amount: 40000,
    currency: "VND",
    date: "2025-11-12T09:55",
    category: "Chuyển tiền giữa các ví",
    note: "Nạp ví để thanh toán",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 118,
    code: "TR-0118",
    type: "transfer",
    sourceWallet: "Ngân hàng A",
    targetWallet: "Ngân hàng B",
    amount: 1000000,
    currency: "VND",
    date: "2025-11-11T16:00",
    category: "Chuyển tiền giữa các ví",
    note: "Chia tiền tiết kiệm",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 119,
    code: "TR-0119",
    type: "transfer",
    sourceWallet: "Techcombank",
    targetWallet: "Ngân hàng A",
    amount: 350000,
    currency: "VND",
    date: "2025-11-11T10:20",
    category: "Chuyển tiền giữa các ví",
    note: "Cân bằng tài khoản",
    creatorCode: "USR001",
    attachment: "",
  },
  {
    id: 120,
    code: "TR-0120",
    type: "transfer",
    sourceWallet: "Tiền mặt",
    targetWallet: "Ngân hàng B",
    amount: 220000,
    currency: "VND",
    date: "2025-11-10T14:30",
    category: "Chuyển tiền giữa các ví",
    note: "Gửi tiết kiệm",
    creatorCode: "USR001",
    attachment: "",
  },
];

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
  const { t } = useLanguage();
  // Persist transactions to localStorage so newly-created items survive navigation
  const STORAGE_EXTERNAL = "app_external_transactions_v1";
  const STORAGE_INTERNAL = "app_internal_transfers_v1";

  const readStored = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      console.warn("Failed to read from storage", key, e);
      return fallback;
    }
  };

  const [externalTransactions, setExternalTransactions] =
    useState(() => readStored(STORAGE_EXTERNAL, MOCK_TRANSACTIONS));
  const [internalTransactions, setInternalTransactions] = useState(() =>
    readStored(STORAGE_INTERNAL, MOCK_INTERNAL_TRANSFERS)
  );
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
  const { wallets } = useWalletData();
  
  // Budget warning state
  const [budgetWarning, setBudgetWarning] = useState(null);
  const [pendingTransaction, setPendingTransaction] = useState(null);

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

  const handleCreate = (payload) => {
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
      const tx = {
        id: Date.now(),
        code: nextCode(),
        creatorCode: "USR001",
        attachment: payload.attachment || "",
        ...payload,
      };
      setExternalTransactions((list) => [tx, ...list]);
    } else {
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
    }

    setCreating(false);
    setToast({ open: true, message: t("transactions.toast.add_success") });
    setCurrentPage(1);
  };

  // Handle budget warning confirmation (user wants to continue)
  const handleBudgetWarningConfirm = () => {
    if (!pendingTransaction) return;

    // Create the transaction anyway
    if (activeTab === TABS.EXTERNAL) {
      const tx = {
        id: Date.now(),
        code: nextCode(),
        creatorCode: "USR001",
        attachment: pendingTransaction.attachment || "",
        ...pendingTransaction,
      };
      setExternalTransactions((list) => [tx, ...list]);
    }

    setBudgetWarning(null);
    setPendingTransaction(null);
    setToast({ open: true, message: t("transactions.toast.add_warning_success") });
    setCurrentPage(1);
  };

  // Handle budget warning cancellation
  const handleBudgetWarningCancel = () => {
    setBudgetWarning(null);
    setPendingTransaction(null);
    setCreating(true); // Go back to create form
  };

  const handleUpdate = (payload) => {
    if (!editing) return;
    const isTransfer = !!editing.sourceWallet && !!editing.targetWallet;

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
    } else {
      setExternalTransactions((list) =>
        list.map((t) =>
          t.id === editing.id
            ? { ...t, ...payload, attachment: payload.attachment || t.attachment }
            : t
        )
      );
    }

    setEditing(null);
    setToast({ open: true, message: t("transactions.toast.update_success") });
  };

  const handleDelete = () => {
    if (!confirmDel) return;
    const isTransfer = !!confirmDel.sourceWallet && !!confirmDel.targetWallet;

    if (isTransfer) {
      setInternalTransactions((list) =>
        list.filter((t) => t.id !== confirmDel.id)
      );
    } else {
      setExternalTransactions((list) =>
        list.filter((t) => t.id !== confirmDel.id)
      );
    }

    setConfirmDel(null);
    setToast({ open: true, message: t("transactions.toast.delete_success") });
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

  // Persist lists to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_EXTERNAL, JSON.stringify(externalTransactions));
    } catch (e) {
      console.warn("Failed to persist externalTransactions", e);
    }
  }, [externalTransactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_INTERNAL, JSON.stringify(internalTransactions));
    } catch (e) {
      console.warn("Failed to persist internalTransactions", e);
    }
  }, [internalTransactions]);

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
          background: "linear-gradient(90deg, #0c5776 0%, #2d99ae 100%)",
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
                {t("transactions.page.title")}
              </h2>
              <p className="mb-0" style={{ color: "rgba(255,255,255,0.82)" }}>
                {t("transactions.page.subtitle")}
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
              <option value={TABS.EXTERNAL}>{t("transactions.tab.external")}</option>
              <option value={TABS.INTERNAL}>{t("transactions.tab.internal")}</option>
            </select>

            <button
              className="btn btn-primary tx-add-btn d-flex align-items-center"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => setCreating(true)}
            >
              <i className="bi bi-plus-lg me-2" />
              {t("transactions.btn.add")}
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
                  placeholder={t("transactions.filter.search_placeholder")}
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
                  <option value="all">{t("transactions.filter.type_all")}</option>
                  <option value="income">{t("transactions.type.income")}</option>
                  <option value="expense">{t("transactions.type.expense")}</option>
                </select>
              </div>
            )}

            <div className="tx-filter-item">
              <select
                className="form-select"
                value={filterCategory}
                onChange={handleFilterChange(setFilterCategory)}
              >
                <option value="all">{t("transactions.filter.category_all")}</option>
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
                <option value="all">{t("transactions.filter.wallet_all")}</option>
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
              <span className="text-muted small px-1">{t("transactions.filter.to")}</span>
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
                {t("transactions.filter.clear")}
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
                  <th style={{ width: 60 }}>{t("transactions.table.no")}</th>
                  <th>{t("transactions.table.date")}</th>
                  <th>{t("transactions.table.time")}</th>
                  <th>{t("transactions.table.type")}</th>
                  <th>{t("transactions.table.wallet")}</th>
                  <th>{t("transactions.table.category")}</th>
                  <th className="tx-note-col">{t("transactions.table.note")}</th>
                  <th className="text-end">{t("transactions.table.amount")}</th>
                  <th className="text-center">{t("transactions.table.action")}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-4">
                      {t("transactions.table.empty")}
                    </td>
                  </tr>
                ) : (
                  paginated.map((tx, i) => {
                    const serial = (currentPage - 1) * PAGE_SIZE + i + 1;
                    const d = toDateObj(tx.date);
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
                      <tr key={tx.id}>
                        <td>{serial}</td>
                        <td>{dateStr}</td>
                        <td>{timeStr}</td>
                        <td>{tx.type === "income" ? t("transactions.type.income") : t("transactions.type.expense")}</td>
                        <td>{tx.walletName}</td>
                        <td>{tx.category}</td>
                        <td className="tx-note-cell" title={tx.note || "-"}>
                          {tx.note || "-"}
                        </td>
                        <td className="text-end">
                          <span
                            className={
                              tx.type === "expense"
                                ? "tx-amount-expense"
                                : "tx-amount-income"
                            }
                          >
                            {tx.type === "expense" ? "-" : "+"}
                            {tx.amount.toLocaleString("vi-VN")} {tx.currency}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="dropdown">
                            <button
                              className="btn btn-link btn-sm text-muted p-0"
                              type="button"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              title={t("transactions.action.tooltip")}
                            >
                              <i className="bi bi-three-dots-vertical" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <button
                                  className="dropdown-item"
                                  type="button"
                                  onClick={() => setViewing(tx)}
                                >
                                  <i className="bi bi-eye me-2" /> {t("transactions.action.view")}
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item"
                                  type="button"
                                  onClick={() => setEditing(tx)}
                                >
                                  <i className="bi bi-pencil-square me-2" /> {t("transactions.action.edit")}
                                </button>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button
                                  className="dropdown-item text-danger"
                                  type="button"
                                  onClick={() => setConfirmDel(tx)}
                                >
                                  <i className="bi bi-trash me-2" /> {t("transactions.action.delete")}
                                </button>
                              </li>
                            </ul>
                          </div>
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
                  <th style={{ width: 60 }}>{t("transactions.table.no")}</th>
                  <th>{t("transactions.table.date")}</th>
                  <th>{t("transactions.table.time")}</th>
                  <th>{t("transactions.table.source_wallet")}</th>
                  <th>{t("transactions.table.target_wallet")}</th>
                  <th className="tx-note-col">{t("transactions.table.note")}</th>
                  <th className="text-end">{t("transactions.table.amount")}</th>
                  <th className="text-center">{t("transactions.table.action")}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      {t("transactions.table.empty")}
                    </td>
                  </tr>
                ) : (
                  paginated.map((tx, i) => {
                    const serial = (currentPage - 1) * PAGE_SIZE + i + 1;
                    const d = toDateObj(tx.date);
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
                      <tr key={tx.id}>
                        <td>{serial}</td>
                        <td>{dateStr}</td>
                        <td>{timeStr}</td>
                        <td>{tx.sourceWallet}</td>
                        <td>{tx.targetWallet}</td>
                        <td className="tx-note-cell" title={tx.note || "-"}>
                          {tx.note || "-"}
                        </td>
                        <td className="text-end">
                          <span className="tx-amount-transfer">
                            {tx.amount.toLocaleString("vi-VN")} {tx.currency}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="dropdown">
                            <button
                              className="btn btn-link btn-sm text-muted p-0"
                              type="button"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              title={t("transactions.action.tooltip")}
                            >
                              <i className="bi bi-three-dots-vertical" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <button
                                  className="dropdown-item"
                                  type="button"
                                  onClick={() => setViewing(tx)}
                                >
                                  <i className="bi bi-eye me-2" /> {t("transactions.action.view")}
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item"
                                  type="button"
                                  onClick={() => setEditing(tx)}
                                >
                                  <i className="bi bi-pencil-square me-2" /> {t("transactions.action.edit")}
                                </button>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button
                                  className="dropdown-item text-danger"
                                  type="button"
                                  onClick={() => setConfirmDel(tx)}
                                >
                                  <i className="bi bi-trash me-2" /> {t("transactions.action.delete")}
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            
            
          )}
        </div>

        {/* Mobile card lists (visible only on small screens) */}
        {activeTab === TABS.EXTERNAL && (
          <div className="tx-card-list d-lg-none mt-2">
            {paginated.map((tx, i) => {
              const serial = (currentPage - 1) * PAGE_SIZE + i + 1;
              const d = toDateObj(tx.date);
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
                <div className="tx-card card mb-2" key={tx.id}>
                  <div className="card-body p-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="text-muted small">{dateStr} {timeStr && `· ${timeStr}`}</div>
                        <div className="fw-semibold">{tx.type === "income" ? "Thu" : tx.type === "expense" ? "Chi" : "Chuyển"} • {tx.walletName}</div>
                        <div className="text-muted small">{tx.category}</div>
                      </div>
                      <div className="text-end">
                        <div className={tx.type === "expense" ? "tx-amount-expense" : "tx-amount-income"}>
                          {tx.type === "expense" ? "-" : "+"}{tx.amount.toLocaleString("vi-VN")} {tx.currency}
                        </div>
                        <div className="mt-1">
                          <button className="btn btn-link btn-sm text-muted me-1" onClick={() => setViewing(tx)} title="Xem chi tiết"><i className="bi bi-eye" /></button>
                          <button className="btn btn-link btn-sm text-muted me-1" onClick={() => setEditing(tx)} title="Chỉnh sửa"><i className="bi bi-pencil-square" /></button>
                          <button className="btn btn-link btn-sm text-danger" onClick={() => setConfirmDel(tx)} title="Xóa"><i className="bi bi-trash" /></button>
                        </div>
                      </div>
                    </div>
                    {tx.note && <div className="mt-2 text-muted small">{tx.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === TABS.INTERNAL && (
          <div className="tx-card-list d-lg-none mt-2">
            {paginated.map((tx, i) => {
              const serial = (currentPage - 1) * PAGE_SIZE + i + 1;
              const d = toDateObj(tx.date);
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
                <div className="tx-card card mb-2" key={tx.id}>
                  <div className="card-body p-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="text-muted small">{dateStr} {timeStr && `· ${timeStr}`}</div>
                        <div className="fw-semibold">{tx.sourceWallet} → {tx.targetWallet}</div>
                        <div className="text-muted small">{tx.category}</div>
                      </div>
                      <div className="text-end">
                        <div className="tx-amount-transfer">{tx.amount.toLocaleString("vi-VN")} {tx.currency}</div>
                        <div className="mt-1">
                          <button className="btn btn-link btn-sm text-muted me-1" onClick={() => setViewing(tx)} title="Xem chi tiết"><i className="bi bi-eye" /></button>
                          <button className="btn btn-link btn-sm text-muted me-1" onClick={() => setEditing(tx)} title="Chỉnh sửa"><i className="bi bi-pencil-square" /></button>
                          <button className="btn btn-link btn-sm text-danger" onClick={() => setConfirmDel(tx)} title="Xóa"><i className="bi bi-trash" /></button>
                        </div>
                      </div>
                    </div>
                    {tx.note && <div className="mt-2 text-muted small">{tx.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="card-footer d-flex justify-content-between align-items-center">
          <div className="d-flex gap-2 align-items-center">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(1)}
              title="Trang đầu"
            >
              «
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              title="Trang trước"
            >
              ‹
            </button>
            <span className="text-muted small px-2">
              {totalPages <= 2 ? (
                /* Show all page numbers if <= 2 pages */
                Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`btn btn-link btn-sm p-0 me-1 ${
                      p === currentPage ? "text-primary fw-bold" : "text-muted"
                    }`}
                    onClick={() => handlePageChange(p)}
                    style={{ textDecoration: "none" }}
                  >
                    {p}
                  </button>
                ))
              ) : (
                /* Show 1,2,...last format if > 2 pages */
                <>
                  <button
                    className={`btn btn-link btn-sm p-0 me-1 ${
                      currentPage === 1 ? "text-primary fw-bold" : "text-muted"
                    }`}
                    onClick={() => handlePageChange(1)}
                    style={{ textDecoration: "none" }}
                  >
                    1
                  </button>
                  <button
                    className={`btn btn-link btn-sm p-0 me-1 ${
                      currentPage === 2 ? "text-primary fw-bold" : "text-muted"
                    }`}
                    onClick={() => handlePageChange(2)}
                    style={{ textDecoration: "none" }}
                  >
                    2
                  </button>
                  <span className="text-muted">...</span>
                  <button
                    className={`btn btn-link btn-sm p-0 ms-1 ${
                      currentPage === totalPages ? "text-primary fw-bold" : "text-muted"
                    }`}
                    onClick={() => handlePageChange(totalPages)}
                    style={{ textDecoration: "none" }}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              title="Trang sau"
            >
              ›
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
              title="Trang cuối"
            >
              »
            </button>
          </div>
          <span className="text-muted small">
            {currentPage}/{totalPages}
          </span>
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
      />

      <TransactionFormModal
        open={!!editing}
        mode="edit"
        variant={editing && editing.sourceWallet ? "internal" : "external"}
        initialData={editing}
        onSubmit={handleUpdate}
        onClose={() => setEditing(null)}
      />

      <ConfirmModal
        open={!!confirmDel}
        title={t("transactions.confirm.delete_title")}
        message={
          confirmDel ? t("transactions.confirm.delete_message", { code: confirmDel.code }) : ""
        }
        okText={t("transactions.confirm.delete_ok")}
        cancelText={t("transactions.confirm.delete_cancel")}
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