// src/pages/Home/WalletsPage.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useWalletData } from "../../home/store/WalletDataContext";

import WalletList from "../../components/wallets/WalletList";
import WalletDetail from "../../components/wallets/WalletDetail";

import "../../styles/home/WalletsPage.css";

const CURRENCIES = ["VND", "USD"];

// Demo danh mục (sau này lấy từ CategoryDataContext)
const DEMO_CATEGORIES = [
  { id: "cat-food", name: "Ăn uống" },
  { id: "cat-bill", name: "Hóa đơn & Tiện ích" },
  { id: "cat-transfer", name: "Chuyển khoản" },
  { id: "cat-saving", name: "Tiết kiệm" },
];

// Form state helper
const buildWalletForm = (wallet) => ({
  name: wallet?.name || "",
  currency: wallet?.currency || "VND",
  note: wallet?.note || "",
  isDefault: !!wallet?.isDefault,
  sharedEmails: wallet?.sharedEmails || [],
});

// Demo giao dịch cho UI (sau này thay bằng dữ liệu thật)
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


export default function WalletsPage() {
  const walletApi = useWalletData() || {};
  const {
  wallets = [],
  createWallet,
  addWallet,
  updateWallet,
  mergeWallets,
  depositToWallet,
  transferBetweenWallets,
  withdrawFromWallet,
} = walletApi;


  // Phân loại ví
  const personalWallets = useMemo(
    () => wallets.filter((w) => !w.isShared),
    [wallets]
  );
  const groupWallets = useMemo(
    () => wallets.filter((w) => w.isShared),
    [wallets]
  );

  const [activeTab, setActiveTab] = useState("personal"); // 'personal' | 'group'
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default"); // default | name_asc | balance_desc | balance_asc

  // ví đang chọn
  const [selectedId, setSelectedId] = useState(wallets[0]?.id ?? null);
  const selectedWallet =
    wallets.find((w) => w.id === selectedId) || personalWallets[0] || null;

  // TAB chi tiết: view | topup | withdraw | transfer | edit | merge | convert
  const [activeDetailTab, setActiveDetailTab] = useState("view");

  // Tạo ví
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(buildWalletForm());
  const [createShareEnabled, setCreateShareEnabled] = useState(false);
  const [createShareEmail, setCreateShareEmail] = useState("");

  // Sửa ví
  const [editForm, setEditForm] = useState(buildWalletForm(selectedWallet));
  const [editShareEmail, setEditShareEmail] = useState("");

  // Gộp ví
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [mergeCategoryId, setMergeCategoryId] = useState("");

  // Nạp ví
const [topupAmount, setTopupAmount] = useState("");
const [topupNote, setTopupNote] = useState("");
const [topupCategoryId, setTopupCategoryId] = useState("");


  // Rút ví
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawCategoryId, setWithdrawCategoryId] = useState("");

  // Chuyển tiền
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferCategoryId, setTransferCategoryId] = useState("");

  // Khi đổi ví đang chọn → reset form liên quan
  useEffect(() => {
    setEditForm(buildWalletForm(selectedWallet));
    setEditShareEmail("");

    setMergeTargetId("");
    setMergeCategoryId("");

   setTopupAmount("");
setTopupNote("");
setTopupCategoryId("");


    setWithdrawAmount("");
    setWithdrawNote("");
    setWithdrawCategoryId("");

    setTransferTargetId("");
    setTransferAmount("");
    setTransferNote("");
    setTransferCategoryId("");

    setActiveDetailTab("view");
    setShowCreate(false);
  }, [selectedWallet?.id]);

  const totalBalance = useMemo(
    () =>
      wallets.reduce(
        (sum, w) => sum + (Number(w.balance ?? w.current ?? 0) || 0),
        0
      ),
    [wallets]
  );

  const currentList =
    activeTab === "personal" ? personalWallets : groupWallets;

  // filter
  const filteredWallets = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return currentList;
    return currentList.filter((w) => {
      const name = (w.name || "").toLowerCase();
      const note = (w.note || "").toLowerCase();
      return name.includes(kw) || note.includes(kw);
    });
  }, [currentList, search]);

  // sort: ví mặc định luôn đầu
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

  const handleSelectWallet = (id) => {
    setSelectedId(id);
  };

  // ========= CREATE =========
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

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    const payload = {
      ...createForm,
      isShared: false,
      createdAt: new Date().toISOString(),
    };

    const fn = createWallet || addWallet;
    if (!fn) {
      console.warn(
        "Chưa cấu hình createWallet/addWallet trong WalletDataContext."
      );
      return;
    }

    fn(payload);
    setCreateForm(buildWalletForm());
    setCreateShareEmail("");
    setCreateShareEnabled(false);
    setShowCreate(false);
  };

  // ========= EDIT =========
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

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    if (!selectedWallet) return;

    if (!updateWallet) {
      console.warn("Chưa cấu hình updateWallet trong WalletDataContext.");
      return;
    }

    updateWallet(selectedWallet.id, {
      ...selectedWallet,
      ...editForm,
    });
  };

  // ========= CONVERT TO GROUP =========
  const handleConvertToGroup = (e) => {
    e?.preventDefault?.();
    if (!selectedWallet) return;
    if (!updateWallet) {
      console.warn("Chưa cấu hình updateWallet trong WalletDataContext.");
      return;
    }

    updateWallet(selectedWallet.id, {
      ...selectedWallet,
      isShared: true,
    });
  };

  // ========= MERGE =========
  // ========= MERGE =========
