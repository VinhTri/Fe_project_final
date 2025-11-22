// src/pages/Home/WalletsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import WalletList from "../../components/wallets/WalletList";
import WalletDetail from "../../components/wallets/WalletDetail";
import { useWalletData } from "../../home/store/WalletDataContext";
import { useCategoryData } from "../../home/store/CategoryDataContext";
import { transactionAPI } from "../../services/api-client";
import Toast from "../../components/common/Toast/Toast";

import "../../styles/home/WalletsPage.css";

const CURRENCIES = ["VND", "USD"];

const DEMO_CATEGORIES = [
  { id: "cat-food", name: "Ăn uống" },
  { id: "cat-bill", name: "Hóa đơn & Tiện ích" },
  { id: "cat-transfer", name: "Chuyển khoản" },
  { id: "cat-saving", name: "Tiết kiệm" },
];

const buildWalletForm = (wallet) => ({
  name: wallet?.name || "",
  currency: wallet?.currency || "VND",
  note: wallet?.note || "",
  isDefault: !!wallet?.isDefault,
  sharedEmails: wallet?.sharedEmails || [],
});

const buildDemoTransactions = (wallet) => {
  if (!wallet) return [];
  return [
    {
      id: `${wallet.id}-1`,
      title: `Chi tiêu demo tại siêu thị`,
      amount: -150000,
      timeLabel: "Hôm nay",
      categoryName: "Ăn uống",
    },
    {
      id: `${wallet.id}-2`,
      title: `Nạp tiền demo`,
      amount: 300000,
      timeLabel: "Hôm qua",
      categoryName: "Nạp ví",
    },
    {
      id: `${wallet.id}-3`,
      title: `Chi cafe demo`,
      amount: -45000,
      timeLabel: "2 ngày trước",
      categoryName: "Giải trí",
    },
  ];
};

const getVietnamDateTime = () => {
  const now = new Date();
  const vietnamTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );
  return vietnamTime.toISOString();
};

