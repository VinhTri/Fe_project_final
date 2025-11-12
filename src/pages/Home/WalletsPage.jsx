// src/pages/Home/WalletsPage.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { walletService } from "../../services/walletService";
import { transactionService } from "../../services/transactionService";
import { useToast } from "../../contexts/ToastContext";

import WalletCard from "../../components/wallets/WalletCard";
import WalletEditModal from "../../components/wallets/WalletEditModal";
import ConfirmModal from "../../components/common/Modal/ConfirmModal";
import SuccessToast from "../../components/common/Toast/SuccessToast";
import WalletCreateChooser from "../../components/wallets/WalletCreateChooser";
import WalletCreatePersonalModal from "../../components/wallets/WalletCreatePersonalModal";
import WalletCreateGroupModal from "../../components/wallets/WalletCreateGroupModal";

import WalletInspector from "../../components/wallets/WalletInspector";
import useToggleMask from "../../hooks/useToggleMask";
import Loading from "../../components/common/Loading";

import "../../styles/home/WalletsPage.css";

const CURRENCIES = ["VND", "USD", "EUR", "JPY", "GBP"];

/** Bảng màu cho ví mới (theo 2 ảnh bạn gửi) */
const WALLET_COLORS = [
  "#2D99AE",
  
];

/** Chọn màu ít dùng nhất để hạn chế trùng màu liên tiếp */
function pickWalletColor(existing = []) {
  const counts = new Map(WALLET_COLORS.map((c) => [c, 0]));
  for (const w of existing) {
    if (w?.color && counts.has(w.color)) {
      counts.set(w.color, counts.get(w.color) + 1);
    }
  }
  let min = Infinity;
  for (const v of counts.values()) min = Math.min(min, v);
  const candidates = WALLET_COLORS.filter((c) => counts.get(c) === min);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Hook animate mở/đóng bằng max-height + opacity (mượt cả khi đóng) */
function useAutoHeight(isOpen, deps = []) {
  const ref = useRef(null);
  const [maxH, setMaxH] = useState(isOpen ? "none" : "0px");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    let timerId = 0;

    const runOpen = () => {
      const h = el.scrollHeight;
      setMaxH(h + "px");
      timerId = window.setTimeout(() => setMaxH("none"), 400);
    };

    if (isOpen) {
      setMaxH("0px");
      rafId = requestAnimationFrame(runOpen);
    } else {
      const current = getComputedStyle(el).maxHeight;
      if (current === "none") {
        const h = el.scrollHeight;
        setMaxH(h + "px");
        rafId = requestAnimationFrame(() => setMaxH("0px"));
      } else {
        setMaxH("0px");
      }
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ...deps]);

  return {
    ref,
    props: {
      className: "exp-anim",
      style: { maxHeight: maxH },
      "aria-hidden": isOpen ? "false" : "true",
    },
  };
}

const formatMoney = (amount = 0, currency = "VND") => {
  try {
    // ✅ FIX: Dùng locale phù hợp với từng loại tiền
    let locale = "vi-VN"; // Default cho VND
    
    // US Dollar, GBP, etc. dùng en-US format (1,234.56)
    if (["USD", "GBP", "AUD", "CAD", "SGD"].includes(currency)) {
      locale = "en-US";
    }
    // Euro dùng de-DE format (1.234,56)
    else if (["EUR"].includes(currency)) {
      locale = "de-DE";
    }
    // Yen không có thập phân
    else if (["JPY", "KRW"].includes(currency)) {
      locale = "ja-JP";
    }
    
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: ["VND", "JPY", "KRW"].includes(currency) ? 0 : 2,
      minimumFractionDigits: ["VND", "JPY", "KRW"].includes(currency) ? 0 : 2,
    }).format(Number(amount) || 0);
    
    // VND: replace ₫ symbol với VND
    if (currency === "VND") {
      return formatted.replace(/\s?₫/, " VND");
    }
    
    return formatted;
  } catch (error) {
    console.error("Format money error:", error);
    return `${(Number(amount) || 0).toLocaleString()} ${currency}`;
  }
};