const handleSubmitMerge = (e, payload) => {
  e?.preventDefault?.();

  let sourceWalletId;
  let targetWalletId;
  let currencyMode = payload?.currencyMode || "keepTarget";
  let categoryId = payload?.categoryId ?? mergeCategoryId ?? null;

  if (payload && payload.sourceWalletId && payload.targetWalletId) {
    // case mới: MergeTab gửi đầy đủ
    sourceWalletId = payload.sourceWalletId;
    targetWalletId = payload.targetWalletId;
  } else {
    // fallback cũ
    if (!selectedWallet || !mergeTargetId) return;
    sourceWalletId = selectedWallet.id;
    targetWalletId = mergeTargetId;
  }

  if (!sourceWalletId || !targetWalletId || sourceWalletId === targetWalletId)
    return;

  if (mergeWallets) {
    // Đẩy logic gộp sang Context
    mergeWallets({
      sourceWalletId,
      targetWalletId,
      currencyMode,
      categoryId,
    });
  } else {
    // chỉ là demo alert nếu chưa cấu hình
    console.warn("Chưa cấu hình mergeWallets. Demo alert...");
    const src = wallets.find((w) => String(w.id) === String(sourceWalletId));
    const tgt = wallets.find((w) => String(w.id) === String(targetWalletId));
    alert(
      `Demo gộp ví: gộp ví ${src?.name || ""} vào ${tgt?.name || "ví khác"}`
    );
  }

  // Sau khi gộp: chọn ví đích để xem
  setSelectedId(targetWalletId);

  // reset state merge
  setMergeTargetId("");
  setMergeCategoryId("");
};


  // ========= TOPUP =========
  const handleSubmitTopup = (e) => {
    e.preventDefault();
    if (!selectedWallet) return;
    const amountNum = Number(topupAmount);
    if (!amountNum || amountNum <= 0) {
      alert("Số tiền nạp phải lớn hơn 0");
      return;
    }

    if (depositToWallet) {
  depositToWallet(selectedWallet.id, {
    amount: amountNum,
    note: topupNote,
    categoryId: topupCategoryId || null,
  });
} else {
  console.warn("Chưa cấu hình depositToWallet. Demo alert...");
  alert(
    `Demo nạp tiền: +${amountNum.toLocaleString(
      "vi-VN"
    )} ${selectedWallet.currency || "VND"} vào ví ${
      selectedWallet.name || ""
    } (Danh mục: ${
      topupCategoryId || "chưa chọn"
    })`
  );
}

setTopupAmount("");
setTopupNote("");
setTopupCategoryId("");

  };

  // ========= WITHDRAW =========
  const handleSubmitWithdraw = (e) => {
    e.preventDefault();
    if (!selectedWallet) return;
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      alert("Số tiền rút phải lớn hơn 0");
      return;
    }

    if (withdrawFromWallet) {
      withdrawFromWallet(selectedWallet.id, {
        amount: amountNum,
        note: withdrawNote,
        categoryId: withdrawCategoryId || null,
      });
    } else {
      console.warn("Chưa cấu hình withdrawFromWallet. Demo alert...");
      alert(
        `Demo rút tiền: -${amountNum.toLocaleString(
          "vi-VN"
        )} ${selectedWallet.currency || "VND"} từ ví ${
          selectedWallet.name || ""
        }`
      );
    }

    setWithdrawAmount("");
    setWithdrawNote("");
    setWithdrawCategoryId("");
  };

  // ========= TRANSFER =========
  const handleSubmitTransfer = (e) => {
    e.preventDefault();
    if (!selectedWallet || !transferTargetId) return;
    const amountNum = Number(transferAmount);
    if (!amountNum || amountNum <= 0) {
      alert("Số tiền chuyển phải lớn hơn 0");
      return;
    }

    if (transferBetweenWallets) {
      transferBetweenWallets({
        sourceId: selectedWallet.id,
        targetId: transferTargetId,
        amount: amountNum,
        note: transferNote,
        categoryId: transferCategoryId || null,
      });
    } else {
      console.warn("Chưa cấu hình transferBetweenWallets. Demo alert...");
      const target = wallets.find((w) => w.id === transferTargetId);
      alert(
        `Demo chuyển tiền: -${amountNum.toLocaleString("vi-VN")} ${
          selectedWallet.currency || "VND"
        } từ ví ${selectedWallet.name || ""} sang ${
          target?.name || "ví khác"
        }`
      );
    }

    setTransferTargetId("");
    setTransferAmount("");
    setTransferNote("");
    setTransferCategoryId("");
  };

  const demoTransactions = useMemo(
    () => buildDemoTransactions(selectedWallet),
    [selectedWallet]
  );

  return (
    <div className="wallets-page">
      {/* HEADER */}
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

      {/* TỔNG QUAN */}
      <div className="wallets-page__stats">
        <div className="wallets-stat">
          <span className="wallets-stat__label">Tổng số dư</span>
          <span className="wallets-stat__value">
            {totalBalance.toLocaleString("vi-VN")} đ
          </span>
        </div>
        <div className="wallets-stat">
          <span className="wallets-stat__label">Ví cá nhân</span>
          <span className="wallets-stat__value">
            {personalWallets.length}
          </span>
        </div>
        <div className="wallets-stat">
          <span className="wallets-stat__label">Ví nhóm</span>
          <span className="wallets-stat__value">
            {groupWallets.length}
          </span>
        </div>
      </div>

      {/* LAYOUT 2 CỘT */}
      <div className="wallets-layout">
        {/* CỘT TRÁI: DANH SÁCH VÍ */}
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

        {/* CỘT PHẢI: TẠO HOẶC CHI TIẾT */}
        <WalletDetail
          // general
          wallet={selectedWallet}
          currencies={CURRENCIES}
          categories={DEMO_CATEGORIES}
          showCreate={showCreate}
          setShowCreate={setShowCreate}
          activeDetailTab={activeDetailTab}
          setActiveDetailTab={setActiveDetailTab}
          demoTransactions={demoTransactions}
          allWallets={wallets}
          // create
          createForm={createForm}
          onCreateFieldChange={handleCreateFieldChange}
          createShareEnabled={createShareEnabled}
          setCreateShareEnabled={setCreateShareEnabled}
          createShareEmail={createShareEmail}
          setCreateShareEmail={setCreateShareEmail}
          onAddCreateShareEmail={handleAddCreateShareEmail}
          onRemoveCreateShareEmail={handleRemoveCreateShareEmail}
          onSubmitCreate={handleSubmitCreate}
          // edit
          editForm={editForm}
          onEditFieldChange={handleEditFieldChange}
          editShareEmail={editShareEmail}
          setEditShareEmail={setEditShareEmail}
          onAddEditShareEmail={handleAddEditShareEmail}
          onRemoveEditShareEmail={handleRemoveEditShareEmail}
          onSubmitEdit={handleSubmitEdit}
          // merge
          mergeTargetId={mergeTargetId}
          setMergeTargetId={setMergeTargetId}
          mergeCategoryId={mergeCategoryId}
          setMergeCategoryId={setMergeCategoryId}
          onSubmitMerge={handleSubmitMerge}
          // topup
          // topup
topupAmount={topupAmount}
setTopupAmount={setTopupAmount}
topupNote={topupNote}
setTopupNote={setTopupNote}
topupCategoryId={topupCategoryId}
setTopupCategoryId={setTopupCategoryId}
onSubmitTopup={handleSubmitTopup}

          // withdraw
          withdrawAmount={withdrawAmount}
          setWithdrawAmount={setWithdrawAmount}
          withdrawNote={withdrawNote}
          setWithdrawNote={setWithdrawNote}
          withdrawCategoryId={withdrawCategoryId}
          setWithdrawCategoryId={setWithdrawCategoryId}
          onSubmitWithdraw={handleSubmitWithdraw}
          // transfer
          transferTargetId={transferTargetId}
          setTransferTargetId={setTransferTargetId}
          transferAmount={transferAmount}
          setTransferAmount={setTransferAmount}
          transferNote={transferNote}
          setTransferNote={setTransferNote}
          transferCategoryId={transferCategoryId}
          setTransferCategoryId={setTransferCategoryId}
          onSubmitTransfer={handleSubmitTransfer}
          // convert
          onConvertToGroup={handleConvertToGroup}
        />
      </div>
    </div>
  );
}
