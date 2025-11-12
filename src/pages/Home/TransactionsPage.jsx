import React, { useMemo, useState, useEffect } from "react";
import { transactionService } from "../../services/transactionService";
import { walletService } from "../../services/walletService";
import { formatMoney } from "../../utils/formatMoney";
import Loading from "../../components/common/Loading";
import "../../styles/home/TransactionsPage.css";
import TransactionViewModal from "../../components/transactions/TransactionViewModal";
import TransactionFormModal from "../../components/transactions/TransactionFormModal";
import ConfirmModal from "../../components/common/Modal/ConfirmModal";
import SuccessToast from "../../components/common/Toast/SuccessToast";

// ===== REMOVED MOCK DATA - NOW USING API =====
/*
const MOCK_TRANSACTIONS = [
  {
    id: 1,
    code: "TX-0001",
    type: "expense",
    walletName: "Tiền mặt",
    amount: 50000,
    currency: "VND",
    date: "2023-10-20T12:00",
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
    date: "2023-10-19T09:00",
    category: "Lương",
    note: "Lương tháng 10",
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
    date: "2023-10-18T18:30",
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
    date: "2023-10-18T07:45",
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
    date: "2023-10-17T16:10",
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
    date: "2023-10-17T20:05",
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
    date: "2023-10-16T10:20",
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
    date: "2023-10-16T21:00",
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
    date: "2023-10-15T08:30",
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
    date: "2023-10-15T19:15",
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
    date: "2023-10-14T09:05",
    category: "Lãi tiết kiệm",
    note: "Lãi tháng 10",
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
    date: "2023-10-14T13:25",
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
    date: "2023-10-13T07:50",
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
    date: "2023-10-13T18:40",
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
    date: "2023-10-12T20:10",
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
    date: "2023-10-12T09:15",
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
    date: "2023-10-11T14:00",
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
    date: "2023-10-11T19:30",
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
    date: "2023-10-10T11:45",
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
    date: "2023-10-10T08:00",
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
    date: "2023-10-20T09:00",
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
    date: "2023-10-19T20:10",
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
    date: "2023-10-19T08:30",
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
    date: "2023-10-18T15:00",
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
    date: "2023-10-18T11:20",
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
    date: "2023-10-17T09:30",
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
    date: "2023-10-17T18:45",
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
    date: "2023-10-16T10:15",
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
    date: "2023-10-16T21:05",
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
    date: "2023-10-15T19:40",
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
    date: "2023-10-15T08:20",
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
    date: "2023-10-14T13:00",
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
    date: "2023-10-14T09:45",
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
    date: "2023-10-13T18:15",
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
    date: "2023-10-13T11:35",
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
    date: "2023-10-12T20:25",
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
    date: "2023-10-12T09:55",
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
    date: "2023-10-11T16:00",
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
    date: "2023-10-11T10:20",
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
    date: "2023-10-10T14:30",
    category: "Chuyển tiền giữa các ví",
    note: "Gửi tiết kiệm",
    creatorCode: "USR001",
    attachment: "",
  },
];
*/

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
  // ✅ REPLACE MOCK DATA WITH API STATE
  const [externalTransactions, setExternalTransactions] = useState([]);
  const [internalTransactions, setInternalTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  
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

  // ⚠️ BACKEND CHƯA CÓ API XEM DANH SÁCH GIAO DỊCH
  // Tính năng TẠO giao dịch vẫn hoạt động bình thường
  // Danh sách giao dịch sẽ hiển thị sau khi backend bổ sung API
  const loadTransactions = async () => {
    try {
      setLoading(true);
      setApiError("");
      
      // ⚠️ Backend API không có endpoint GET /transactions
      // Chỉ có POST /transactions/expense và POST /transactions/income
      console.warn("⚠️ Backend chưa có API để lấy danh sách giao dịch");
      console.warn("📝 Hiện tại chỉ hỗ trợ TẠO giao dịch mới");
      
      // Set empty data với thông báo
      setExternalTransactions([]);
      setInternalTransactions([]);
      setApiError(""); // Clear error vì đây không phải lỗi
    } catch (error) {
      console.error("❌ Error:", error);
      setApiError(error.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    try {
      let result;
      
      if (activeTab === TABS.EXTERNAL) {
        // ✅ CREATE EXPENSE OR INCOME
        if (payload.type === "expense") {
          result = await transactionService.createExpense({
            walletId: payload.walletId,
            categoryId: payload.categoryId,
            amount: payload.amount,
            transactionDate: payload.date,
            note: payload.note || "",
            imageUrl: payload.attachment || "",
          });
        } else {
          result = await transactionService.createIncome({
            walletId: payload.walletId,
            categoryId: payload.categoryId,
            amount: payload.amount,
            transactionDate: payload.date,
            note: payload.note || "",
            imageUrl: payload.attachment || "",
          });
        }
        
        // ✅ ADD TO LOCAL STATE (vì backend chưa có API để fetch)
        if (result.transaction) {
          const newTx = {
            id: result.transaction.transactionId,
            code: `TX-${String(result.transaction.transactionId).padStart(4, "0")}`,
            type: payload.type,
            walletName: result.transaction.wallet?.walletName || "N/A",
            walletId: payload.walletId,
            amount: payload.amount,
            currency: result.transaction.wallet?.currencyCode || "VND",
            date: payload.date,
            category: result.transaction.category?.name || "Khác",
            categoryId: payload.categoryId,
            note: payload.note || "",
            attachment: payload.attachment || "",
          };
          
          setExternalTransactions(prev => [newTx, ...prev]);
        }
      } else {
        // ✅ CREATE TRANSFER (using wallet transfer API)
        result = await walletService.transferMoney({
          fromWalletId: payload.fromWalletId,
          toWalletId: payload.toWalletId,
          amount: payload.amount,
          categoryId: payload.categoryId,
          note: payload.note || "",
        });
        
        // ✅ ADD TO LOCAL STATE
        if (result.transfer) {
          const newTx = {
            id: result.transfer.expenseTransactionId,
            code: `TR-${String(result.transfer.expenseTransactionId).padStart(4, "0")}`,
            type: "transfer",
            sourceWallet: result.transfer.fromWalletName,
            targetWallet: result.transfer.toWalletName,
            fromWalletId: payload.fromWalletId,
            toWalletId: payload.toWalletId,
            amount: payload.amount,
            currency: result.transfer.currencyCode,
            date: result.transfer.transferredAt,
            category: "Chuyển tiền giữa các ví",
            categoryId: payload.categoryId,
            note: payload.note || "",
          };
          
          setInternalTransactions(prev => [newTx, ...prev]);
        }
      }

      setCreating(false);
      setToast({ open: true, message: "✅ Đã tạo giao dịch mới thành công!" });
      setCurrentPage(1);
    } catch (error) {
      console.error("❌ Error creating transaction:", error);
      setToast({ 
        open: true, 
        message: error.response?.data?.error || "Không thể tạo giao dịch" 
      });
    }
  };

  const handleUpdate = async (payload) => {
    if (!editing) return;
    
    try {
      // ✅ UPDATE TRANSACTION VIA API
      const result = await transactionService.updateTransaction(editing.id, {
        amount: payload.amount,
        transactionDate: payload.date,
        categoryId: payload.categoryId,
        note: payload.note || "",
        imageUrl: payload.attachment || "",
      });

      // ✅ UPDATE LOCAL STATE
      if (editing.type === "transfer") {
        setInternalTransactions(prev =>
          prev.map(t =>
            t.id === editing.id
              ? { ...t, amount: payload.amount, date: payload.date, categoryId: payload.categoryId, note: payload.note }
              : t
          )
        );
      } else {
        setExternalTransactions(prev =>
          prev.map(t =>
            t.id === editing.id
              ? { ...t, amount: payload.amount, date: payload.date, categoryId: payload.categoryId, note: payload.note }
              : t
          )
        );
      }

      setEditing(null);
      setToast({ open: true, message: "✅ Đã cập nhật giao dịch." });
    } catch (error) {
      console.error("❌ Error updating transaction:", error);
      setToast({ 
        open: true, 
        message: error.response?.data?.error || "Không thể cập nhật giao dịch" 
      });
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    
    try {
      // ✅ DELETE TRANSACTION VIA API
      await transactionService.deleteTransaction(confirmDel.id);

      // ✅ UPDATE LOCAL STATE
      if (confirmDel.type === "transfer") {
        setInternalTransactions(prev => prev.filter(t => t.id !== confirmDel.id));
      } else {
        setExternalTransactions(prev => prev.filter(t => t.id !== confirmDel.id));
      }

      setConfirmDel(null);
      setToast({ open: true, message: "✅ Đã xóa giao dịch." });
    } catch (error) {
      console.error("❌ Error deleting transaction:", error);
      setToast({ 
        open: true, 
        message: error.response?.data?.error || "Không thể xóa giao dịch" 
      });
    }
  };

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

  // Show loading state
  if (loading && externalTransactions.length === 0 && internalTransactions.length === 0) {
    return (
      <div className="tx-page container py-4">
        <Loading />
      </div>
    );
  }

  // Show error if API failed
  if (apiError && externalTransactions.length === 0 && internalTransactions.length === 0) {
    return (
      <div className="tx-page container py-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {apiError}
          <button 
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={loadTransactions}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

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


      {/* Filters - CHỈ HIỂN THỊ KHI CÓ DATA */}
      {(externalTransactions.length > 0 || internalTransactions.length > 0) && (
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
      )}

      {/* ⚠️ THÔNG BÁO */}
      {externalTransactions.length === 0 && internalTransactions.length === 0 && !loading && (
        <div className="alert alert-info d-flex align-items-start gap-3 mb-3">
          <i className="bi bi-info-circle fs-4 mt-1"></i>
          <div className="flex-grow-1">
            <h6 className="mb-2 fw-semibold">📝 Bắt đầu tạo giao dịch đầu tiên!</h6>
            <div className="mb-2">
              <strong>Cách sử dụng:</strong>
              <ol className="mb-0 ps-3 mt-1">
                <li>Nhấn nút <strong className="text-primary">"Thêm giao dịch mới"</strong> bên trên</li>
                <li>Chọn loại giao dịch: <strong>Giao dịch ngoài</strong> (Thu/Chi) hoặc <strong>Giao dịch giữa các ví</strong> (Chuyển tiền)</li>
                <li>Điền thông tin và nhấn <strong>"Lưu"</strong></li>
              </ol>
            </div>
            <div className="alert alert-warning mb-0 py-2 px-3">
              <small>
                <i className="bi bi-exclamation-triangle me-1"></i>
                <strong>Lưu ý:</strong> Giao dịch được lưu vào backend và cập nhật số dư ví ngay lập tức. 
                Danh sách giao dịch chỉ hiển thị trong phiên làm việc hiện tại (vì backend chưa có API <code>GET /transactions</code>).
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Bảng danh sách - CHỈ HIỂN THỊ KHI CÓ DATA */}
      {(externalTransactions.length > 0 || internalTransactions.length > 0) && (
      <div className="card border-0 shadow-sm tx-table-card">
        <div className="table-responsive">
          {activeTab === TABS.EXTERNAL ? (
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
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
                    <td colSpan={8} className="text-center text-muted py-4">
                      Không có giao dịch nào.
                    </td>
                  </tr>
                ) : (
                  paginated.map((t) => {
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
                            {formatMoney(t.amount, t.currency).replace(/^[^\d-]+/, "")}
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
                    <td colSpan={7} className="text-center text-muted py-4">
                      Không có giao dịch nào.
                    </td>
                  </tr>
                ) : (
                  paginated.map((t) => {
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
                        <td>{dateStr}</td>
                        <td>{timeStr}</td>
                        <td>{t.sourceWallet}</td>
                        <td>{t.targetWallet}</td>
                        <td className="tx-note-cell" title={t.note || "-"}>
                          {t.note || "-"}
                        </td>
                        <td className="text-end">
                          <span className="tx-amount-transfer">
                            {formatMoney(t.amount, t.currency)}
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
      )}

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
        title="Xóa giao dịch"
        message={
          confirmDel ? `Bạn chắc chắn muốn xóa giao dịch ${confirmDel.code}?` : ""
        }
        okText="Xóa"
        cancelText="Hủy"
        onOk={handleDelete}
        onClose={() => setConfirmDel(null)}
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