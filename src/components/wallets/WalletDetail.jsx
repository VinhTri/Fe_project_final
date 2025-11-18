// src/components/wallets/WalletDetail.jsx
import React, { useState, useEffect } from "react";

export default function WalletDetail(props) {
  const {
    wallet,

    currencies,
    categories,
    showCreate,
    setShowCreate,
    activeDetailTab,
    setActiveDetailTab,
    demoTransactions,
    allWallets,
    topupCategoryId,
    setTopupCategoryId,

    // create
    createForm,
    onCreateFieldChange,
    createShareEnabled,
    setCreateShareEnabled,
    createShareEmail,
    setCreateShareEmail,
    onAddCreateShareEmail,
    onRemoveCreateShareEmail,
    onSubmitCreate,

    // edit
    editForm,
    onEditFieldChange,
    editShareEmail,
    setEditShareEmail,
    onAddEditShareEmail,
    onRemoveEditShareEmail,
    onSubmitEdit,

    // merge
    mergeTargetId,
    setMergeTargetId,
    mergeCategoryId,
    setMergeCategoryId,
    onSubmitMerge,

    // topup
    topupAmount,
    setTopupAmount,
    topupNote,
    setTopupNote,
    onSubmitTopup,

    // withdraw
    withdrawAmount,
    setWithdrawAmount,
    withdrawNote,
    setWithdrawNote,
    withdrawCategoryId,
    setWithdrawCategoryId,
    onSubmitWithdraw,

    // transfer
    transferTargetId,
    setTransferTargetId,
    transferAmount,
    setTransferAmount,
    transferNote,
    setTransferNote,
    transferCategoryId,
    setTransferCategoryId,
    onSubmitTransfer,

    // convert
    onConvertToGroup,
  } = props;

  const sharedEmails = wallet?.sharedEmails || [];
  const balance = Number(wallet?.balance ?? wallet?.current ?? 0) || 0;

  // ======= VIEW STATES =======
  if (showCreate) {
    return (
      <div className="wallets-detail-panel">
        <div className="wallets-section wallets-section--inline">
          <div className="wallets-section__header">
            <h3>Tạo ví cá nhân</h3>
            <span>Nhập thông tin để tạo ví</span>
          </div>
          <form
            className="wallet-form"
            onSubmit={onSubmitCreate}
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
                    onCreateFieldChange("name", e.target.value)
                  }
                  placeholder="Ví tiền mặt, Ví ngân hàng..."
                />
              </label>
              <label>
                Tiền tệ
                <select
                  value={createForm.currency}
                  onChange={(e) =>
                    onCreateFieldChange("currency", e.target.value)
                  }
                >
                  {currencies.map((c) => (
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
                    onCreateFieldChange("note", e.target.value)
                  }
                  placeholder="Mục đích sử dụng ví này..."
                />
              </label>
            </div>

            {/* bật/tắt chia sẻ */}
            <div className="wallet-form__row">
              <label className="wallet-form__checkbox">
                <input
                  type="checkbox"
                  checked={createShareEnabled}
                  onChange={(e) => setCreateShareEnabled(e.target.checked)}
                />
                <span>Chia sẻ ví này với người khác</span>
              </label>
            </div>

            {createShareEnabled && (
              <div className="wallet-form__share-block">
                <label className="wallet-form__full">
                  Email người được chia sẻ
                  <div className="wallet-form__share-row">
                    <input
                      type="email"
                      value={createShareEmail}
                      onChange={(e) => setCreateShareEmail(e.target.value)}
                      placeholder="example@gmail.com"
                    />
                    <button
                      type="button"
                      className="wallets-btn wallets-btn--ghost"
                      onClick={onAddCreateShareEmail}
                    >
                      Thêm
                    </button>
                  </div>
                </label>

                {createForm.sharedEmails.length > 0 && (
                  <div className="wallet-share-list">
                    {createForm.sharedEmails.map((email) => (
                      <span key={email} className="wallet-share-pill">
                        {email}
                        <button
                          type="button"
                          onClick={() => onRemoveCreateShareEmail(email)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="wallet-form__footer">
              <label className="wallet-form__checkbox">
                <input
                  type="checkbox"
                  checked={createForm.isDefault}
                  onChange={(e) =>
                    onCreateFieldChange("isDefault", e.target.checked)
                  }
                />
                <span>Đặt làm ví mặc định</span>
              </label>
              <div className="wallet-form__actions">
                <button
                  type="button"
                  className="wallets-btn wallets-btn--ghost"
                  onClick={() => setShowCreate(false)}
                >
                  Hủy
                </button>
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
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="wallets-detail-panel">
        <div className="wallets-detail__empty">
          <h3>Chưa chọn ví</h3>
          <p>Chọn một ví ở danh sách bên trái để xem chi tiết.</p>
        </div>
      </div>
    );
  }

  // ======= DETAIL PANEL =======
  return (
    <div className="wallets-detail-panel">
      {/* HEADER */}
      <div className="wallets-detail__header">
        <div>
          <h2 className="wallets-detail__name">
            {wallet.name || "Chưa đặt tên"}
          </h2>
          <div className="wallets-detail__tags">
            <span className="wallet-tag">
              {wallet.isShared ? "Ví nhóm" : "Ví cá nhân"}
            </span>
            {wallet.isDefault && (
              <span className="wallet-tag wallet-tag--outline">
                Ví mặc định
              </span>
            )}
          </div>
        </div>
        <div className="wallets-detail__balance">
          <div className="wallets-detail__balance-label">Số dư (demo)</div>
          <div className="wallets-detail__balance-value">
            {balance.toLocaleString("vi-VN")} {wallet.currency || "VND"}
          </div>
        </div>
      </div>

      {/* TABS */}
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
            activeDetailTab === "topup"
              ? "wallets-detail-tab wallets-detail-tab--active"
              : "wallets-detail-tab"
          }
          onClick={() => setActiveDetailTab("topup")}
        >
          Nạp ví
        </button>
        <button
          className={
            activeDetailTab === "withdraw"
              ? "wallets-detail-tab wallets-detail-tab--active"
              : "wallets-detail-tab"
          }
          onClick={() => setActiveDetailTab("withdraw")}
        >
          Rút ví
        </button>
        <button
          className={
            activeDetailTab === "transfer"
              ? "wallets-detail-tab wallets-detail-tab--active"
              : "wallets-detail-tab"
          }
          onClick={() => setActiveDetailTab("transfer")}
        >
          Chuyển tiền
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
      </div>

      {/* NỘI DUNG THEO TAB */}
      {activeDetailTab === "view" && (
        <DetailViewTab
          wallet={wallet}
          sharedEmails={sharedEmails}
          demoTransactions={demoTransactions}
        />
      )}

      {activeDetailTab === "topup" && (
        <TopupTab
          wallet={wallet}
          categories={categories}
          topupAmount={topupAmount}
          setTopupAmount={setTopupAmount}
          topupNote={topupNote}
          setTopupNote={setTopupNote}
          topupCategoryId={topupCategoryId}
          setTopupCategoryId={setTopupCategoryId}
          onSubmitTopup={onSubmitTopup}
        />
      )}

      {activeDetailTab === "withdraw" && (
        <WithdrawTab
          wallet={wallet}
          categories={categories}
          withdrawAmount={withdrawAmount}
          setWithdrawAmount={setWithdrawAmount}
          withdrawNote={withdrawNote}
          setWithdrawNote={setWithdrawNote}
          withdrawCategoryId={withdrawCategoryId}
          setWithdrawCategoryId={setWithdrawCategoryId}
          onSubmitWithdraw={onSubmitWithdraw}
        />
      )}

      {activeDetailTab === "transfer" && (
        <TransferTab
          wallet={wallet}
          allWallets={allWallets}
          categories={categories}
          transferTargetId={transferTargetId}
          setTransferTargetId={setTransferTargetId}
          transferAmount={transferAmount}
          setTransferAmount={setTransferAmount}
          transferNote={transferNote}
          setTransferNote={setTransferNote}
          transferCategoryId={transferCategoryId}
          setTransferCategoryId={setTransferCategoryId}
          onSubmitTransfer={onSubmitTransfer}
        />
      )}

      {activeDetailTab === "edit" && (
        <EditTab
          wallet={wallet}
          currencies={currencies}
          editForm={editForm}
          onEditFieldChange={onEditFieldChange}
          editShareEmail={editShareEmail}
          setEditShareEmail={setEditShareEmail}
          onAddEditShareEmail={onAddEditShareEmail}
          onRemoveEditShareEmail={onRemoveEditShareEmail}
          onSubmitEdit={onSubmitEdit}
        />
      )}

      {activeDetailTab === "merge" && (
        <MergeTab
          wallet={wallet}
          allWallets={allWallets}
          categories={categories}
          mergeTargetId={mergeTargetId}
          setMergeTargetId={setMergeTargetId}
          mergeCategoryId={mergeCategoryId}
          setMergeCategoryId={setMergeCategoryId}
          onSubmitMerge={onSubmitMerge}
        />
      )}

      {activeDetailTab === "convert" && (
        <ConvertTab wallet={wallet} onConvertToGroup={onConvertToGroup} />
      )}
    </div>
  );
}

/* ====== SUB TABS COMPONENTS ====== */

function DetailViewTab({ wallet, sharedEmails, demoTransactions }) {
  return (
    <div className="wallets-section wallets-section--view">
      <div className="wallets-section__header">
        <h3>Chi tiết ví</h3>
        <span>Thông tin cơ bản, chia sẻ và lịch sử giao dịch.</span>
      </div>

      {/* layout 2 cột */}
      <div className="wallets-detail-view">
        {/* CARD TRÁI: Chi tiết + chia sẻ */}
        <div className="wallets-detail-view__col">
          <div className="wallets-detail-view__card">
            <div className="wallets-detail-view__card-header">
              <span>Thông tin &amp; chia sẻ</span>
            </div>

            {/* Info */}
            <div className="wallet-detail-grid">
              <div className="wallet-detail-item">
                <span className="wallet-detail-item__label">Loại ví</span>
                <span className="wallet-detail-item__value">
                  {wallet.isShared ? "Ví nhóm" : "Ví cá nhân"}
                </span>
              </div>
              <div className="wallet-detail-item">
                <span className="wallet-detail-item__label">Tiền tệ</span>
                <span className="wallet-detail-item__value">
                  {wallet.currency || "VND"}
                </span>
              </div>
              <div className="wallet-detail-item">
                <span className="wallet-detail-item__label">Ngày tạo</span>
                <span className="wallet-detail-item__value">
                  {wallet.createdAt
                    ? new Date(wallet.createdAt).toLocaleDateString("vi-VN")
                    : "—"}
                </span>
              </div>
              <div className="wallet-detail-item wallet-detail-item--full">
                <span className="wallet-detail-item__label">Ghi chú</span>
                <span className="wallet-detail-item__value">
                  {wallet.note || "Chưa có ghi chú."}
                </span>
              </div>
            </div>

            {/* Chia sẻ */}
            <div className="wallets-detail__share">
              <h4>Chia sẻ ví</h4>
              {sharedEmails.length === 0 ? (
                <p className="wallets-detail__share-empty">
                  Hiện tại ví chưa được chia sẻ cho ai.
                </p>
              ) : (
                <div className="wallet-share-list">
                  {sharedEmails.map((email) => (
                    <span
                      key={email}
                      className="wallet-share-pill wallet-share-pill--readonly"
                    >
                      {email}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD PHẢI: Lịch sử */}
        <div className="wallets-detail-view__col wallets-detail-view__col--history">
          <div className="wallets-detail-view__card">
            <div className="wallets-detail-view__card-header">
              <span>Lịch sử giao dịch</span>
              <span className="wallets-detail-view__counter">
                {demoTransactions.length} giao dịch (demo)
              </span>
            </div>

            {/* tóm tắt số giao dịch */}
            <div className="wallets-detail__history-summary">
              <div className="wallet-detail-item wallet-detail-item--inline">
                <span className="wallet-detail-item__label">
                  Số giao dịch (demo)
                </span>
                <span className="wallet-detail-item__value">
                  {demoTransactions.length}
                </span>
              </div>
            </div>

            {/* danh sách lịch sử */}
            <div className="wallets-detail__history">
              {demoTransactions.length === 0 ? (
                <p className="wallets-detail__history-empty">
                  Chưa có giao dịch cho ví này.
                </p>
              ) : (
                <ul className="wallets-detail__history-list">
                  {demoTransactions.map((tx) => (
                    <li key={tx.id} className="wallets-detail__history-item">
                      <div className="wallets-detail__history-main">
                        <span className="wallets-detail__history-title">
                          {tx.title}
                        </span>
                        <span
                          className={
                            tx.amount >= 0
                              ? "wallets-detail__history-amount wallets-detail__history-amount--pos"
                              : "wallets-detail__history-amount wallets-detail__history-amount--neg"
                          }
                        >
                          {tx.amount >= 0 ? "+" : "-"}
                          {Math.abs(tx.amount).toLocaleString("vi-VN")} VND
                        </span>
                      </div>

                      <div className="wallets-detail__history-meta">
                        {/* danh mục + thời gian */}
                        <span className="wallets-detail__history-category">
                          {tx.categoryName || "Danh mục khác"}
                        </span>
                        <span>{tx.timeLabel}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopupTab({
  wallet,
  categories,
  topupAmount,
  setTopupAmount,
  topupNote,
  setTopupNote,
  topupCategoryId,
  setTopupCategoryId,
  onSubmitTopup,
}) {
  return (
    <div className="wallets-section">
      <div className="wallets-section__header">
        <h3>Nạp tiền vào ví</h3>
        <span>Nạp thêm số dư cho ví hiện tại.</span>
      </div>
      <form className="wallet-form" onSubmit={onSubmitTopup} autoComplete="off">
        <div className="wallet-form__row">
          <label>
            Số tiền nạp
            <input
              type="number"
              min="0"
              step="1000"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="Nhập số tiền..."
            />
          </label>
          <label>
            Danh mục
            <select
              value={topupCategoryId}
              onChange={(e) => setTopupCategoryId(e.target.value)}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="wallet-form__row">
          <label>
            Tiền tệ
            <input type="text" value={wallet.currency || "VND"} disabled />
          </label>
          <label className="wallet-form__full">
            Ghi chú
            <textarea
              rows={2}
              value={topupNote}
              onChange={(e) => setTopupNote(e.target.value)}
              placeholder="Ghi chú cho lần nạp này..."
            />
          </label>
        </div>

        <div className="wallet-form__footer wallet-form__footer--right">
          <button
            type="submit"
            className="wallets-btn wallets-btn--primary"
            disabled={!topupAmount || !topupCategoryId}
          >
            Xác nhận nạp ví
          </button>
        </div>
      </form>
    </div>
  );
}

function WithdrawTab({
  wallet,
  categories,
  withdrawAmount,
  setWithdrawAmount,
  withdrawNote,
  setWithdrawNote,
  withdrawCategoryId,
  setWithdrawCategoryId,
  onSubmitWithdraw,
}) {
  return (
    <div className="wallets-section">
      <div className="wallets-section__header">
        <h3>Rút tiền từ ví</h3>
        <span>Rút tiền và chọn danh mục phù hợp.</span>
      </div>
      <form
        className="wallet-form"
        onSubmit={onSubmitWithdraw}
        autoComplete="off"
      >
        <div className="wallet-form__row">
          <label>
            Số tiền rút
            <input
              type="number"
              min="0"
              step="1000"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Nhập số tiền..."
            />
          </label>
          <label>
            Danh mục
            <select
              value={withdrawCategoryId}
              onChange={(e) => setWithdrawCategoryId(e.target.value)}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
              value={withdrawNote}
              onChange={(e) => setWithdrawNote(e.target.value)}
              placeholder="Ghi chú cho lần rút này..."
            />
          </label>
        </div>
        <div className="wallet-form__footer wallet-form__footer--right">
          <button
            type="submit"
            className="wallets-btn wallets-btn--primary"
            disabled={!withdrawAmount || !withdrawCategoryId}
          >
            Xác nhận rút ví
          </button>
        </div>
      </form>
    </div>
  );
}

/* ========= TRANSFER TAB – có cảnh báo khác tiền tệ ========= */
function TransferTab({
  wallet,
  allWallets,
  categories,
  transferTargetId,
  setTransferTargetId,
  transferAmount,
  setTransferAmount,
  transferNote,
  setTransferNote,
  transferCategoryId,
  setTransferCategoryId,
  onSubmitTransfer,
}) {
  const sourceCurrency = wallet.currency || "VND";
  const targetWallet =
    allWallets.find((w) => String(w.id) === String(transferTargetId)) || null;
  const targetCurrency = targetWallet?.currency || null;

  const currencyMismatch =
    !!targetWallet && !!targetCurrency && targetCurrency !== sourceCurrency;

  return (
    <div className="wallets-section">
      <div className="wallets-section__header">
        <h3>Chuyển tiền giữa các ví</h3>
        <span>
          Chuyển tiền từ ví hiện tại sang ví khác. Nếu khác loại tiền tệ, hệ
          thống sẽ cần quy đổi khi triển khai thật.
        </span>
      </div>
      <form
        className="wallet-form"
        onSubmit={onSubmitTransfer}
        autoComplete="off"
      >
        <div className="wallet-form__row">
          <label>
            Ví nguồn
            <input
              type="text"
              value={`${wallet.name || "Ví hiện tại"} (${sourceCurrency})`}
              disabled
            />
          </label>
          <label>
            Ví đích
            <select
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(e.target.value)}
            >
              <option value="">-- Chọn ví đích --</option>
              {allWallets
                .filter((w) => w.id !== wallet.id)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name || "Chưa đặt tên"}{" "}
                    {w.isShared ? "(Nhóm)" : "(Cá nhân)"} ·{" "}
                    {w.currency || "VND"}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <div className="wallet-form__row">
          <label>
            Số tiền chuyển
            <input
              type="number"
              min="0"
              step="1000"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Nhập số tiền..."
            />
          </label>
          <label>
            Danh mục
            <select
              value={transferCategoryId}
              onChange={(e) => setTransferCategoryId(e.target.value)}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="Ghi chú cho lần chuyển này..."
            />
          </label>
        </div>

        {/* CẢNH BÁO KHÁC TIỀN TỆ */}
        {currencyMismatch && (
          <div className="wallet-transfer__fx-warning">
            <div className="wallet-transfer__fx-title">
              Hai ví đang có loại tiền tệ khác nhau
            </div>
            <div className="wallet-transfer__fx-row">
              <span>Ví nguồn:</span>
              <strong>{sourceCurrency}</strong>
            </div>
            <div className="wallet-transfer__fx-row">
              <span>Ví đích:</span>
              <strong>{targetCurrency}</strong>
            </div>
            <p className="wallet-transfer__fx-note">
              Đây là bản demo nên việc chuyển tiền chỉ cập nhật giao diện. Khi
              triển khai thực tế, backend cần thực hiện quy đổi tỷ giá và trừ /
              cộng số dư chính xác cho từng ví theo đơn vị tiền tệ tương ứng.
            </p>
          </div>
        )}

        <div className="wallet-form__footer wallet-form__footer--right">
          <button
            type="submit"
            className="wallets-btn wallets-btn--primary"
            disabled={
              !transferTargetId || !transferAmount || !transferCategoryId
            }
          >
            Xác nhận chuyển tiền
          </button>
        </div>
      </form>
    </div>
  );
}

function EditTab({
  currencies,
  editForm,
  onEditFieldChange,
  editShareEmail,
  setEditShareEmail,
  onAddEditShareEmail,
  onRemoveEditShareEmail,
  onSubmitEdit,
}) {
  return (
    <div className="wallets-section">
      <div className="wallets-section__header">
        <h3>Sửa ví & chia sẻ</h3>
        <span>Chỉnh thông tin ví và quản lý người được chia sẻ.</span>
      </div>
      <form className="wallet-form" onSubmit={onSubmitEdit} autoComplete="off">
        <div className="wallet-form__row">
          <label>
            Tên ví
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => onEditFieldChange("name", e.target.value)}
            />
          </label>
          <label>
            Tiền tệ
            <select
              value={editForm.currency}
              onChange={(e) =>
                onEditFieldChange("currency", e.target.value)
              }
            >
              {currencies.map((c) => (
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
              onChange={(e) => onEditFieldChange("note", e.target.value)}
            />
          </label>
        </div>

        {/* quản lý chia sẻ */}
        <div className="wallet-form__share-block">
          <label className="wallet-form__full">
            Thêm email chia sẻ
            <div className="wallet-form__share-row">
              <input
                type="email"
                value={editShareEmail}
                onChange={(e) => setEditShareEmail(e.target.value)}
                placeholder="example@gmail.com"
              />
              <button
                type="button"
                className="wallets-btn wallets-btn--ghost"
                onClick={onAddEditShareEmail}
              >
                Thêm
              </button>
            </div>
          </label>

          {(editForm.sharedEmails || []).length > 0 && (
            <div className="wallet-share-list">
              {editForm.sharedEmails.map((email) => (
                <span key={email} className="wallet-share-pill">
                  {email}
                  <button
                    type="button"
                    onClick={() => onRemoveEditShareEmail(email)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="wallet-form__footer wallet-form__footer--right">
          <label className="wallet-form__checkbox">
            <input
              type="checkbox"
              checked={editForm.isDefault}
              onChange={(e) =>
                onEditFieldChange("isDefault", e.target.checked)
              }
            />
            <span>Đặt làm ví mặc định</span>
          </label>
          <div className="wallet-form__actions">
            <button type="submit" className="wallets-btn wallets-btn--primary">
              Lưu thay đổi
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ===================== MERGE TAB (5 bước + xử lý default cho mọi case) ===================== */
function MergeTab({
  wallet,
  allWallets,
  categories,
  mergeTargetId,
  setMergeTargetId,
  mergeCategoryId,
  setMergeCategoryId,
  onSubmitMerge,
}) {
  const [step, setStep] = useState(2); // 2: chọn ví & chiều, 3: xử lý ví mặc định, 4: loại tiền, 5: preview, 6: processing/success
  const [targetId, setTargetId] = useState(mergeTargetId || "");
  const [currencyMode, setCurrencyMode] = useState("keepTarget");
  const [agree, setAgree] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // this_into_other: gộp "ví hiện tại" vào ví khác
  // other_into_this: gộp ví khác vào "ví hiện tại"
  const [direction, setDirection] = useState("this_into_other");

  const [searchTerm, setSearchTerm] = useState("");

  // true = sau khi gộp sẽ cố gắng đặt ví đích làm ví mặc định mới
  const [makeTargetDefault, setMakeTargetDefault] = useState(false);

  // progress giả lập
  useEffect(() => {
    if (!processing) return;
    setProgress(0);
    let v = 0;
    const timer = setInterval(() => {
      v += 15;
      if (v >= 100) {
        v = 100;
        clearInterval(timer);
        setTimeout(() => setProcessing(false), 400);
      }
      setProgress(v);
    }, 260);
    return () => clearInterval(timer);
  }, [processing]);

  // sync targetId ra ngoài nếu cần
  useEffect(() => {
    if (setMergeTargetId) setMergeTargetId(targetId);
  }, [targetId, setMergeTargetId]);

  // Đổi chiều gộp → reset
  useEffect(() => {
    setTargetId("");
    if (setMergeTargetId) setMergeTargetId("");
  }, [direction, setMergeTargetId]);

  // đổi target → reset lựa chọn mặc định
  useEffect(() => {
    setMakeTargetDefault(false);
  }, [targetId, direction]);

  if (!wallet) {
    return (
      <div className="wallets-section">
        <p>Hãy chọn một ví để gộp.</p>
      </div>
    );
  }

  // ======== TÍNH TOÁN CƠ BẢN ========
  const currentWallet = wallet;
  const thisName = currentWallet.name || "Ví hiện tại";
  const isCurrentDefault = !!currentWallet.isDefault;

  const selectableWallets = (allWallets || []).filter(
    (w) => w.id !== currentWallet.id
  );

  const filteredWallets = selectableWallets.filter((w) => {
    if (!searchTerm.trim()) return true;
    const name = (w.name || "").toLowerCase();
    return name.includes(searchTerm.trim().toLowerCase());
  });

  const selectedWallet = selectableWallets.find(
    (w) => String(w.id) === String(targetId)
  );

  const isThisIntoOther = direction === "this_into_other";

  // ví nguồn / ví đích cho bước 4–5–6
  const sourceWallet =
    direction === "this_into_other"
      ? currentWallet
      : selectedWallet || null;

  const targetWallet =
    direction === "this_into_other"
      ? selectedWallet || null
      : currentWallet;

  const srcCurrency = sourceWallet?.currency || "VND";
  const srcName = sourceWallet?.name || "Ví nguồn";
  const srcBalance =
    Number(sourceWallet?.balance ?? sourceWallet?.current ?? 0) || 0;
  const srcTxCount = sourceWallet?.txCount ?? 15; // demo

  const tgtCurrency = targetWallet?.currency || srcCurrency;
  const tgtName = targetWallet?.name || "Ví đích";
  const tgtBalance =
    Number(targetWallet?.balance ?? targetWallet?.current ?? 0) || 0;
  const tgtTxCount = targetWallet?.txCount ?? 30; // demo

  const currentIsDefault = !!currentWallet.isDefault;
  const selectedIsDefault = !!selectedWallet?.isDefault;
  const anyDefaultInPair = currentIsDefault || selectedIsDefault;

  // default đang ở ví nguồn hay ví đích (trong cặp đang gộp)
  const sourceIsDefault =
    (direction === "this_into_other" && currentIsDefault) ||
    (direction === "other_into_this" && selectedIsDefault);

  const targetIsDefault =
    (direction === "this_into_other" && selectedIsDefault) ||
    (direction === "other_into_this" && currentIsDefault);

  const differentCurrency = !!targetWallet && srcCurrency !== tgtCurrency;

  const RATE_USD_VND = 24350;

  const convertedSourceAmount = (() => {
    if (!differentCurrency || !sourceWallet) return srcBalance;

    if (currencyMode === "keepTarget") {
      if (srcCurrency === "USD" && tgtCurrency === "VND") {
        return srcBalance * RATE_USD_VND;
      }
      if (srcCurrency === "VND" && tgtCurrency === "USD") {
        return srcBalance / RATE_USD_VND;
      }
    }
    return srcBalance;
  })();

  const finalCurrency = (() => {
    if (!differentCurrency) return tgtCurrency;
    return currencyMode === "keepTarget" ? tgtCurrency : srcCurrency;
  })();

  const finalBalance = (() => {
    if (!targetWallet || !sourceWallet) return srcBalance;
    if (!differentCurrency || currencyMode === "keepSource") {
      return srcBalance + tgtBalance;
    }
    return tgtBalance + convertedSourceAmount;
  })();

  const handleNextFromStep2 = () => {
    if (!targetId) return;
    // luôn đi qua bước xử lý ví mặc định (step 3) cho mọi case
    setStep(3);
  };

  const handleConfirmMerge = () => {
    if (!targetWallet || !sourceWallet || !agree) return;
    if (!onSubmitMerge) return;

    const sourceId = sourceWallet.id;
    const targetIdFinal = targetWallet.id;
    if (!sourceId || !targetIdFinal) return;

    const payload = {
      sourceWalletId: sourceId,
      targetWalletId: targetIdFinal,
      currencyMode,
      categoryId: mergeCategoryId || null,
      direction,
      setTargetAsDefault: !!makeTargetDefault,
    };

    setStep(6);
    setProcessing(true);

    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      onSubmitMerge(fakeEvent, payload);
    }, 3000);
  };

  /* =========================
     STEP 2: CHỌN VÍ & CHIỀU GỘP
  ========================== */
  const renderStep2 = () => {
    const currentBal =
      Number(currentWallet.balance ?? currentWallet.current ?? 0) || 0;
    const currentCur = currentWallet.currency || "VND";
    const currentTx = currentWallet.txCount ?? 15;

    const selectedBal =
      selectedWallet &&
      (Number(selectedWallet.balance ?? selectedWallet.current ?? 0) || 0);
    const selectedCur = selectedWallet?.currency || "VND";

    return (
      <div className="wallets-section wallet-merge__panel">
        <div className="wallet-merge__step-header">
          <div className="wallet-merge__step-label">Bước 2 – Chọn ví đích</div>
          <div className="wallet-merge__step-pill">Gộp ví · 5 bước</div>
        </div>

        <div className="wallet-merge__box">
          {/* DÒNG MÔ TẢ QUAN HỆ GỘP */}
          {selectedWallet && (
            <div className="wallet-merge__relation">
              {isThisIntoOther ? (
                <>
                  Gộp ví <strong>{thisName}</strong> vào{" "}
                  <strong>{selectedWallet.name || "Ví được chọn"}</strong>
                </>
              ) : (
                <>
                  Gộp ví{" "}
                    <strong>{selectedWallet.name || "Ví được chọn"}</strong> vào{" "}
                    <strong>{thisName}</strong>
                </>
              )}
            </div>
          )}

          <div className="wallet-merge__grid-2">
            {/* ====== CỘT TRÁI: TÓM TẮT VÍ NGUỒN & VÍ ĐÍCH ====== */}
            <div className="wallet-merge__summary-wrapper">
              <div className="wallet-merge__summary-wrapper-header">
                <h4>Tóm tắt ví nguồn &amp; ví đích</h4>
                <span>Kiểm tra lại trước khi tiếp tục gộp ví.</span>
              </div>

              <div className="wallet-merge__summary-col">
                {/* VÍ NGUỒN = luôn là ví hiện tại trong phần tóm tắt */}
                <div className="wallet-merge__summary-card wallet-merge__summary-card--source">
                  <div className="wallet-merge__summary-title">VÍ NGUỒN</div>
                  <div className="wallet-merge__summary-name">{thisName}</div>

                  <div className="wallet-merge__summary-row">
                    <span>Tiền tệ</span>
                    <span>{currentCur}</span>
                  </div>
                  <div className="wallet-merge__summary-row">
                    <span>Số dư (demo)</span>
                    <span>
                      {currentBal.toLocaleString("vi-VN")} {currentCur}
                    </span>
                  </div>
                  <div className="wallet-merge__summary-row">
                    <span>Số giao dịch (demo)</span>
                    <span>{currentTx}</span>
                  </div>
                  {isCurrentDefault && (
                    <div className="wallet-merge__target-warning">
                      Đây là ví mặc định hiện tại.
                    </div>
                  )}
                </div>

                {/* VÍ ĐÍCH ĐANG CHỌN */}
                <div className="wallet-merge__summary-card wallet-merge__summary-card--target">
                  <div className="wallet-merge__summary-title">
                    VÍ ĐÍCH ĐANG CHỌN
                  </div>
                  <div className="wallet-merge__summary-name">
                    {selectedWallet
                      ? selectedWallet.name || "Ví được chọn"
                      : "Chưa chọn ví đích"}
                  </div>

                  <div className="wallet-merge__summary-row">
                    <span>Tiền tệ</span>
                    <span>{selectedWallet ? selectedCur : "—"}</span>
                  </div>
                  <div className="wallet-merge__summary-row">
                    <span>Số dư (demo)</span>
                    <span>
                      {selectedWallet
                        ? `${selectedBal.toLocaleString("vi-VN")} ${selectedCur}`
                        : "—"}
                    </span>
                  </div>
                  <div className="wallet-merge__summary-row">
                    <span>Loại ví</span>
                    <span>
                      {selectedWallet
                        ? selectedWallet.isShared
                          ? "Ví nhóm"
                          : "Ví cá nhân"
                        : "—"}
                    </span>
                  </div>
                  {selectedWallet?.isDefault && (
                    <div className="wallet-merge__target-warning">
                      Đây là một ví mặc định.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ====== CỘT PHẢI: THIẾT LẬP & DANH SÁCH VÍ ====== */}
            <div className="wallet-merge__right-wrapper">
              <div className="wallet-merge__right-header">
                <h4>Thiết lập gộp &amp; chọn ví</h4>
                <span>Chọn chiều gộp và ví đích muốn gộp.</span>
              </div>

              <div className="wallet-merge__right">
                <div className="wallet-merge__direction">
                  <button
                    type="button"
                    className={
                      isThisIntoOther
                        ? "wallet-merge__direction-btn wallet-merge__direction-btn--active"
                        : "wallet-merge__direction-btn"
                    }
                    onClick={() => setDirection("this_into_other")}
                  >
                    Gộp ví này vào ví khác
                  </button>
                  <button
                    type="button"
                    className={
                      !isThisIntoOther
                        ? "wallet-merge__direction-btn wallet-merge__direction-btn--active"
                        : "wallet-merge__direction-btn"
                    }
                    onClick={() => setDirection("other_into_this")}
                  >
                    Gộp ví khác vào ví này
                  </button>
                </div>
                <p className="wallet-merge__direction-note">
                  {isThisIntoOther
                    ? "Số dư và giao dịch của ví hiện tại sẽ chuyển sang ví bạn chọn."
                    : "Số dư và giao dịch của ví được chọn sẽ được gộp vào ví hiện tại."}
                </p>

                <div className="wallet-merge__section-title">
                  {isThisIntoOther
                    ? "Chọn ví đích để gộp vào"
                    : "Chọn ví cần gộp vào ví này"}
                </div>
                <p className="wallet-merge__hint">
                  Chỉ những ví khác với ví hiện tại mới được hiển thị.
                </p>

                {/* SEARCH */}
                <div className="wallet-merge__search">
                  <input
                    type="text"
                    placeholder="Tìm theo tên ví..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* LIST VÍ */}
                <div className="wallet-merge__target-list">
                  {filteredWallets.length === 0 && (
                    <p className="wallet-merge__empty">
                      Không tìm thấy ví nào phù hợp. Hãy thử từ khóa khác.
                    </p>
                  )}

                  {filteredWallets.map((w) => {
                    const checked = String(targetId) === String(w.id);
                    const bal =
                      Number(w.balance ?? w.current ?? 0)?.toLocaleString(
                        "vi-VN"
                      ) || "0";
                    const isDiff =
                      (w.currency || "VND") !== currentCur; // so với ví hiện tại

                    return (
                      <label
                        key={w.id}
                        className={
                          checked
                            ? "wallet-merge__target wallet-merge__target--active"
                            : "wallet-merge__target"
                        }
                      >
                        <input
                          type="radio"
                          name="mergeTarget"
                          value={w.id}
                          checked={checked}
                          onChange={() => setTargetId(String(w.id))}
                        />
                        <div className="wallet-merge__target-main">
                          <div className="wallet-merge__target-top">
                            <span className="wallet-merge__target-name">
                              {w.name || "Ví không tên"}
                            </span>
                            <span className="wallet-merge__target-chip">
                              {w.isShared ? "Ví nhóm" : "Ví cá nhân"}
                            </span>
                          </div>
                          <div className="wallet-merge__target-row">
                            <span>Tiền tệ</span>
                            <span>{w.currency || "VND"}</span>
                          </div>
                          <div className="wallet-merge__target-row">
                            <span>Số dư (demo)</span>
                            <span>
                              {bal} {w.currency || "VND"}
                            </span>
                          </div>
                          {w.isDefault && (
                            <div className="wallet-merge__target-warning">
                              Ví này đang là ví mặc định.
                            </div>
                          )}
                          {isDiff && (
                            <div className="wallet-merge__target-warning">
                              Khác loại tiền tệ với ví hiện tại
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="wallet-merge__actions">
                  <button
                    type="button"
                    className="wallets-btn wallets-btn--ghost"
                    onClick={() => setStep(2)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="wallets-btn wallets-btn--primary"
                    disabled={!targetId}
                    onClick={handleNextFromStep2}
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* =========================
     STEP 3: XỬ LÝ VÍ MẶC ĐỊNH (áp dụng cho mọi case)
  ========================== */
  const renderStep3DefaultHandling = () => {
    if (!selectedWallet) {
      setStep(4);
      return null;
    }

    // Case 1: ví mặc định là ví nguồn → nguy hiểm, có thể bị xoá
    if (sourceIsDefault) {
      const defaultName = sourceWallet?.name || "Ví mặc định hiện tại";
      return (
        <div className="wallets-section wallet-merge__panel">
          <div className="wallet-merge__step-header">
            <div className="wallet-merge__step-label">
              Bước 3 – Xử lý ví mặc định
            </div>
            <div className="wallet-merge__step-pill">Cảnh báo quan trọng</div>
          </div>

          <div className="wallet-merge__box">
            <div className="wallet-merge__section-block wallet-merge__section-block--warning">
              <div className="wallet-merge__section-title">
                Bạn đang gộp một ví mặc định
              </div>
              <ul className="wallet-merge__list">
                <li>
                  <strong>{defaultName}</strong> hiện đang là ví mặc định của
                  hệ thống.
                </li>
                <li>
                  Sau khi gộp, ví <strong>{defaultName}</strong> sẽ bị xoá
                  (demo).
                </li>
                <li>
                  Bạn cần quyết định ví nào sẽ là ví mặc định mới sau khi gộp.
                </li>
              </ul>
            </div>

            <div className="wallet-merge__section-block">
              <div className="wallet-merge__section-title">
                Chọn cách xử lý ví mặc định
              </div>
              <p className="wallet-merge__hint">
                Ví đích hiện tại: <strong>{tgtName}</strong>
              </p>

              <div className="wallet-merge__options">
                <label className="wallet-merge__option">
                  <input
                    type="radio"
                    name="defaultHandling"
                    value="makeTargetDefault"
                    checked={makeTargetDefault === true}
                    onChange={() => setMakeTargetDefault(true)}
                  />
                  <div>
                    <div className="wallet-merge__option-title">
                      Đặt ví đích làm ví mặc định mới (khuyến nghị)
                    </div>
                    <div className="wallet-merge__option-desc">
                      Sau khi gộp, ví{" "}
                      <strong>{tgtName || "ví đích"}</strong> sẽ trở thành ví
                      mặc định.
                    </div>
                  </div>
                </label>

                <label className="wallet-merge__option">
                  <input
                    type="radio"
                    name="defaultHandling"
                    value="noDefault"
                    checked={makeTargetDefault === false}
                    onChange={() => setMakeTargetDefault(false)}
                  />
                  <div>
                    <div className="wallet-merge__option-title">
                      Không đặt ví mặc định sau khi gộp
                    </div>
                    <div className="wallet-merge__option-desc">
                      Hệ thống sẽ tạm thời không có ví mặc định. Bạn có thể
                      chọn lại sau trong phần quản lý ví.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="wallet-merge__actions">
              <button
                type="button"
                className="wallets-btn wallets-btn--ghost"
                onClick={() => setStep(2)}
              >
                Quay lại
              </button>
              <button
                type="button"
                className="wallets-btn wallets-btn--primary"
                onClick={() => setStep(4)}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Case 2: các case còn lại (bao gồm ví thường gộp vào ví mặc định,
    // hoặc cặp này không phải ví mặc định nhưng hệ thống có/không có default ở chỗ khác)
    return (
      <div className="wallets-section wallet-merge__panel">
        <div className="wallet-merge__step-header">
          <div className="wallet-merge__step-label">
            Bước 3 – Xử lý ví mặc định
          </div>
          <div className="wallet-merge__step-pill">Thiết lập an toàn</div>
        </div>

        <div className="wallet-merge__box">
          <div className="wallet-merge__section-block wallet-merge__section-block--warning">
            <div className="wallet-merge__section-title">
              Kiểm tra lại cấu hình ví mặc định
            </div>
            <ul className="wallet-merge__list">
              {targetIsDefault && (
                <>
                  <li>
                    Ví đích <strong>{tgtName}</strong> hiện đang là ví mặc định.
                  </li>
                  <li>
                    Sau khi gộp, ví mặc định vẫn là{" "}
                    <strong>{tgtName}</strong>, trừ khi bạn thay đổi.
                  </li>
                </>
              )}

              {!targetIsDefault && anyDefaultInPair && !sourceIsDefault && (
                <>
                  <li>
                    Một ví trong cặp gộp đang là ví mặc định, nhưng không phải
                    ví nguồn.
                  </li>
                  <li>
                    Bạn có thể giữ nguyên hoặc chuyển sang dùng ví đích làm ví
                    mặc định mới.
                  </li>
                </>
              )}

              {!anyDefaultInPair && (
                <>
                  <li>Hiện tại hệ thống chưa có ví mặc định.</li>
                  <li>
                    Bạn có thể đặt ví đích <strong>{tgtName}</strong> làm ví
                    mặc định sau khi gộp.
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="wallet-merge__section-block">
            <div className="wallet-merge__section-title">
              Cài đặt ví mặc định sau khi gộp
            </div>
            <div className="wallet-merge__options">
              <label className="wallet-merge__option">
                <input
                  type="radio"
                  name="defaultHandling2"
                  value="makeTargetDefault"
                  checked={makeTargetDefault === true}
                  onChange={() => setMakeTargetDefault(true)}
                />
                <div>
                  <div className="wallet-merge__option-title">
                    Đặt ví đích làm ví mặc định
                  </div>
                  <div className="wallet-merge__option-desc">
                    Sau khi gộp, ví <strong>{tgtName}</strong> sẽ được đặt làm
                    ví mặc định của hệ thống.
                  </div>
                </div>
              </label>

              <label className="wallet-merge__option">
                <input
                  type="radio"
                  name="defaultHandling2"
                  value="keepCurrent"
                  checked={makeTargetDefault === false}
                  onChange={() => setMakeTargetDefault(false)}
                />
                <div>
                  <div className="wallet-merge__option-title">
                    Không tự động thay đổi ví mặc định
                  </div>
                  <div className="wallet-merge__option-desc">
                    Giữ nguyên ví mặc định hiện tại (nếu đang có). Nếu hệ thống
                    chưa có ví mặc định thì vẫn giữ trạng thái như cũ.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="wallet-merge__actions">
            <button
              type="button"
              className="wallets-btn wallets-btn--ghost"
              onClick={() => setStep(2)}
            >
              Quay lại
            </button>
            <button
              type="button"
              className="wallets-btn wallets-btn--primary"
              onClick={() => setStep(4)}
            >
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* =========================
     STEP 4: CHỌN LOẠI TIỀN ĐÍCH
  ========================== */
  const renderStep4Currency = () => {
    if (!targetWallet) return null;

    if (!differentCurrency) {
      return (
        <div className="wallets-section wallet-merge__panel">
          <div className="wallet-merge__step-header">
            <div className="wallet-merge__step-label">
              Bước 4 – Chọn loại tiền đích
            </div>
            <div className="wallet-merge__step-pill">
              Hai ví cùng loại tiền
            </div>
          </div>

          <div className="wallet-merge__box">
            <p className="wallet-merge__hint">
              Cả hai ví đều sử dụng{" "}
              <strong>{tgtCurrency}</strong>. Hệ thống sẽ giữ nguyên loại tiền
              này cho ví sau khi gộp.
            </p>

            <div className="wallet-merge__actions">
              <button
                type="button"
                className="wallets-btn wallets-btn--ghost"
                onClick={() => setStep(2)}
              >
                Quay lại
              </button>
              <button
                type="button"
                className="wallets-btn wallets-btn--primary"
                onClick={() => setStep(5)}
              >
                Xem trước kết quả
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="wallets-section wallet-merge__panel">
        <div className="wallet-merge__step-header">
          <div className="wallet-merge__step-label">
            Bước 4 – Chọn loại tiền đích
          </div>
          <div className="wallet-merge__step-pill">
            Hai ví khác loại tiền
          </div>
        </div>

        <div className="wallet-merge__box">
          <div className="wallet-merge__grid-2 wallet-merge__grid-2--equal">
            <div className="wallet-merge__summary-card">
              <div className="wallet-merge__summary-title">VÍ NGUỒN</div>
              <div className="wallet-merge__summary-name">{srcName}</div>
              <div className="wallet-merge__summary-row">
                <span>Tiền tệ</span>
                <span>{srcCurrency}</span>
              </div>
              <div className="wallet-merge__summary-row">
                <span>Số dư (demo)</span>
                <span>
                  {srcBalance.toLocaleString("vi-VN")} {srcCurrency}
                </span>
              </div>
            </div>
            <div className="wallet-merge__summary-card">
              <div className="wallet-merge__summary-title">VÍ ĐÍCH</div>
              <div className="wallet-merge__summary-name">{tgtName}</div>
              <div className="wallet-merge__summary-row">
                <span>Tiền tệ</span>
                <span>{tgtCurrency}</span>
              </div>
              <div className="wallet-merge__summary-row">
                <span>Số dư (demo)</span>
                <span>
                  {tgtBalance.toLocaleString("vi-VN")} {tgtCurrency}
                </span>
              </div>
            </div>
          </div>

          <div className="wallet-merge__section-title">
            Cách xử lý khác loại tiền
          </div>
          <p className="wallet-merge__hint">
            Chọn loại tiền sẽ được giữ lại sau khi gộp. Tỷ giá dưới đây chỉ
            mang tính demo.
          </p>

          <div className="wallet-merge__options">
            <label className="wallet-merge__option">
              <input
                type="radio"
                name="currencyMode"
                value="keepTarget"
                checked={currencyMode === "keepTarget"}
                onChange={() => setCurrencyMode("keepTarget")}
              />
              <div>
                <div className="wallet-merge__option-title">
                  Giữ {tgtCurrency} (loại tiền của ví đích)
                </div>
                <div className="wallet-merge__option-desc">
                  Số dư ví nguồn sẽ được quy đổi:
                </div>
                <div className="wallet-merge__option-desc">
                  {srcBalance.toLocaleString("vi-VN")} {srcCurrency} →{" "}
                  {convertedSourceAmount.toLocaleString("vi-VN")} {tgtCurrency}
                </div>
                <div className="wallet-merge__option-foot">
                  Tỷ giá demo: 1 USD ={" "}
                  {RATE_USD_VND.toLocaleString("vi-VN")} VND
                </div>
              </div>
            </label>

            <label className="wallet-merge__option">
              <input
                type="radio"
                name="currencyMode"
                value="keepSource"
                checked={currencyMode === "keepSource"}
                onChange={() => setCurrencyMode("keepSource")}
              />
              <div>
                <div className="wallet-merge__option-title">
                  Giữ {srcCurrency} (loại tiền của ví nguồn)
                </div>
                <div className="wallet-merge__option-desc">
                  Số dư ví đích sẽ được quy đổi sang {srcCurrency} (demo).
                </div>
                <div className="wallet-merge__option-foot">
                  Tỷ giá demo: 1 USD ={" "}
                  {RATE_USD_VND.toLocaleString("vi-VN")} VND
                </div>
              </div>
            </label>
          </div>

          <div className="wallet-merge__actions">
            <button
              type="button"
              className="wallets-btn wallets-btn--ghost"
              onClick={() => setStep(2)}
            >
              Quay lại
            </button>
            <button
              type="button"
              className="wallets-btn wallets-btn--primary"
              onClick={() => setStep(5)}
            >
              Xem trước kết quả
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* =========================
     STEP 5: XEM TRƯỚC KẾT QUẢ
  ========================== */
  const renderStep5Preview = () => {
    if (!targetWallet || !sourceWallet) return null;

    return (
      <div className="wallets-section wallet-merge__panel">
        <div className="wallet-merge__step-header">
          <div className="wallet-merge__step-label">
            Bước 5 – Xem trước kết quả
          </div>
          <div className="wallet-merge__step-pill">Kiểm tra lần cuối</div>
        </div>

        <div className="wallet-merge__box wallet-merge__box--preview">
          <div className="wallet-merge__grid-2 wallet-merge__grid-2--equal">
            <div className="wallet-merge__summary-card">
              <div className="wallet-merge__summary-title">VÍ NGUỒN</div>
              <div className="wallet-merge__summary-name">{srcName}</div>
              <div className="wallet-merge__summary-row">
                <span>Tiền tệ</span>
                <span>{srcCurrency}</span>
              </div>
              <div className="wallet-merge__summary-row">
                <span>Số dư (demo)</span>
                <span>
                  {srcBalance.toLocaleString("vi-VN")} {srcCurrency}
                </span>
              </div>
              <div className="wallet-merge__summary-row">
                <span>Giao dịch (demo)</span>
                <span>{srcTxCount}</span>
              </div>
            </div>

            <div className="wallet-merge__summary-card">
              <div className="wallet-merge__summary-title">VÍ ĐÍCH</div>
              <div className="wallet-merge__summary-name">{tgtName}</div>
              <div className="wallet-merge__summary-row">
                <span>Tiền tệ hiện tại</span>
                <span>{tgtCurrency}</span>
              </div>
              <div className="wallet-merge__summary-row">
                <span>Số dư hiện tại </span>
                <span>
                  {tgtBalance.toLocaleString("vi-VN")} {tgtCurrency}
                </span>
              </div>
              <div className="wallet-merge__summary-row">
                <span>Giao dịch hiện tại </span>
                <span>{tgtTxCount}</span>
              </div>
            </div>
          </div>

          <div className="wallet-merge__section-divider" />

          <div className="wallet-merge__section-block">
            <div className="wallet-merge__section-title">
              Kết quả sau khi gộp
            </div>
            <div className="wallet-merge__result-grid">
              <div className="wallet-merge__result-row">
                <span>Ví đích</span>
                <span>{tgtName}</span>
              </div>
              <div className="wallet-merge__result-row">
                <span>Loại tiền sau gộp</span>
                <span>{finalCurrency}</span>
              </div>
              <div className="wallet-merge__result-row">
                <span>Số dư dự kiến </span>
                <span>
                  {finalBalance.toLocaleString("vi-VN")} {finalCurrency}
                </span>
              </div>
              <div className="wallet-merge__result-row">
                <span>Tổng giao dịch </span>
                <span>{srcTxCount + tgtTxCount}</span>
              </div>
            </div>
          </div>

          <div className="wallet-merge__section-block">
            <div className="wallet-merge__section-title">
              Danh mục cho giao dịch gộp
            </div>
            <p className="wallet-merge__hint">
              Giao dịch gộp sẽ được ghi nhận với danh mục bạn chọn.
            </p>
            <label className="wallet-form__full">
              <select
                value={mergeCategoryId}
                onChange={(e) => setMergeCategoryId(e.target.value)}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="wallet-merge__section-block wallet-merge__section-block--warning">
            <div className="wallet-merge__section-title">
              Xác nhận 
            </div>
            <ul className="wallet-merge__list">
              <li>Ví nguồn sẽ bị xoá sau khi gộp .</li>
              <li>
                Các giao dịch sẽ được chuyển sang ví đích theo loại tiền đã
                chọn.
              </li>
              <li>Hành động này không thể hoàn tác.</li>
            </ul>

            <label className="wallet-merge__agree">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>Tôi đã đọc và đồng ý với điều khoản gộp ví.</span>
            </label>
          </div>

          <div className="wallet-merge__actions">
            <button
              type="button"
              className="wallets-btn wallets-btn--ghost"
              onClick={() => setStep(4)}
            >
              Quay lại
            </button>
            <button
              type="button"
              className="wallets-btn wallets-btn--danger"
              disabled={!agree || !mergeCategoryId}
              onClick={handleConfirmMerge}
            >
              Xác nhận gộp ví
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* =========================
     STEP 6: PROCESSING / SUCCESS
  ========================== */
  const renderStep6Processing = () => (
    <div className="wallets-section wallet-merge__panel">
      <div className="wallet-merge__step-header">
        <div className="wallet-merge__step-label">
           Xử lý và hoàn tất
        </div>
        <div className="wallet-merge__step-pill">Hoàn thành</div>
      </div>

      <div className="wallet-merge__box">
        {processing ? (
          <div className="wallet-merge__processing">
            <div className="wallet-merge__section-title">
              Hệ thống đang gộp ví 
            </div>
            <p className="wallet-merge__hint">
              Đang chuyển số dư & giao dịch sang ví đích...
            </p>
            <div className="wallet-merge__progress-bar">
              <div
                className="wallet-merge__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="wallet-merge__progress-text">
              {progress}% hoàn thành
            </div>
          </div>
        ) : (
          <div className="wallet-merge__success">
            <div className="wallet-merge__section-title">
              Gộp ví thành công 
            </div>
            <p className="wallet-merge__hint">
              Hệ thống đã cập nhật lại số dư & giao dịch theo thiết lập của
              bạn.
            </p>
            <div className="wallet-merge__actions">
              <button
                type="button"
                className="wallets-btn wallets-btn--primary"
                onClick={() => setStep(2)}
              >
                Quay lại danh sách ví
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ==== render theo step ====
  if (step === 2) return renderStep2();
  if (step === 3) return renderStep3DefaultHandling();
  if (step === 4) return renderStep4Currency();
  if (step === 5) return renderStep5Preview();
  return renderStep6Processing();
}

function ConvertTab({ wallet, onConvertToGroup }) {
  return (
    <div className="wallets-section">
      <div className="wallets-section__header">
        <h3>Chuyển thành ví nhóm</h3>
        <span>
          Sau khi chuyển, ví này sẽ trở thành ví nhóm. Bạn có thể thêm thành
          viên ở phần chia sẻ.
        </span>
      </div>
      <form className="wallet-form" onSubmit={onConvertToGroup}>
        <div className="wallet-form__row">
          <div className="wallet-form__full">
            <p style={{ fontSize: 13, color: "#444" }}>
              Tên ví: <strong>{wallet.name}</strong>
              <br />
              Trạng thái:{" "}
              {wallet.isShared ? "Đã là ví nhóm" : "Hiện là ví cá nhân"}
            </p>
          </div>
        </div>
        <div className="wallet-form__footer wallet-form__footer--right">
          <button
            type="submit"
            className="wallets-btn wallets-btn--primary"
            disabled={wallet.isShared}
          >
            {wallet.isShared ? "Đã là ví nhóm" : "Chuyển sang ví nhóm"}
          </button>
        </div>
      </form>
    </div>
  );
}