export default function WalletsPage() {
  const { 
    wallets = [],
    createWallet, 
    updateWallet, 
    deleteWallet,
    transferMoney,
    mergeWallets,
    convertToGroup,
    loadWallets,
    setDefaultWallet,
  } = useWalletData();

  const { expenseCategories = [], incomeCategories = [] } = useCategoryData();

  const incomeCategoryOptions = useMemo(
    () => (incomeCategories.length ? incomeCategories : DEMO_CATEGORIES),
    [incomeCategories]
  );

  const expenseCategoryOptions = useMemo(
    () => (expenseCategories.length ? expenseCategories : DEMO_CATEGORIES),
    [expenseCategories]
  );

  const personalWallets = useMemo(
    () => wallets.filter((w) => !w.isShared),
    [wallets]
  );
  const groupWallets = useMemo(
    () => wallets.filter((w) => w.isShared),
    [wallets]
  );

  const [activeTab, setActiveTab] = useState("personal");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const [selectedId, setSelectedId] = useState(null);
  const selectedWallet = useMemo(
    () =>
      wallets.find((w) => String(w.id) === String(selectedId)) || null,
    [wallets, selectedId]
  );

  const [activeDetailTab, setActiveDetailTab] = useState("view");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(buildWalletForm());
  const [createShareEnabled, setCreateShareEnabled] = useState(false);
  const [createShareEmail, setCreateShareEmail] = useState("");

  const [editForm, setEditForm] = useState(buildWalletForm());
  const [editShareEmail, setEditShareEmail] = useState("");

  const [mergeTargetId, setMergeTargetId] = useState("");

  const [topupAmount, setTopupAmount] = useState("");
  const [topupNote, setTopupNote] = useState("");
  const [topupCategoryId, setTopupCategoryId] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawCategoryId, setWithdrawCategoryId] = useState("");

  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") =>
    setToast({ open: true, message, type });
  const closeToast = () =>
    setToast((prev) => ({ ...prev, open: false }));

  const currentList =
    activeTab === "personal" ? personalWallets : groupWallets;

  const filteredWallets = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return currentList;
    return currentList.filter((w) => {
      const name = (w.name || "").toLowerCase();
      const note = (w.note || "").toLowerCase();
      return name.includes(keyword) || note.includes(keyword);
    });
  }, [currentList, search]);

  const sortedWallets = useMemo(() => {
    const arr = [...filteredWallets];
    arr.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;

      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      const balA = Number(a.balance ?? a.current ?? 0) || 0;
      const balB = Number(b.balance ?? b.current ?? 0) || 0;

      switch (sortBy) {
        case "name_asc":
          return nameA.localeCompare(nameB);
        case "balance_desc":
          return balB - balA;
        case "balance_asc":
          return balA - balB;
        default:
          return 0;
      }
    });
    return arr;
  }, [filteredWallets, sortBy]);

  useEffect(() => {
    setEditForm(buildWalletForm(selectedWallet));
    setEditShareEmail("");
    setMergeTargetId("");
    setTopupAmount("");
    setTopupNote("");
    setTopupCategoryId("");
    setWithdrawAmount("");
    setWithdrawNote("");
    setWithdrawCategoryId("");
    setTransferTargetId("");
    setTransferAmount("");
    setTransferNote("");
    setShowCreate(false);
    setActiveDetailTab("view");
  }, [selectedWallet?.id]);

  useEffect(() => {
    if (!selectedId) return;
    const w = wallets.find((x) => String(x.id) === String(selectedId));
    if (!w) {
      setSelectedId(null);
      return;
    }
    if (activeTab === "personal" && w.isShared) {
      setSelectedId(null);
    }
    if (activeTab === "group" && !w.isShared) {
      setSelectedId(null);
    }
  }, [activeTab, wallets, selectedId]);

  // Helper function để tính tỷ giá
  const getRate = (from, to) => {
    if (!from || !to || from === to) return 1;
    const rates = {
      VND: 1,
      USD: 0.000041, // 1 VND = 0.000041 USD
      EUR: 0.000038,
      JPY: 0.0063,
      GBP: 0.000032,
      CNY: 0.00030,
    };
    if (!rates[from] || !rates[to]) return 1;
    const fromToVND = 1 / rates[from];
    const toToVND = 1 / rates[to];
    return fromToVND / toToVND;
  };

  // Helper function để chuyển đổi số tiền về VND
  const convertToVND = (amount, currency) => {
    const numericAmount = Number(amount) || 0;
    if (!currency || currency === "VND") return numericAmount;
    const rate = getRate(currency, "VND");
    return numericAmount * rate;
  };

  // Helper function để chuyển đổi từ VND sang currency khác
  const convertFromVND = (amountVND, targetCurrency) => {
    const base = Number(amountVND) || 0;
    if (!targetCurrency || targetCurrency === "VND") return base;
    const rate = getRate("VND", targetCurrency);
    const converted = base * rate;
    // Làm tròn theo số chữ số thập phân của currency đích
    const decimals = targetCurrency === "VND" ? 0 : 8;
    return Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // Lấy đơn vị tiền tệ mặc định từ localStorage
  const [displayCurrency, setDisplayCurrency] = useState(() => {
    return localStorage.getItem("defaultCurrency") || "VND";
  });

  // Lắng nghe sự kiện thay đổi currency setting
  useEffect(() => {
    const handleCurrencyChange = (e) => {
      setDisplayCurrency(e.detail.currency);
    };
    window.addEventListener('currencySettingChanged', handleCurrencyChange);
    return () => {
      window.removeEventListener('currencySettingChanged', handleCurrencyChange);
    };
  }, []);

  // Format số tiền
  const formatMoney = (amount = 0, currency = "VND") => {
    const numAmount = Number(amount) || 0;
    if (currency === "USD") {
      if (Math.abs(numAmount) < 0.01 && numAmount !== 0) {
        const formatted = numAmount.toLocaleString("en-US", { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 8 
        });
        return `$${formatted}`;
      }
      const formatted = numAmount % 1 === 0 
        ? numAmount.toLocaleString("en-US")
        : numAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });
      return `$${formatted}`;
    }
    if (currency === "VND") {
      return `${numAmount.toLocaleString("vi-VN")} VND`;
    }
    if (Math.abs(numAmount) < 0.01 && numAmount !== 0) {
      return `${numAmount.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 8 })} ${currency}`;
    }
    return `${numAmount.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 8 })} ${currency}`;
  };

  // Tổng số dư: chuyển đổi tất cả về VND, sau đó quy đổi sang displayCurrency
  const totalBalance = useMemo(
    () => {
      const totalInVND = wallets
        .filter((w) => w.includeOverall !== false)
        .reduce((sum, w) => {
          const balanceInVND = convertToVND(w.balance ?? w.current ?? 0, w.currency || "VND");
          return sum + balanceInVND;
        }, 0);
      // Quy đổi từ VND sang đơn vị tiền tệ hiển thị
      return convertFromVND(totalInVND, displayCurrency);
    },
    [wallets, displayCurrency]
  );

  const handleSelectWallet = (id) => {
    setSelectedId(id);
    setActiveDetailTab("view");
  };

  const handleChangeSelectedWallet = (idOrNull) => {
    setSelectedId(idOrNull);
    setActiveDetailTab("view");
  };

  const handleCreateFieldChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCreateShareEmail = () => {
    const email = createShareEmail.trim();
    if (!email) return;
    setCreateForm((prev) => {
      if (prev.sharedEmails.includes(email)) return prev;
      return { ...prev, sharedEmails: [...prev.sharedEmails, email] };
    });
    setCreateShareEmail("");
  };

  const handleRemoveCreateShareEmail = (email) => {
    setCreateForm((prev) => ({
      ...prev,
      sharedEmails: prev.sharedEmails.filter((e) => e !== email),
    }));
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!createWallet) return;
    try {
      const payload = {
        name: createForm.name.trim(),
        currency: createForm.currency,
        note: createForm.note?.trim() || "",
        isDefault: !!createForm.isDefault,
        isShared: false,
      };
      const created = await createWallet(payload);
      showToast(`Đã tạo ví cá nhân "${created?.name || createForm.name}"`);
      if (created?.id) {
        setSelectedId(created.id);
        setActiveDetailTab("view");
        setActiveTab(created.isShared ? "group" : "personal");
      }
      setCreateForm(buildWalletForm());
      setCreateShareEmail("");
      setCreateShareEnabled(false);
      setShowCreate(false);
    } catch (error) {
      showToast(error.message || "Không thể tạo ví", "error");
    }
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddEditShareEmail = () => {
    const email = editShareEmail.trim();
    if (!email) return;
    setEditForm((prev) => {
      const list = prev.sharedEmails || [];
      if (list.includes(email)) return prev;
      return { ...prev, sharedEmails: [...list, email] };
    });
    setEditShareEmail("");
  };

  const handleRemoveEditShareEmail = (email) => {
    setEditForm((prev) => ({
      ...prev,
      sharedEmails: (prev.sharedEmails || []).filter((e) => e !== email),
    }));
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!selectedWallet || !updateWallet) return;
    try {
      await updateWallet({
        id: selectedWallet.id,
        name: editForm.name.trim(),
        note: editForm.note?.trim() || "",
        currency: editForm.currency,
        isDefault: !!editForm.isDefault,
      });
      showToast("Cập nhật ví thành công");
    } catch (error) {
      showToast(error.message || "Không thể cập nhật ví", "error");
    }
  };

  const handleDeleteWallet = async (walletId) => {
    if (!walletId || !deleteWallet) return;
    try {
      const wallet = wallets.find((w) => Number(w.id) === Number(walletId));
      const walletName = wallet?.name || "ví";
      await deleteWallet(walletId);
      showToast(`Đã xóa ví "${walletName}"`);
      if (String(walletId) === String(selectedId)) {
        setSelectedId(null);
        setActiveDetailTab("view");
      }
    } catch (error) {
      showToast(error.message || "Lỗi kết nối máy chủ", "error");
    }
  };

  const handleSubmitTopup = async (e) => {
    e.preventDefault();
    if (!selectedWallet) return;
    const amountNum = Number(topupAmount);
    if (!amountNum || amountNum <= 0 || !topupCategoryId) {
      return;
    }
    try {
      const response = await transactionAPI.addIncome(
        amountNum,
        getVietnamDateTime(),
        selectedWallet.id,
        Number(topupCategoryId),
        topupNote || "",
        null
      );
      if (response?.transaction) {
        await loadWallets();
        showToast("Nạp tiền thành công. Giao dịch đã được lưu vào lịch sử.");
      } else {
        throw new Error(response?.error || "Không thể tạo giao dịch");
      }
    } catch (error) {
      showToast(error.message || "Không thể nạp tiền", "error");
    } finally {
      setTopupAmount("");
      setTopupNote("");
      setTopupCategoryId("");
    }
  };

  const handleSubmitWithdraw = async (e) => {
    e.preventDefault();
    if (!selectedWallet) return;
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum <= 0 || !withdrawCategoryId) {
      return;
    }
    try {
      const response = await transactionAPI.addExpense(
        amountNum,
        getVietnamDateTime(),
        selectedWallet.id,
        Number(withdrawCategoryId),
        withdrawNote || "",
        null
      );
      if (response?.transaction) {
        await loadWallets();
        showToast("Rút tiền thành công. Giao dịch đã được lưu vào lịch sử.");
      } else {
        throw new Error(response?.error || "Không thể tạo giao dịch");
      }
    } catch (error) {
      showToast(error.message || "Không thể rút tiền", "error");
    } finally {
      setWithdrawAmount("");
      setWithdrawNote("");
      setWithdrawCategoryId("");
    }
  };

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    if (!selectedWallet || !transferTargetId) return;
    const amountNum = Number(transferAmount);
    if (!amountNum || amountNum <= 0) {
      return;
    }
    try {
      await transferMoney({
        sourceId: selectedWallet.id,
        targetId: Number(transferTargetId),
        amount: amountNum,
        note: transferNote || "",
        mode: "this_to_other",
      });
      showToast("Chuyển tiền thành công");
    } catch (error) {
      showToast(error.message || "Không thể chuyển tiền", "error");
    } finally {
      setTransferTargetId("");
      setTransferAmount("");
      setTransferNote("");
    }
  };

  const handleSubmitMerge = async (e, options) => {
    e?.preventDefault?.();
    if (!mergeWallets) return;

    const payload = options || {
      sourceWalletId: selectedWallet?.id,
      targetWalletId: mergeTargetId ? Number(mergeTargetId) : null,
      currencyMode: "keepTarget",
      direction: "this_into_other",
      setTargetAsDefault: false,
    };

    const sourceId = payload?.sourceWalletId;
    const targetId = payload?.targetWalletId;
    if (!sourceId || !targetId) return;

    try {
      const keepCurrency =
        payload.currencyMode === "keepSource" ? "SOURCE" : "TARGET";
      const sourceWallet = wallets.find(
        (w) => Number(w.id) === Number(sourceId)
      );
      const targetWallet = wallets.find(
        (w) => Number(w.id) === Number(targetId)
      );
      const targetCurrency =
        keepCurrency === "SOURCE"
          ? sourceWallet?.currency || targetWallet?.currency || "VND"
          : targetWallet?.currency || sourceWallet?.currency || "VND";

      await mergeWallets({
        sourceId,
        targetId,
        keepCurrency,
        targetCurrency,
      });

      if (payload.setTargetAsDefault && updateWallet) {
        await updateWallet({ id: targetId, isDefault: true });
      }

      showToast("Đã gộp ví thành công");
      setSelectedId(targetId);
      setActiveDetailTab("view");
    } catch (error) {
      showToast(error.message || "Không thể gộp ví", "error");
    } finally {
      setMergeTargetId("");
    }
  };

  const handleConvertToGroup = async (e, options) => {
    e?.preventDefault?.();
    if (!selectedWallet || !convertToGroup) return;
    try {
      if (selectedWallet.isDefault && options) {
        if (options.newDefaultWalletId) {
          await setDefaultWallet?.(options.newDefaultWalletId);
        } else if (options.noDefault) {
          await updateWallet?.({
            id: selectedWallet.id,
            isDefault: false,
          });
        }
      }

      await convertToGroup(selectedWallet.id);
      showToast("Chuyển đổi ví thành nhóm thành công");
      setSelectedId(null);
      setActiveTab("group");
      setActiveDetailTab("view");
    } catch (error) {
      const errorMessage = error.message || "Không thể chuyển ví nhóm về ví cá nhân. Vui lòng xóa các thành viên trước.";
      showToast(errorMessage, "error");
    }
  };

  const demoTransactions = useMemo(
    () => buildDemoTransactions(selectedWallet),
    [selectedWallet]
  );

  return (
    <div className="wallets-page">
      <div className="wallets-page__header">
        <div>
          <h1 className="wallets-page__title">Quản lý ví</h1>
          <p className="wallets-page__subtitle">
            Tạo ví cá nhân, nạp – rút – chuyển, gộp và chia sẻ… tất cả trên một
            màn hình.
          </p>
            </div>
              <button
          className="wallets-btn wallets-btn--primary"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? "Đóng tạo ví" : "Tạo ví cá nhân"}
              </button>
            </div>

      <div className="wallets-page__stats">
        <div className="wallets-stat">
          <span className="wallets-stat__label">Tổng số dư</span>
          <span className="wallets-stat__value">
            {formatMoney(totalBalance, displayCurrency || "VND")}
              </span>
            </div>
        <div className="wallets-stat">
          <span className="wallets-stat__label">Ví cá nhân</span>
          <span className="wallets-stat__value">{personalWallets.length}</span>
                      </div>
        <div className="wallets-stat">
          <span className="wallets-stat__label">Ví nhóm</span>
          <span className="wallets-stat__value">{groupWallets.length}</span>
                    </div>
                  </div>

      <div className="wallets-layout">
        <WalletList
          activeTab={activeTab}
          onTabChange={setActiveTab}
          personalCount={personalWallets.length}
          groupCount={groupWallets.length}
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          wallets={sortedWallets}
          selectedId={selectedId}
          onSelectWallet={handleSelectWallet}
        />

        <WalletDetail
                      wallet={selectedWallet}
          walletTabType={activeTab}
          currencies={CURRENCIES}
          incomeCategories={incomeCategoryOptions}
          expenseCategories={expenseCategoryOptions}
          showCreate={showCreate}
          setShowCreate={setShowCreate}
          activeDetailTab={activeDetailTab}
          setActiveDetailTab={setActiveDetailTab}
          demoTransactions={demoTransactions}
          allWallets={wallets}
          createForm={createForm}
          onCreateFieldChange={handleCreateFieldChange}
          createShareEnabled={createShareEnabled}
          setCreateShareEnabled={setCreateShareEnabled}
          createShareEmail={createShareEmail}
          setCreateShareEmail={setCreateShareEmail}
          onAddCreateShareEmail={handleAddCreateShareEmail}
          onRemoveCreateShareEmail={handleRemoveCreateShareEmail}
          onSubmitCreate={handleSubmitCreate}
          editForm={editForm}
          onEditFieldChange={handleEditFieldChange}
          editShareEmail={editShareEmail}
          setEditShareEmail={setEditShareEmail}
          onAddEditShareEmail={handleAddEditShareEmail}
          onRemoveEditShareEmail={handleRemoveEditShareEmail}
          onSubmitEdit={handleSubmitEdit}
          mergeTargetId={mergeTargetId}
          setMergeTargetId={setMergeTargetId}
          onSubmitMerge={handleSubmitMerge}
          topupAmount={topupAmount}
          setTopupAmount={setTopupAmount}
          topupNote={topupNote}
          setTopupNote={setTopupNote}
          topupCategoryId={topupCategoryId}
          setTopupCategoryId={setTopupCategoryId}
          onSubmitTopup={handleSubmitTopup}
          withdrawAmount={withdrawAmount}
          setWithdrawAmount={setWithdrawAmount}
          withdrawNote={withdrawNote}
          setWithdrawNote={setWithdrawNote}
          withdrawCategoryId={withdrawCategoryId}
          setWithdrawCategoryId={setWithdrawCategoryId}
          onSubmitWithdraw={handleSubmitWithdraw}
          transferTargetId={transferTargetId}
          setTransferTargetId={setTransferTargetId}
          transferAmount={transferAmount}
          setTransferAmount={setTransferAmount}
          transferNote={transferNote}
          setTransferNote={setTransferNote}
          onSubmitTransfer={handleSubmitTransfer}
          onConvertToGroup={handleConvertToGroup}
          onDeleteWallet={handleDeleteWallet}
          onChangeSelectedWallet={handleChangeSelectedWallet}
        />
              </div>

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        duration={2500}
        onClose={closeToast}
      />
    </div>
  );
}

