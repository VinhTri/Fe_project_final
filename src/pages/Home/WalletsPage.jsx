// src/pages/Home/WalletsPage.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useWalletData } from "../../home/store/WalletDataContext";
import "../../styles/home/WalletsPage.css";

const CURRENCIES = ["VND", "USD"];

// Form state helper
const buildWalletForm = (wallet) => ({
  name: wallet?.name || "",
  currency: wallet?.currency || "VND",
  note: wallet?.note || "",
  isDefault: !!wallet?.isDefault,
});

export default function WalletsPage() {
  const walletApi = useWalletData() || {};
  const {
    wallets = [],
    createWallet,
    addWallet,
    updateWallet,
    mergeWallets,
  } = walletApi;

  // Chỉ đọc: phân loại ví
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

  // chọn ví đang xem
  const [selectedId, setSelectedId] = useState(wallets[0]?.id ?? null);
  const selectedWallet =
    wallets.find((w) => w.id === selectedId) || personalWallets[0] || null;

  // TAB trong detail: view | edit | merge | convert | share
  const [activeDetailTab, setActiveDetailTab] = useState("view");

  // form tạo ví cá nhân
  const [createForm, setCreateForm] = useState(buildWalletForm());
  // form sửa ví
  const [editForm, setEditForm] = useState(buildWalletForm(selectedWallet));

  // Merge form: gộp ví hiện tại vào ví đích
  const [mergeTargetId, setMergeTargetId] = useState("");

  // Share form: chọn loại & ví
  const [shareType, setShareType] = useState("personal"); // 'personal' | 'group'
  const [shareWalletId, setShareWalletId] = useState("");

  // Khi đổi selectedWallet thì sync form sửa + reset tab
  useEffect(() => {
    setEditForm(buildWalletForm(selectedWallet));
    setMergeTargetId("");
    setShareWalletId("");
    setActiveDetailTab("view"); // luôn quay về Xem chi tiết
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

  const filteredWallets = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return currentList;
    return currentList.filter((w) => {
      const name = (w.name || "").toLowerCase();
      const note = (w.note || "").toLowerCase();
      return name.includes(kw) || note.includes(kw);
    });
  }, [currentList, search]);

  const handleSelectWallet = (id) => {
    setSelectedId(id);
  };

  // ====== TẠO VÍ CÁ NHÂN ======
  const handleCreateInput = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    const payload = {
      ...createForm,
      isShared: false, // luôn là ví cá nhân
      createdAt: new Date().toISOString(),
    };

    const fn = createWallet || addWallet;
    if (!fn) {
      console.warn(
        "Chưa cấu hình createWallet/addWallet trong WalletDataContext. Hãy nối hàm ở đây."
      );
      return;
    }

    fn(payload);
    setCreateForm(buildWalletForm());
  };

  // ====== SỬA VÍ ======
  const handleEditInput = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    if (!selectedWallet) return;

    if (!updateWallet) {
      console.warn(
        "Chưa cấu hình updateWallet trong WalletDataContext. Hãy nối hàm ở đây."
      );
      return;
    }

    updateWallet(selectedWallet.id, {
      ...selectedWallet,
      ...editForm,
    });
  };

  // ====== CHUYỂN THÀNH VÍ NHÓM ======
  const handleConvertToGroup = (e) => {
    e?.preventDefault?.();
    if (!selectedWallet) return;
    if (!updateWallet) {
      console.warn(
        "Chưa cấu hình updateWallet trong WalletDataContext. Hãy nối hàm ở đây."
      );
      return;
    }

    updateWallet(selectedWallet.id, {
      ...selectedWallet,
      isShared: true,
    });
  };

  // ====== GỘP VÍ ======
  const handleSubmitMerge = (e) => {
    e.preventDefault();
    if (!selectedWallet || !mergeTargetId) return;

    if (!mergeWallets) {
      console.warn(
        "Chưa cấu hình mergeWallets trong WalletDataContext. Ở đây sẽ gọi logic gộp ví."
      );
      return;
    }

    mergeWallets({
      sourceId: selectedWallet.id,
      targetId: mergeTargetId,
    });
  };

  // ====== CHIA SẺ VÍ ======
  const shareList =
    shareType === "personal" ? personalWallets : groupWallets;

  const handleSubmitShare = (e) => {
    e.preventDefault();
    if (!shareWalletId) return;

    const w = wallets.find((x) => x.id === shareWalletId);
    console.log("Share wallet:", shareType, shareWalletId, w);
    alert(
      `Giả lập chia sẻ ví: ${w?.name || "Không rõ"} (${
        shareType === "personal" ? "Ví cá nhân" : "Ví nhóm"
      })`
    );
  };

  return (
    <div className="wallets-page">
      {/* HEADER */}
      <div className="wallets-page__header">
        <div>
          <h1 className="wallets-page__title">Quản lý ví</h1>
          <p className="wallets-page__subtitle">
            Tạo ví cá nhân, chuyển thành ví nhóm, gộp ví và chia sẻ – tất cả
            trên một màn hình.
          </p>
        </div>
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

      {/* KHỐI TẠO VÍ CÁ NHÂN */}
      <div className="wallets-section wallets-section--inline">
        <div className="wallets-section__header">
          <h3>Tạo ví cá nhân</h3>
          <span>Chỉ gồm tên, tiền tệ, ghi chú và ví mặc định.</span>
        </div>
        <form
          className="wallet-form"
          onSubmit={handleSubmitCreate}
          autoComplete="off"
        >
          <div className="wallet-form__row">
            <label>
              Tên ví
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) =>
                  handleCreateInput("name", e.target.value)
                }
                placeholder="Ví tiền mặt, Ví ngân hàng..."
              />
            </label>
            <label>
              Tiền tệ
              <select
                value={createForm.currency}
                onChange={(e) =>
                  handleCreateInput("currency", e.target.value)
                }
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="wallet-form__row">
            <label className="wallet-form__full">
              Ghi chú
              <textarea
                rows={2}
                value={createForm.note}
                onChange={(e) =>
                  handleCreateInput("note", e.target.value)
                }
                placeholder="Mục đích sử dụng ví này..."
              />
            </label>
          </div>

          <div className="wallet-form__footer">
            <label className="wallet-form__checkbox">
              <input
                type="checkbox"
                checked={createForm.isDefault}
                onChange={(e) =>
                  handleCreateInput("isDefault", e.target.checked)
                }
              />
              <span>Đặt làm ví mặc định</span>
            </label>
            <div className="wallet-form__actions">
              <button
                type="submit"
                className="wallets-btn wallets-btn--primary"
              >
                Lưu ví cá nhân
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* LAYOUT 2 CỘT */}
      <div className="wallets-layout">
        {/* CỘT DANH SÁCH */}
        <div className="wallets-list-panel">
          <div className="wallets-list-panel__tabs">
            <button
              className={
                activeTab === "personal"
                  ? "wallets-tab wallets-tab--active"
                  : "wallets-tab"
              }
              onClick={() => setActiveTab("personal")}
            >
              Ví cá nhân
              {personalWallets.length > 0 && (
                <span className="wallets-tab__badge">
                  {personalWallets.length}
                </span>
              )}
            </button>
            <button
              className={
                activeTab === "group"
                  ? "wallets-tab wallets-tab--active"
                  : "wallets-tab"
              }
              onClick={() => setActiveTab("group")}
            >
              Ví nhóm
              {groupWallets.length > 0 && (
                <span className="wallets-tab__badge">
                  {groupWallets.length}
                </span>
              )}
            </button>
          </div>

          <div className="wallets-list-panel__search">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc ghi chú ví…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="wallets-list-panel__list">
            {filteredWallets.length === 0 && (
              <div className="wallets-list__empty">
                Không có ví nào trong mục này.
              </div>
            )}

            {filteredWallets.map((w) => {
              const isActive = selectedWallet && selectedWallet.id === w.id;
              const balance = Number(w.balance ?? w.current ?? 0) || 0;
              return (
                <button
                  key={w.id}
                  className={
                    isActive
                      ? "wallets-list-item wallets-list-item--active"
                      : "wallets-list-item"
                  }
                  onClick={() => handleSelectWallet(w.id)}
                >
                  <div className="wallets-list-item__header">
                    <span className="wallets-list-item__name">
                      {w.name || "Chưa đặt tên"}
                    </span>
                    <span className="wallets-list-item__type">
                      {w.isShared ? "Nhóm" : "Cá nhân"}
                    </span>
                  </div>
                  <div className="wallets-list-item__balance">
                    {balance.toLocaleString("vi-VN")} {w.currency || "VND"}
                  </div>
                  {w.note && (
                    <div className="wallets-list-item__desc">
                      {w.note}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CỘT CHI TIẾT */}
        <div className="wallets-detail-panel">
          {!selectedWallet ? (
            <div className="wallets-detail__empty">
              <h3>Chưa chọn ví</h3>
              <p>Chọn một ví ở danh sách bên trái để xem chi tiết.</p>
            </div>
          ) : (
            <>
              {/* HEADER có nền riêng */}
              <div className="wallets-detail__header">
                <div>
                  <h2 className="wallets-detail__name">
                    {selectedWallet.name || "Chưa đặt tên"}
                  </h2>
                  <div className="wallets-detail__tags">
                    <span className="wallet-tag">
                      {selectedWallet.isShared ? "Ví nhóm" : "Ví cá nhân"}
                    </span>
                    {selectedWallet.isDefault && (
                      <span className="wallet-tag wallet-tag--outline">
                        Ví mặc định
                      </span>
                    )}
                  </div>
                </div>
                <div className="wallets-detail__balance">
                  <div className="wallets-detail__balance-label">
                    Số dư (demo)
                  </div>
                  <div className="wallets-detail__balance-value">
                    {(
                      Number(
                        selectedWallet.balance ?? selectedWallet.current ?? 0
                      ) || 0
                    ).toLocaleString("vi-VN")}{" "}
                    {selectedWallet.currency || "VND"}
                  </div>
                </div>
              </div>

              {/* THANH CHUYỂN ĐỔI */}
              <div className="wallets-detail__tabs">
                <button
                  className={
                    activeDetailTab === "view"
                      ? "wallets-detail-tab wallets-detail-tab--active"
                      : "wallets-detail-tab"
                  }
                  onClick={() => setActiveDetailTab("view")}
                >
                  Xem chi tiết
                </button>
                <button
                  className={
                    activeDetailTab === "edit"
                      ? "wallets-detail-tab wallets-detail-tab--active"
                      : "wallets-detail-tab"
                  }
                  onClick={() => setActiveDetailTab("edit")}
                >
                  Sửa ví
                </button>
                <button
                  className={
                    activeDetailTab === "merge"
                      ? "wallets-detail-tab wallets-detail-tab--active"
                      : "wallets-detail-tab"
                  }
                  onClick={() => setActiveDetailTab("merge")}
                >
                  Gộp ví
                </button>
                <button
                  className={
                    activeDetailTab === "convert"
                      ? "wallets-detail-tab wallets-detail-tab--active"
                      : "wallets-detail-tab"
                  }
                  onClick={() => setActiveDetailTab("convert")}
                >
                  Chuyển thành ví nhóm
                </button>
                <button
                  className={
                    activeDetailTab === "share"
                      ? "wallets-detail-tab wallets-detail-tab--active"
                      : "wallets-detail-tab"
                  }
                  onClick={() => setActiveDetailTab("share")}
                >
                  Chia sẻ ví
                </button>
              </div>

              {/* NỘI DUNG THEO TỪNG TAB */}

              {/* 1. XEM CHI TIẾT */}
              {activeDetailTab === "view" && (
                <div className="wallets-section">
                  <div className="wallets-section__header">
                    <h3>Chi tiết ví</h3>
                    <span>Thông tin cơ bản của ví hiện tại.</span>
                  </div>
                  <div className="wallet-detail-grid">
                    <div className="wallet-detail-item">
                      <span className="wallet-detail-item__label">
                        Loại ví
                      </span>
                      <span className="wallet-detail-item__value">
                        {selectedWallet.isShared ? "Ví nhóm" : "Ví cá nhân"}
                      </span>
                    </div>
                    <div className="wallet-detail-item">
                      <span className="wallet-detail-item__label">
                        Tiền tệ
                      </span>
                      <span className="wallet-detail-item__value">
                        {selectedWallet.currency || "VND"}
                      </span>
                    </div>
                    <div className="wallet-detail-item">
                      <span className="wallet-detail-item__label">
                        Ngày tạo
                      </span>
                      <span className="wallet-detail-item__value">
                        {selectedWallet.createdAt
                          ? new Date(
                              selectedWallet.createdAt
                            ).toLocaleDateString("vi-VN")
                          : "—"}
                      </span>
                    </div>
                    <div className="wallet-detail-item wallet-detail-item--full">
                      <span className="wallet-detail-item__label">
                        Ghi chú
                      </span>
                      <span className="wallet-detail-item__value">
                        {selectedWallet.note || "Chưa có ghi chú."}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SỬA VÍ */}
              {activeDetailTab === "edit" && (
                <div className="wallets-section">
                  <div className="wallets-section__header">
                    <h3>Sửa ví</h3>
                    <span>Chỉnh sửa giống như khi tạo ví cá nhân.</span>
                  </div>
                  <form
                    className="wallet-form"
                    onSubmit={handleSubmitEdit}
                    autoComplete="off"
                  >
                    <div className="wallet-form__row">
                      <label>
                        Tên ví
                        <input
                          type="text"
                          required
                          value={editForm.name}
                          onChange={(e) =>
                            handleEditInput("name", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Tiền tệ
                        <select
                          value={editForm.currency}
                          onChange={(e) =>
                            handleEditInput("currency", e.target.value)
                          }
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="wallet-form__row">
                      <label className="wallet-form__full">
                        Ghi chú
                        <textarea
                          rows={2}
                          value={editForm.note}
                          onChange={(e) =>
                            handleEditInput("note", e.target.value)
                          }
                        />
                      </label>
                    </div>

                    <div className="wallet-form__footer wallet-form__footer--right">
                      <label className="wallet-form__checkbox">
                        <input
                          type="checkbox"
                          checked={editForm.isDefault}
                          onChange={(e) =>
                            handleEditInput("isDefault", e.target.checked)
                          }
                        />
                        <span>Đặt làm ví mặc định</span>
                      </label>
                      <div className="wallet-form__actions">
                        <button
                          type="submit"
                          className="wallets-btn wallets-btn--primary"
                        >
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* 3. GỘP VÍ */}
              {activeDetailTab === "merge" && (
                <div className="wallets-section">
                  <div className="wallets-section__header">
                    <h3>Gộp ví</h3>
                    <span>
                      Gộp ví hiện tại vào một ví khác. Sau khi gộp, ví nguồn
                      sẽ được xử lý theo logic bạn định nghĩa.
                    </span>
                  </div>
                  <form
                    className="wallet-form"
                    onSubmit={handleSubmitMerge}
                  >
                    <div className="wallet-form__row">
                      <label className="wallet-form__full">
                        Chọn ví đích
                        <select
                          value={mergeTargetId}
                          onChange={(e) =>
                            setMergeTargetId(e.target.value)
                          }
                        >
                          <option value="">-- Chọn ví đích --</option>
                          {wallets
                            .filter((w) => w.id !== selectedWallet.id)
                            .map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name || "Chưa đặt tên"}{" "}
                                {w.isShared ? "(Nhóm)" : "(Cá nhân)"}
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>
                    <div className="wallet-form__footer wallet-form__footer--right">
                      <button
                        type="submit"
                        className="wallets-btn wallets-btn--primary"
                        disabled={!mergeTargetId}
                      >
                        Xác nhận gộp ví
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 4. CHUYỂN THÀNH VÍ NHÓM */}
              {activeDetailTab === "convert" && (
                <div className="wallets-section">
                  <div className="wallets-section__header">
                    <h3>Chuyển thành ví nhóm</h3>
                    <span>
                      Sau khi chuyển, ví này sẽ trở thành ví nhóm (isShared =
                      true). Bạn có thể thêm thành viên ở tính năng sau.
                    </span>
                  </div>
                  <form
                    className="wallet-form"
                    onSubmit={handleConvertToGroup}
                  >
                    <div className="wallet-form__row">
                      <div className="wallet-form__full">
                        <p style={{ fontSize: 13, color: "#444" }}>
                          Tên ví: <strong>{selectedWallet.name}</strong>
                          <br />
                          Trạng thái:{" "}
                          {selectedWallet.isShared
                            ? "Đã là ví nhóm"
                            : "Hiện là ví cá nhân"}
                        </p>
                      </div>
                    </div>
                    <div className="wallet-form__footer wallet-form__footer--right">
                      <button
                        type="submit"
                        className="wallets-btn wallets-btn--primary"
                        disabled={selectedWallet.isShared}
                      >
                        {selectedWallet.isShared
                          ? "Đã là ví nhóm"
                          : "Chuyển sang ví nhóm"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 5. CHIA SẺ VÍ */}
              {activeDetailTab === "share" && (
                <div className="wallets-section">
                  <div className="wallets-section__header">
                    <h3>Chia sẻ ví</h3>
                    <span>
                      Chọn loại ví (cá nhân / nhóm) và chọn tên ví muốn chia
                      sẻ. Sau này sẽ gắn API / logic mời thành viên.
                    </span>
                  </div>
                  <form
                    className="wallet-form"
                    onSubmit={handleSubmitShare}
                  >
                    <div className="wallet-form__row">
                      <div className="wallet-form__radio-group">
                        <label>
                          <input
                            type="radio"
                            name="shareType"
                            value="personal"
                            checked={shareType === "personal"}
                            onChange={() => {
                              setShareType("personal");
                              setShareWalletId("");
                            }}
                          />
                          <span>Ví cá nhân</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="shareType"
                            value="group"
                            checked={shareType === "group"}
                            onChange={() => {
                              setShareType("group");
                              setShareWalletId("");
                            }}
                          />
                          <span>Ví nhóm</span>
                        </label>
                      </div>
                    </div>
                    <div className="wallet-form__row">
                      <label className="wallet-form__full">
                        Chọn ví muốn chia sẻ
                        <select
                          value={shareWalletId}
                          onChange={(e) =>
                            setShareWalletId(e.target.value)
                          }
                        >
                          <option value="">-- Chọn ví --</option>
                          {shareList.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name || "Chưa đặt tên"}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="wallet-form__footer wallet-form__footer--right">
                      <button
                        type="submit"
                        className="wallets-btn wallets-btn--primary"
                        disabled={!shareWalletId}
                      >
                        Xác nhận chia sẻ
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