export default function WalletsPage() {
  // ✅ USE TOAST HOOK
  const { showToast } = useToast();
  
  // ✅ REPLACE MOCK DATA WITH API STATE
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // ====== "mắt" tổng ======
  const [showTotalAll, toggleTotalAll] = useToggleMask(true);
  const [showTotalPersonal, toggleTotalPersonal] = useToggleMask(true);
  const [showTotalGroup, toggleTotalGroup] = useToggleMask(true);

  // ✅ HELPER: Transform backend wallet data to frontend format
  const transformWallet = (backendWallet, existingWallets = wallets) => {
    const w = backendWallet;
    const existing = existingWallets.find(old => old.id === w.walletId);
    
    return {
      id: w.walletId,
      name: w.walletName,
      currency: w.currencyCode,
      balance: w.balance,
      type: w.type || "CASH",
      note: w.description || "",
      isDefault: w.isDefault || false,
      isShared: w.totalMembers > 1,
      groupId: null,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      myRole: w.myRole || "OWNER",
      ownerId: w.ownerId,
      ownerName: w.ownerName,
      totalMembers: w.totalMembers || 1,
      // Preserve frontend-only flags
      includeOverall: existing?.includeOverall ?? true,
      includePersonal: existing?.includePersonal ?? !w.isShared,
      includeGroup: existing?.includeGroup ?? w.isShared,
      color: existing?.color || w.color || pickWalletColor(existingWallets),
    };
  };

  // ✅ LOAD WALLETS FROM API
  const loadWallets = async () => {
    try {
      setLoading(true);
      setApiError("");
      const response = await walletService.getWallets();
      
      const transformedWallets = (response.wallets || []).map(w => 
        transformWallet(w, wallets)
      );

      setWallets(transformedWallets);
      return transformedWallets; // ✅ Return để có thể dùng ngay
    } catch (error) {
      console.error("❌ Error loading wallets:", error);
      setApiError(error.response?.data?.error || "Không thể tải danh sách ví");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load wallets on mount
  useEffect(() => {
    loadWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== Tạo / chooser ======
  const [showChooser, setShowChooser] = useState(false);
  const [showPersonal, setShowPersonal] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const anchorRef = useRef(null);

  // ====== Modals / toast ======
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "" });

  // ====== Sort ======
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [sortScope, setSortScope] = useState("all");
  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  // ====== Expand 1 phần (personal/group) ======
  const [expandedSection, setExpandedSection] = useState(null); // 'personal' | 'group' | null
  const isPersonalExpanded = expandedSection === "personal";
  const isGroupExpanded = expandedSection === "group";
  const toggleExpand = (key) =>
    setExpandedSection((prev) => (prev === key ? null : key));

  // Inspector (panel phải)
  const [selectedWallet, setSelectedWallet] = useState(null);
  useEffect(() => {
    if (expandedSection === null) setSelectedWallet(null);
  }, [expandedSection]);

  const topRef = useRef(null);
  useEffect(() => {
    if (expandedSection && topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [expandedSection]);

  // [ADDED] Reset scroll mượt khi thu gọn về null
  useEffect(() => {
    if (expandedSection === null) {
      const sc = document.querySelector(".wallet-page");
      if (sc) {
        requestAnimationFrame(() => {
          sc.scrollTo({ top: 0, behavior: "smooth" });
        });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [expandedSection]);

  const personalInspectorRef = useRef(null);
  const groupInspectorRef = useRef(null);
  const focusInspector = (section, delay = 280) => {
    setTimeout(() => {
      const el =
        section === "personal" ? personalInspectorRef.current : groupInspectorRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      el.classList.remove("flash");
      // trigger reflow
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;
      el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 900);
    }, delay);
  };

  // ====== Data helpers ======
  const existingNames = useMemo(
    () => wallets.map((w) => w.name.toLowerCase().trim()),
    [wallets]
  );

  const compareByKey = (a, b, key) => {
    if (key === "name") return (a.name || "").localeCompare(b.name || "");
    if (key === "balance") return Number(a.balance || 0) - Number(b.balance || 0);
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  };
  const sortWith = (arr, key, dir) => {
    const out = [...arr].sort((a, b) => compareByKey(a, b, key));
    return dir === "asc" ? out : out.reverse();
  };
  const sortDefaultDesc = (arr) => sortWith(arr, "createdAt", "desc");

  const personalListRaw = useMemo(
    () => wallets.filter((w) => !w.isShared),
    [wallets]
  );
  const groupListRaw = useMemo(
    () => wallets.filter((w) => w.isShared),
    [wallets]
  );

  const personalWallets = useMemo(() => {
    const list = personalListRaw;
    if (sortScope === "all" || sortScope === "personal")
      return sortWith(list, sortKey, sortDir);
    return sortDefaultDesc(list);
  }, [personalListRaw, sortKey, sortDir, sortScope]);

  const groupWallets = useMemo(() => {
    const list = groupListRaw;
    if (sortScope === "all" || sortScope === "group")
      return sortWith(list, sortKey, sortDir);
    return sortDefaultDesc(list);
  }, [groupListRaw, sortKey, sortDir, sortScope]);

  // ✅ CHỌN LOẠI TIỀN ĐƯỢC DÙNG NHIỀU NHẤT (ƯU TIÊN VND)
  const currencyOfChoice = useMemo(() => {
    if (wallets.length === 0) return "VND";
    
    // Đếm số lượng ví theo từng loại tiền
    const currencyCount = {};
    wallets.forEach(w => {
      const cur = w.currency || "VND";
      currencyCount[cur] = (currencyCount[cur] || 0) + 1;
    });
    
    // ✅ ƯU TIÊN VND NẾU CÓ
    if (currencyCount["VND"] && currencyCount["VND"] > 0) {
      return "VND";
    }
    
    // Nếu không có VND, tìm currency có nhiều ví nhất
    let maxCurrency = "VND";
    let maxCount = 0;
    
    Object.entries(currencyCount).forEach(([currency, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxCurrency = currency;
      }
    });
    
    return maxCurrency;
  }, [wallets]);

  // ✅ HELPER: Convert currency to target currency (tỷ giá cố định)
  const getExchangeRate = (fromCurrency, toCurrency) => {
    if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) return 1;
    
    const RATES = {
      "USD_VND": 24350,
      "EUR_VND": 26315,
      "JPY_VND": 158,
      "GBP_VND": 31250,
      "CNY_VND": 3333,
      "VND_USD": 1 / 24350,
      "VND_EUR": 1 / 26315,
      "VND_JPY": 1 / 158,
      "VND_GBP": 1 / 31250,
      "VND_CNY": 1 / 3333,
      "USD_EUR": 24350 / 26315,
      "EUR_USD": 26315 / 24350,
    };
    
    const key = `${fromCurrency}_${toCurrency}`;
    return RATES[key] || 1;
  };

  // ✅ CONVERT balance sang target currency
  const convertBalance = (balance, fromCurrency, toCurrency) => {
    const rate = getExchangeRate(fromCurrency, toCurrency);
    return (Number(balance) || 0) * rate;
  };

  // ====== Tổng - CONVERT TẤT CẢ VỀ CURRENCY OF CHOICE ======
  const totalAll = useMemo(
    () =>
      wallets
        .filter((w) => w.includeOverall !== false)
        .reduce((sum, w) => {
          const converted = convertBalance(w.balance, w.currency, currencyOfChoice);
          return sum + converted;
        }, 0),
    [wallets, currencyOfChoice]
  );

  const totalPersonal = useMemo(
    () =>
      personalListRaw
        .filter((w) => w.includePersonal !== false)
        .reduce((sum, w) => {
          const converted = convertBalance(w.balance, w.currency, currencyOfChoice);
          return sum + converted;
        }, 0),
    [personalListRaw, currencyOfChoice]
  );

  const totalGroup = useMemo(
    () =>
      groupListRaw
        .filter((w) => w.includeGroup !== false)
        .reduce((sum, w) => {
          const converted = convertBalance(w.balance, w.currency, currencyOfChoice);
          return sum + converted;
        }, 0),
    [groupListRaw, currencyOfChoice]
  );

  // ====== CRUD ======
  const handleAddWalletClick = () => setShowChooser((v) => !v);

  const doDelete = async (w) => {
    try {
    setConfirmDel(null);
      await walletService.deleteWallet(w.id);
    setToast({ open: true, message: `Đã xóa ví "${w.name}"` });
    if (selectedWallet?.id === w.id) setSelectedWallet(null);
      
      // Reload wallets from backend
      await loadWallets();
    } catch (error) {
      console.error("❌ Error deleting wallet:", error);
      
      // ✅ BETTER ERROR HANDLING for foreign key constraint
      let errorMsg = error.response?.data?.error || error.response?.data?.message || "Không thể xóa ví";
      
      // Detect foreign key error
      if (errorMsg.includes("foreign key") || errorMsg.includes("constraint")) {
        errorMsg = `⚠️ Không thể xóa ví vì còn giao dịch liên quan!\n\n` +
                   `Ví "${w.name}" có giao dịch đang tồn tại. ` +
                   `Backend cần xóa tất cả giao dịch trước khi xóa ví.\n\n` +
                   `Vui lòng liên hệ admin hoặc xóa giao dịch thủ công.`;
      }
      
      showToast(errorMsg);
      setToast({ 
        open: true, 
        message: "Xóa ví thất bại - Còn giao dịch liên quan" 
      });
    }
  };

  /** Tạo ví cá nhân */
  const handleCreatePersonal = async (f) => {
    try {
      const payload = {
        walletName: f.name.trim(),
        currencyCode: f.currency,
        initialBalance: Number(f.openingBalance || 0),
        description: f.note?.trim() || "",
        setAsDefault: !!f.isDefault,
      };

      const response = await walletService.createWallet(payload);
      
      setShowPersonal(false);
      setToast({ 
        open: true, 
        message: `Đã tạo ví cá nhân "${response.wallet.walletName}"` 
      });

      // ✅ Reload wallets và tự động select ví vừa tạo
      const newWallets = await loadWallets();
      const newWallet = newWallets.find(w => w.id === response.wallet.walletId);
      
      if (newWallet) {
        setSelectedWallet(newWallet);
        setExpandedSection("personal");
        console.log("✅ New wallet created and selected:", newWallet);
      }
    } catch (error) {
      console.error("❌ Error creating wallet:", error);
      setToast({ 
        open: true, 
        message: error.response?.data?.error || "Không thể tạo ví" 
      });
    }
  };

  /** Sau khi tạo ví nhóm */
  const afterCreateGroupWallet = async (w) => {
    if (!w) return;
    
    const walletName = w.walletName || w.name || "";
    setToast({ open: true, message: `Đã tạo ví nhóm "${walletName}"` });
    
    // ✅ Reload và auto-select ví vừa tạo
    const newWallets = await loadWallets();
    const newWallet = newWallets.find(wallet => 
      wallet.id === (w.walletId || w.id)
    );
    
    if (newWallet) {
      setSelectedWallet(newWallet);
      setExpandedSection("group");
      console.log("✅ New group wallet created and selected:", newWallet);
    }
  };

  const handleSubmitEdit = async (data) => {
    try {
      const payload = {
        walletName: data.name,
        description: data.note || "",
        // Backend chỉ cho phép sửa balance nếu chưa có transaction
        ...(data.balance !== undefined && { balance: data.balance }),
      };

      await walletService.updateWallet(data.id, payload);

      // Nếu set làm default
      if (data.isDefault) {
        await walletService.setDefaultWallet(data.id);
      }

    setEditing(null);
    setToast({ open: true, message: "Cập nhật ví thành công" });
      
      // ✅ Reload wallets và update selected wallet
      const newWallets = await loadWallets();
      
      if (selectedWallet?.id === data.id) {
        const updated = newWallets.find(w => w.id === data.id);
        if (updated) {
          setSelectedWallet(updated);
          console.log("✅ Selected wallet updated after edit:", updated);
        }
      }
    } catch (error) {
      console.error("❌ Error updating wallet:", error);
      setToast({ 
        open: true, 
        message: error.response?.data?.error || "Không thể cập nhật ví" 
      });
    }
  };

  // Inspector actions
  const handleWithdraw = async (wallet, amount) => {
    try {
      // ✅ CREATE EXPENSE TRANSACTION for withdrawal
      await transactionService.createExpense({
        walletId: wallet.id,
        categoryId: 1, // TODO: Get proper category ID for "Rút tiền"
        amount: Number(amount),
        transactionDate: new Date().toISOString(),
        note: "Rút tiền",
      });
      
    setToast({ open: true, message: "Rút tiền thành công" });
      
      // ✅ Reload wallets và update selected wallet
      const newWallets = await loadWallets();
      const updatedWallet = newWallets.find(w => w.id === wallet.id);
      
      if (updatedWallet) {
        setSelectedWallet(updatedWallet);
        console.log("✅ Wallet balance updated:", {
          old: wallet.balance,
          new: updatedWallet.balance,
          withdrawn: amount
        });
      }
    } catch (error) {
      console.error("❌ Error withdrawing:", error);
      setToast({ 
        open: true, 
        message: error.response?.data?.error || "Không thể rút tiền" 
      });
    }
  };

  const handleMerge = async ({ mode, baseWallet, otherWallet }) => {
    if (!otherWallet) return;
    
    try {
      // ✅ USE BACKEND MERGE API
      const sourceWalletId = mode === "this_to_other" ? baseWallet.id : otherWallet.id;
      const targetWalletId = mode === "this_to_other" ? otherWallet.id : baseWallet.id;
      const targetCurrency = mode === "this_to_other" ? otherWallet.currency : baseWallet.currency;

      const result = await walletService.mergeWallets(targetWalletId, sourceWalletId, targetCurrency);
      
      const targetName = mode === "this_to_other" ? otherWallet.name : baseWallet.name;
      const sourceName = mode === "this_to_other" ? baseWallet.name : otherWallet.name;
      
      setToast({
        open: true,
        message: `Đã gộp "${sourceName}" vào "${targetName}"`,
      });
      
      console.log("✅ Merge result:", result);
      
      // ✅ Reload và select target wallet (ví đích sau khi gộp)
      const newWallets = await loadWallets();
      const targetWallet = newWallets.find(w => w.id === targetWalletId);
      
      if (targetWallet) {
        setSelectedWallet(targetWallet);
        console.log("✅ Selected merged wallet:", targetWallet);
    } else {
        setSelectedWallet(null);
      }
    } catch (error) {
      console.error("❌ Error merging wallets:", error);
      setToast({ 
        open: true, 
        message: error.response?.data?.error || "Không thể gộp ví" 
      });
    }
  };

  // ✅ HANDLE TRANSFER MONEY (Inspector tab "Chuyển tiền")
  const handleTransfer = async ({ mode, sourceId, targetId, amount, currencyFrom, currencyTo }) => {
    try {
      console.log("🔄 Transfer request:", { mode, sourceId, targetId, amount, currencyFrom, currencyTo });
      
      // ✅ CALL BACKEND API
      const result = await walletService.transferMoney({
        fromWalletId: sourceId,
        toWalletId: targetId,
        amount: Number(amount),
        categoryId: 1, // TODO: Get proper category for "Chuyển tiền nội bộ"
        note: `Chuyển tiền từ ví ${wallets.find(w => w.id === sourceId)?.name || sourceId} sang ${wallets.find(w => w.id === targetId)?.name || targetId}`,
      });
      
      console.log("✅ Transfer success:", result);
      
      setToast({
        open: true,
        message: `Chuyển tiền thành công: ${formatMoney(amount, currencyFrom)}` 
      });
      
      // ✅ Reload wallets và update selected wallet
      const newWallets = await loadWallets();
      
      // Select target wallet (ví nhận tiền) để user thấy tiền đã vào
      const targetWallet = newWallets.find(w => w.id === targetId);
      if (targetWallet) {
        setSelectedWallet(targetWallet);
        console.log("✅ Selected target wallet after transfer:", targetWallet);
      }
    } catch (error) {
      console.error("❌ Error transferring money:", error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Không thể chuyển tiền";
      
      showToast(`Chuyển tiền thất bại: ${errorMsg}`);
      setToast({ 
        open: true, 
        message: "Chuyển tiền thất bại" 
      });
    }
  };

  const handleConvert = async (wallet, toShared) => {
    try {
      if (toShared) {
        // ✅ CHUYỂN SANG VÍ NHÓM = SHARE VÍ VỚI AI ĐÓ
        const email = prompt(
          `Chuyển "${wallet.name}" thành ví nhóm\n\n` +
          `Nhập email người dùng để chia sẻ ví này:`
        );
        
        if (!email) {
          setToast({ open: true, message: "Đã hủy chuyển đổi" });
          return;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showToast("Email không hợp lệ!");
          return;
        }
        
        // ✅ CALL SHARE API
        await walletService.shareWallet(wallet.id, email);
        
        setToast({ 
          open: true, 
          message: `Đã chia sẻ ví "${wallet.name}" với ${email}` 
        });
        
        // ✅ Reload và update selected wallet
        const newWallets = await loadWallets();
        const updatedWallet = newWallets.find(w => w.id === wallet.id);
        
        if (updatedWallet) {
          setSelectedWallet(updatedWallet);
          console.log("✅ Wallet shared, now is group wallet:", updatedWallet);
        } else {
          setSelectedWallet(null);
        }
      } else {
        // ❌ CHUYỂN TỪ VÍ NHÓM → VÍ CÁ NHÂN: Chỉ có thể LEAVE nếu là MEMBER
        if (wallet.myRole === "MEMBER") {
          const confirm = window.confirm(
            `Rời khỏi ví nhóm "${wallet.name}"?\n\n` +
            `Bạn sẽ không còn quyền truy cập ví này.`
          );
          
          if (!confirm) return;
          
          await walletService.leaveWallet(wallet.id);
          setToast({ open: true, message: `Đã rời khỏi ví "${wallet.name}"` });
          await loadWallets();
          setSelectedWallet(null);
        } else {
          showToast(
            "Không thể chuyển ví nhóm về ví cá nhân. " +
            "Chỉ có thể xóa thành viên khỏi ví (nếu bạn là OWNER) hoặc rời khỏi ví (nếu bạn là MEMBER)."
          );
        }
      }
    } catch (error) {
      console.error("❌ Error converting wallet:", error);
      const errorMsg = error.response?.data?.error || "Không thể chuyển đổi ví";
      showToast(errorMsg);
      setToast({ open: true, message: errorMsg });
    }
  };

  // ====== Toggle trong menu "..." ======
  const handleToggleOverall = async (wallet, nextOn) => {
    // ⚠️ includeOverall là frontend-only flag, không cần update backend
    // Có thể lưu vào localStorage hoặc bỏ qua
    const updatedWallets = wallets.map(w => 
      w.id === wallet.id ? { ...w, includeOverall: !!nextOn } : w
    );
    setWallets(updatedWallets);
    if (selectedWallet?.id === wallet.id) {
      setSelectedWallet({ ...wallet, includeOverall: !!nextOn });
    }
  };

  const handleToggleSection = async (wallet, nextOn) => {
    // ⚠️ includePersonal/includeGroup là frontend-only flags
    const updated = { ...wallet };
    if (wallet.isShared) updated.includeGroup = !!nextOn;
    else updated.includePersonal = !!nextOn;
    
    const updatedWallets = wallets.map(w => 
      w.id === wallet.id ? updated : w
    );
    setWallets(updatedWallets);
    if (selectedWallet?.id === wallet.id) {
      setSelectedWallet(updated);
    }
  };

  // ====== Auto-height containers ======
  const personalExpand = useAutoHeight(isPersonalExpanded, [personalWallets.length]);
  const groupExpand = useAutoHeight(isGroupExpanded, [groupWallets.length]);

  // ====== Click card: mở rộng (trừ vùng tương tác) ======
  const isInteractiveEvent = (e) => {
    const t = e.target;
    return !!t.closest(
      ".dropdown, .dropdown-menu, .wc-dots, button, a, input, textarea, select, label, .form-check"
    );
  };

  // === Quản lý refs của từng thẻ để auto-scroll ===
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const cardRefs = useRef({});
  const setCardRef = (id) => (el) => {
    if (el) cardRefs.current[id] = el;
  };
  const scrollToSelected = (id, delayMs = 0) => {
    const el = id ? cardRefs.current[id] : null;
    if (!el) return;
    const run = () =>
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    delayMs > 0 ? setTimeout(run, delayMs) : run();
  };

  const handleCardClick = (section, wallet) => {
    setSelectedWallet(wallet);
    setSelectedWalletId(wallet.id);

    const willOpenPersonal = section === "personal" && !isPersonalExpanded;
    const willOpenGroup = section === "group" && !isGroupExpanded;
    if (willOpenPersonal) setExpandedSection("personal");
    if (willOpenGroup) setExpandedSection("group");

    const needDelay = willOpenPersonal || willOpenGroup;
    const delay = needDelay ? 480 : 0; // khớp thời gian mở rộng
    scrollToSelected(wallet.id, delay);
    focusInspector(section, needDelay ? 300 : 0);
  };

  const handleCardAreaClick = (section, wallet) => (e) => {
    if (isInteractiveEvent(e)) return;
    handleCardClick(section, wallet);
  };

  // Nếu đã mở rộng mà đổi lựa chọn -> cuộn ngay
  useEffect(() => {
    if (!selectedWalletId) return;
    if (isPersonalExpanded || isGroupExpanded) {
      scrollToSelected(selectedWalletId, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWalletId, isPersonalExpanded, isGroupExpanded]);

  // Helper: đưa ví mặc định lên đầu (không phá thứ tự phần còn lại)
  const defaultFirst = (arr) => {
    const d = [];
    const r = [];
    for (const w of arr) {
      (w?.isDefault ? d : r).push(w);
    }
    return [...d, ...r];
  };

  // Auto-assign colors to wallets without color (frontend-only, not saved to backend)
  useEffect(() => {
    const toPatch = wallets.filter((w) => !w.color);
    if (!toPatch.length) return;
    
    const updatedWallets = wallets.map(w => {
      if (!w.color) {
        return { ...w, color: pickWalletColor(wallets) };
      }
      return w;
    });
    
    setWallets(updatedWallets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount

  // ============ [ADDED] Đồng bộ nền inspector với thẻ ví đã chọn ============
  const [inspectorBg, setInspectorBg] = useState(null);

  useEffect(() => {
    if (!selectedWalletId) {
      setInspectorBg(null);
      return;
    }
    const wrap = cardRefs.current[selectedWalletId];
    const card = wrap?.querySelector?.(".wallet-card");
    if (!card) {
      setInspectorBg(null);
      return;
    }
    const cs = getComputedStyle(card);
    const bgImg =
      cs.backgroundImage && cs.backgroundImage !== "none" ? cs.backgroundImage : null;
    const bg = bgImg || cs.background || null;
    setInspectorBg(bg);
  }, [selectedWalletId]);
  // ========================================================================

  // ===== Render =====
  
  // Show loading state
  if (loading && wallets.length === 0) {
    return (
      <div className="wallet-page container py-4">
        <Loading />
      </div>
    );
  }

  // Show error if API failed
  if (apiError && wallets.length === 0) {
    return (
      <div className="wallet-page container py-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {apiError}
          <button 
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={loadWallets}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page container py-4">
      <div ref={topRef} />

      {/* ===== Header ===== */}
      <div className="wallet-header card border-0 shadow-sm p-3 p-lg-4 mb-2">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <h3 className="wallet-header__title mb-0">
            <i className="bi bi-wallet2 me-2"></i> Danh sách ví
          </h3>

          <div className="wallet-header__controls d-flex align-items-center gap-3 flex-wrap">
            {/* Phạm vi */}
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-layers-half text-light opacity-75"></i>
              <label className="sort-label text-light">Phạm vi:</label>
              <select
                className="form-select form-select-sm sort-select"
                value={sortScope}
                onChange={(e) => setSortScope(e.target.value)}
              >
                <option value="all">Tất cả ví</option>
                <option value="personal">Chỉ ví cá nhân</option>
                <option value="group">Chỉ ví nhóm</option>
              </select>
            </div>

            {/* Sắp xếp */}
            <div className="sort-box d-flex align-items-center gap-2">
              <i className="bi bi-sort-alpha-down text-light opacity-75"></i>
              <label className="sort-label text-light">Sắp xếp theo:</label>
              <select
                className="form-select form-select-sm sort-select"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="balance">Số tiền</option>
                <option value="name">Tên ví</option>
              </select>

              <button
                className="btn btn-sm btn-outline-light sort-dir-btn"
                onClick={toggleSortDir}
              >
                {sortDir === "asc" ? (
                  <>
                    <i className="bi bi-sort-down-alt me-1" /> Tăng
                  </>
                ) : (
                  <>
                    <i className="bi bi-sort-up me-1" /> Giảm
                  </>
                )}
              </button>
            </div>

            {/* Tạo ví mới */}
            <div className="position-relative">
              <button
                ref={anchorRef}
                className="btn btn-sm btn-outline-light sort-dir-btn d-flex align-items-center"
                onClick={handleAddWalletClick}
                aria-expanded={showChooser}
              >
                <i className="bi bi-plus-lg me-2"></i> Tạo ví mới
              </button>
              <WalletCreateChooser
                open={showChooser}
                anchorRef={anchorRef}
                onClose={() => setShowChooser(false)}
                onChoosePersonal={() => {
                  setShowChooser(false);
                  setShowPersonal(true);
                }}
                onChooseGroup={() => {
                  setShowChooser(false);
                  setShowGroup(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Tổng số dư tất cả (ẩn khi đang expand 1 phần) ===== */}
      {expandedSection === null && (
        <section className="mt-2 mb-3">
          <div className="sum-card sum-card--overall">
            <div className="sum-card__title">TỔNG SỐ DƯ</div>
            <div className="sum-card__value">
              {/* ✅ FIX: Dùng formatMoney trực tiếp */}
              {showTotalAll 
                ? formatMoney(totalAll, currencyOfChoice || "VND")
                  : "••••••"
              }
              <i
                role="button"
                tabIndex={0}
                aria-pressed={showTotalAll}
                className={`bi ${showTotalAll ? "bi-eye" : "bi-eye-slash"} money-eye`}
                onClick={toggleTotalAll}
                onKeyDown={(e)=> (e.key==="Enter"||e.key===" ") && (e.preventDefault(), toggleTotalAll())}
              />
            </div>
            <div className="sum-card__desc">Tổng hợp tất cả số dư các ví (chỉ tính ví đang bật).</div>
          </div>
        </section>
      )}

      {/* ===== 2 cột. Mở rộng 1 phần thì phần kia ẩn ===== */}
      <div className="row g-4">
        {/* ========== Ví cá nhân ========== */}
        <div
          className={
            isPersonalExpanded
              ? "col-12"
              : isGroupExpanded
              ? "d-none"
              : "col-12 col-lg-6"
          }
        >
          <section
            className={`wallet-section card border-0 shadow-sm h-100 ${isPersonalExpanded ? "section-expanded" : ""}`}
          >
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0">
                  <i className="bi bi-person-fill me-2"></i>Ví cá nhân
                </h5>
                <button
                  type="button"
                  className="section-toggle"
                  aria-expanded={isPersonalExpanded}
                  onClick={() => toggleExpand("personal")}
                />
              </div>
              <span className="badge bg-light text-dark">
                {personalWallets.length} ví
              </span>
            </div>

            <div className="card-body">
              {/* ==== KHỐI MỞ RỘNG (animation) ==== */}
              <div ref={personalExpand.ref} {...personalExpand.props}>
                <div className="row gx-4">
                  {/* Tổng cá nhân (mini) */}
                  <div className="col-12">
                    <div className="sum-card sum-card--mini sum-card--personal mb-3">
                      <div className="sum-card__title">TỔNG SỐ DƯ (CÁ NHÂN)</div>
                      <div className="sum-card__value">
                        {/* ✅ FIX: Dùng formatMoney trực tiếp */}
                        {showTotalPersonal 
                          ? formatMoney(totalPersonal, currencyOfChoice || "VND")
                            : "••••••"
                        }
                        <i
                          role="button"
                          tabIndex={0}
                          aria-pressed={showTotalPersonal}
                          className={`bi ${showTotalPersonal ? "bi-eye" : "bi-eye-slash"} money-eye`}
                          onClick={toggleTotalPersonal}
                          onKeyDown={(e)=> (e.key==="Enter"||e.key===" ") && (e.preventDefault(), toggleTotalPersonal())}
                        />
                      </div>
                      <div className="sum-card__desc">
                        Tổng hợp số dư của các ví cá nhân đang bật.
                      </div>
                    </div>
                  </div>

                  {/* Bên trái: grid ví (cuộn nếu >6) */}
                  <div className="col-12 col-lg-8">
                    {personalWallets.length === 0 ? (
                      <div className="alert alert-light border rounded-3 mb-0">
                        Chưa có ví nào. Nhấn <strong>Tạo ví mới</strong> để thêm
                        ví đầu tiên.
                      </div>
                    ) : (
                      <div className="wallet-grid wallet-grid--expanded-two wallet-grid--limit-6">
                        {defaultFirst(personalWallets).map((w) => (
                          <div
                            className={`wallet-grid__item ${selectedWalletId === w.id ? "is-selected" : ""}`}
                            key={w.id}
                            ref={setCardRef(w.id)}
                            role="button"
                            tabIndex={0}
                            onClickCapture={handleCardAreaClick("personal", w)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleCardClick("personal", w);
                              }
                            }}
                          >
                            <WalletCard
                              wallet={w}
                              onToggleOverall={handleToggleOverall}
                              onToggleSection={handleToggleSection}
                              onEdit={setEditing}
                              onDelete={setConfirmDel}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bên phải: inspector */}
                  <aside
                    className="col-12 col-lg-4"
                    ref={personalInspectorRef}
                    style={{ "--wi-accent": selectedWallet?.color || "#6C7EE1" }}
                  >
                    <WalletInspector
                      wallet={selectedWallet}
                      wallets={wallets}
                      masked={false}
                      formatMoney={formatMoney}
                      maskMoney={(amount, cur, visible) =>
                        visible ? formatMoney(amount, cur || "VND") : "••••••"
                      }
                      onEdit={setEditing}
                      onDelete={(w) => setConfirmDel(w)}
                      onWithdraw={handleWithdraw}
                      onMerge={handleMerge}
                      onConvert={handleConvert}
                      onTransfer={handleTransfer}
                      onSelectWallet={setSelectedWallet}
                      accent={selectedWallet?.color}
                      heroBg={inspectorBg}
                    />
                  </aside>
                </div>
              </div>

              {/* ==== KHỐI THU GỌN (cuộn nếu >6) ==== */}
              {!isPersonalExpanded && (
                <>
                  {personalWallets.length === 0 ? (
                    <div className="alert alert-light border rounded-3 mb-0 mt-2">
                      Chưa có ví nào. Nhấn <strong>Tạo ví mới</strong> để thêm
                      ví đầu tiên.
                    </div>
                  ) : (
                    <div className="wallet-grid wallet-grid--limit-6 mt-2">
                      {defaultFirst(personalWallets).map((w) => (
                        <div
                          className={`wallet-grid__item ${selectedWalletId === w.id ? "is-selected" : ""}`}
                          key={w.id}
                          ref={setCardRef(w.id)}
                          role="button"
                          tabIndex={0}
                          onClickCapture={handleCardAreaClick("personal", w)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleCardClick("personal", w);
                            }
                          }}
                        >
                          <WalletCard
                            wallet={w}
                            onToggleOverall={handleToggleOverall}
                            onToggleSection={handleToggleSection}
                            onEdit={setEditing}
                            onDelete={setConfirmDel}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        {/* ========== Ví nhóm ========== */}
        <div
          className={
            isGroupExpanded
              ? "col-12"
              : isPersonalExpanded
              ? "d-none"
              : "col-12 col-lg-6"
          }
        >
          <section
            className={`wallet-section card border-0 shadow-sm h-100 ${isGroupExpanded ? "section-expanded" : ""}`}
          >
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0">
                  <i className="bi bi-people-fill me-2"></i>Ví nhóm
                </h5>
                <button
                  type="button"
                  className="section-toggle"
                  aria-expanded={isGroupExpanded}
                  onClick={() => toggleExpand("group")}
                />
              </div>
              <span className="badge bg-light text-dark">
                {groupWallets.length} ví
              </span>
            </div>

            <div className="card-body">
              {/* ==== KHỐI MỞ RỘNG ==== */}
              <div ref={groupExpand.ref} {...groupExpand.props}>
                <div className="row gx-4">
                  {/* Tổng nhóm (mini) */}
                  <div className="col-12">
                    <div className="sum-card sum-card--mini sum-card--group mb-3">
                      <div className="sum-card__title">TỔNG SỐ DƯ (NHÓM)</div>
                      <div className="sum-card__value">
                        {/* ✅ FIX: Dùng formatMoney trực tiếp, KHÔNG replace */}
                        {showTotalGroup 
                          ? formatMoney(totalGroup, currencyOfChoice || "VND")
                            : "••••••"
                        }
                        <i
                          role="button"
                          tabIndex={0}
                          aria-pressed={showTotalGroup}
                          className={`bi ${showTotalGroup ? "bi-eye" : "bi-eye-slash"} money-eye`}
                          onClick={toggleTotalGroup}
                          onKeyDown={(e)=> (e.key==="Enter"||e.key===" ") && (e.preventDefault(), toggleTotalGroup())}
                        />
                      </div>
                      <div className="sum-card__desc">
                        Tổng hợp số dư của các ví nhóm đang bật.
                      </div>
                    </div>
                  </div>

                  {/* Bên trái: grid ví (cuộn nếu >6) */}
                  <div className="col-12 col-lg-8">
                    {groupWallets.length === 0 ? (
                      <div className="alert alert-light border rounded-3 mb-0">
                        Chưa có ví nhóm nào. Chọn <strong>Tạo ví nhóm</strong>{" "}
                        trong menu “Tạo ví mới”.
                      </div>
                    ) : (
                      <div className="wallet-grid wallet-grid--expanded-two wallet-grid--limit-6">
                        {defaultFirst(groupWallets).map((w) => (
                          <div
                            className={`wallet-grid__item ${selectedWalletId === w.id ? "is-selected" : ""}`}
                            key={w.id}
                            ref={setCardRef(w.id)}
                            role="button"
                            tabIndex={0}
                            onClickCapture={handleCardAreaClick("group", w)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleCardClick("group", w);
                              }
                            }}
                          >
                            <WalletCard
                              wallet={w}
                              onToggleOverall={handleToggleOverall}
                              onToggleSection={handleToggleSection}
                              onEdit={setEditing}
                              onDelete={setConfirmDel}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bên phải: inspector */}
                  <aside
                    className="col-12 col-lg-4"
                    ref={groupInspectorRef}
                    style={{ "--wi-accent": selectedWallet?.color || "#6C7EE1" }}
                  >
                    <WalletInspector
                      wallet={selectedWallet}
                      wallets={wallets}
                      masked={false}
                      formatMoney={formatMoney}
                      maskMoney={(amount, cur, visible) =>
                        visible ? formatMoney(amount, cur || "VND") : "••••••"
                      }
                      onEdit={setEditing}
                      onDelete={(w) => setConfirmDel(w)}
                      onWithdraw={handleWithdraw}
                      onMerge={handleMerge}
                      onConvert={handleConvert}
                      onTransfer={handleTransfer}
                      onSelectWallet={setSelectedWallet}
                      accent={selectedWallet?.color}
                      heroBg={inspectorBg}
                    />
                  </aside>
                </div>
              </div>

              {/* ==== KHỐI THU GỌN (cuộn nếu >6) ==== */}
              {!isGroupExpanded && (
                <>
                  {groupWallets.length === 0 ? (
                    <div className="alert alert-light border rounded-3 mb-0 mt-2">
                      Chưa có ví nhóm nào. Chọn <strong>Tạo ví nhóm</strong>{" "}
                      trong menu “Tạo ví mới”.
                    </div>
                  ) : (
                    <div className="wallet-grid wallet-grid--limit-6 mt-2">
                      {defaultFirst(groupWallets).map((w) => (
                        <div
                          className={`wallet-grid__item ${selectedWalletId === w.id ? "is-selected" : ""}`}
                          key={w.id}
                          ref={setCardRef(w.id)}
                          role="button"
                          tabIndex={0}
                          onClickCapture={handleCardAreaClick("group", w)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleCardClick("group", w);
                            }
                          }}
                        >
                          <WalletCard
                            wallet={w}
                            onToggleOverall={handleToggleOverall}
                            onToggleSection={handleToggleSection}
                            onEdit={setEditing}
                            onDelete={setConfirmDel}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ===== Modals ===== */}
      <WalletCreatePersonalModal
        open={showPersonal}
        onClose={() => setShowPersonal(false)}
        currencies={CURRENCIES}
        existingNames={existingNames}
        onSubmit={handleCreatePersonal}
      />
      <WalletCreateGroupModal
        open={showGroup}
        onClose={() => setShowGroup(false)}
        currencies={CURRENCIES}
        onCreated={afterCreateGroupWallet}
      />

      {editing && (
        <WalletEditModal
          wallet={editing}
          currencies={CURRENCIES}
          existingNames={existingNames}
          onClose={() => setEditing(null)}
          onSubmit={handleSubmitEdit}
        />
      )}

      <ConfirmModal
        open={!!confirmDel}
        title="Xóa ví"
        message={confirmDel ? `Xóa ví "${confirmDel.name}"?` : ""}
        okText="Xóa"
        cancelText="Hủy"
        onOk={() => doDelete(confirmDel)}
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
