// src/pages/Home/WalletsPage.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useWalletData } from "../../home/store/WalletDataContext";

import WalletList from "../../components/wallets/WalletList";
import WalletDetail from "../../components/wallets/WalletDetail";

import { useToast } from "../../components/common/Toast/ToastContext";

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
    deleteWallet,
  } = walletApi;

  const { showToast } = useToast();

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

  // ====== ví đang chọn: MẶC ĐỊNH CHƯA CHỌN VÍ NÀO ======
  const [selectedId, setSelectedId] = useState(null);

  // selectedWallet chỉ hợp lệ khi chọn từ danh sách
  const selectedWallet = useMemo(
    () => wallets.find((w) => w.id === selectedId) || null,
    [wallets, selectedId]
  );

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

    setShowCreate(false);
    setActiveDetailTab("view");
  }, [selectedWallet?.id]);

  // Khi đổi tab (Ví cá nhân / Ví nhóm) mà ví đang chọn không thuộc tab đó → bỏ chọn
  useEffect(() => {
    if (!selectedId) return;
    const w = wallets.find((x) => x.id === selectedId);
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

  // chọn ví từ danh sách
  const handleSelectWallet = (id) => {
    setSelectedId(id);
    setActiveDetailTab("view");
  };

  // callback cho MergeTab / ConvertTab nếu muốn chủ động đổi ví đang chọn
  const handleChangeSelectedWallet = (idOrNull) => {
    setSelectedId(idOrNull);
    setActiveDetailTab("view");
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

  const handleSubmitCreate = async (e) => {
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

    const created = await fn(payload);

    showToast("Tạo ví cá nhân thành công!");

    // nếu API trả về ví mới, chọn luôn ví đó
    if (created?.id) {
      setSelectedId(created.id);
      setActiveDetailTab("view");
    }

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

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!selectedWallet) return;

    if (!updateWallet) {
      console.warn("Chưa cấu hình updateWallet trong WalletDataContext.");
      return;
    }

    await updateWallet(selectedWallet.id, {
      ...selectedWallet,
      ...editForm,
    });

    showToast("Cập nhật thông tin ví thành công!");
  };

  // ========= CONVERT TO GROUP =========
  const handleConvertToGroup = async (e, options) => {
    e?.preventDefault?.();
    if (!selectedWallet) return;
    if (!updateWallet) {
      console.warn("Chưa cấu hình updateWallet trong WalletDataContext.");
      return;
    }

    const isDefault = !!selectedWallet.isDefault;
    const isPersonal = !selectedWallet.isShared;

    // Nếu là ví mặc định & là ví cá nhân, và đã có options từ ConvertTab
    if (isDefault && isPersonal && options) {
      const { newDefaultWalletId, noDefault } = options;

      // 1) Nếu chọn một ví cá nhân khác làm mặc định mới
      if (newDefaultWalletId && !noDefault) {
        await updateWallet(newDefaultWalletId, { isDefault: true });
      }

      // 2) Nếu chọn "tạm thời không có ví mặc định"
      if (noDefault) {
        // Bỏ cờ mặc định khỏi tất cả ví hiện tại
        const currentDefaultList = wallets.filter((w) => w.isDefault);
        for (const w of currentDefaultList) {
          await updateWallet(w.id, { isDefault: false });
        }
      }
    }

    // 3) Chuyển ví hiện tại sang ví nhóm và chắc chắn bỏ cờ mặc định
    await updateWallet(selectedWallet.id, {
      ...selectedWallet,
      isShared: true,
      isDefault: false,
    });

    showToast("Đã chuyển ví sang ví nhóm!");

    // vì ví chuyển sang nhóm → biến mất khỏi tab "Ví cá nhân"
    // => clear selection & tự chuyển sang tab "Ví nhóm"
    setSelectedId(null);
    setActiveTab("group");
    setActiveDetailTab("view");
  };

  // ========= DELETE WALLET =========
  const handleDeleteWallet = async (walletId) => {
    if (!deleteWallet) {
      console.warn("Chưa cấu hình deleteWallet trong WalletDataContext.");
      return;
    }
    await deleteWallet(walletId);
    showToast("Xoá ví thành công!");

    // nếu xoá đúng ví đang xem → bỏ chọn
    if (walletId === selectedId) {
      setSelectedId(null);
      setActiveDetailTab("view");
    }
  };

  // ========= MERGE =========
  const handleSubmitMerge = async (e, options) => {
    e?.preventDefault?.();

    if (options) {
      const {
        sourceWalletId,
        targetWalletId,
        currencyMode = "keepTarget",
        categoryId,
        setTargetAsDefault,
      } = options;

      if (!mergeWallets) {
        console.warn("Chưa cấu hình mergeWallets trong WalletDataContext.");
        return;
      }

      // 1) Gộp ví
      await mergeWallets({
        sourceWalletId,
        targetWalletId,
        currencyMode,
        categoryId: categoryId || null,
      });

      // 2) Nếu user chọn đặt ví đích làm ví mặc định mới
      if (setTargetAsDefault && updateWallet) {
        await updateWallet(targetWalletId, { isDefault: true });
      }

      showToast("Gộp ví thành công (demo)!");

      // 3) Sau khi gộp: ví nguồn biến mất → chọn luôn ví đích
      setSelectedId(targetWalletId);
      setActiveDetailTab("view");
    } else {
      // Fallback nhánh cũ: không truyền options
      if (!selectedWallet || !mergeTargetId) return;
      if (mergeWallets) {
        await mergeWallets({
          sourceWalletId: selectedWallet.id,
          targetWalletId: mergeTargetId,
          currencyMode: "keepTarget",
          categoryId: mergeCategoryId || null,
        });
        showToast("Gộp ví thành công (demo)!");

        setSelectedId(mergeTargetId);
        setActiveDetailTab("view");
      } else {
        console.warn("Chưa cấu hình mergeWallets trong WalletDataContext.");
      }
    }

    setMergeTargetId("");
    setMergeCategoryId("");
  };

  // ========= TOPUP =========
  const handleSubmitTopup = async (e) => {
    e.preventDefault();
    if (!selectedWallet) return;
    const amountNum = Number(topupAmount);
    if (!amountNum || amountNum <= 0) {
      alert("Số tiền nạp phải lớn hơn 0");
      return;
    }

    if (depositToWallet) {
      await depositToWallet(selectedWallet.id, {
        amount: amountNum,
        note: topupNote,
        categoryId: topupCategoryId || null,
      });
      showToast("Nạp ví thành công!");
    } else {
      console.warn("Chưa cấu hình depositToWallet. Demo alert...");
      alert(
        `Demo nạp tiền: +${amountNum.toLocaleString(
          "vi-VN"
        )} ${selectedWallet.currency || "VND"} vào ví ${
          selectedWallet.name || ""
        } (Danh mục: ${topupCategoryId || "chưa chọn"})`
      );
    }

    setTopupAmount("");
    setTopupNote("");
    setTopupCategoryId("");
  };

  // ========= WITHDRAW =========
  const handleSubmitWithdraw = async (e) => {
    e.preventDefault();
    if (!selectedWallet) return;
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      alert("Số tiền rút phải lớn hơn 0");
      return;
    }

    if (withdrawFromWallet) {
      await withdrawFromWallet(selectedWallet.id, {
        amount: amountNum,
        note: withdrawNote,
        categoryId: withdrawCategoryId || null,
      });
      showToast("Rút tiền thành công!");
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
  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    if (!selectedWallet || !transferTargetId) return;
    const amountNum = Number(transferAmount);
    if (!amountNum || amountNum <= 0) {
      alert("Số tiền chuyển phải lớn hơn 0");
      return;
    }

    if (transferBetweenWallets) {
      await transferBetweenWallets({
        sourceId: selectedWallet.id,
        targetId: transferTargetId,
        amount: amountNum,
        note: transferNote,
        categoryId: transferCategoryId || null,
      });
      showToast("Chuyển tiền giữa ví thành công!");
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
          <span className="wallets-stat__value">{personalWallets.length}</span>
        </div>
        <div className="wallets-stat">
          <span className="wallets-stat__label">Ví nhóm</span>
          <span className="wallets-stat__value">{groupWallets.length}</span>
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
          // delete (nếu bạn dùng trong WalletDetail)
          onDeleteWallet={handleDeleteWallet}
          // cho MergeTab / ConvertTab chủ động đổi ví đang chọn
          onChangeSelectedWallet={handleChangeSelectedWallet}
          walletTabType={activeTab}
        />
      </div>
    </div>
  );
}
