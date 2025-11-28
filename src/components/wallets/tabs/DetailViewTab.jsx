import React, { useState } from "react";

export default function DetailViewTab({
  wallet,
  sharedEmails,
  sharedMembers = [],
  sharedMembersLoading = false,
  sharedMembersError = "",
  canManageSharedMembers = false,
  canInviteMembers = false,
  removingMemberId = null,
  onRemoveSharedMember,
  onQuickShareEmail,
  quickShareLoading = false,
  sharedFilter,
  demoTransactions,
  isLoadingTransactions = false,
}) {
  const [showQuickShareForm, setShowQuickShareForm] = useState(false);
  const [quickShareEmail, setQuickShareEmail] = useState("");
  const [quickShareMessage, setQuickShareMessage] = useState("");

  const toggleQuickShareForm = () => {
    setShowQuickShareForm((prev) => !prev);
    setQuickShareMessage("");
    if (!showQuickShareForm) {
      setQuickShareEmail("");
    }
  };

  const handleQuickShareSubmit = async (event) => {
    event?.preventDefault?.();
    if (!onQuickShareEmail) return;
    setQuickShareMessage("");
    const result = await onQuickShareEmail(quickShareEmail);
    if (result?.success) {
      setQuickShareEmail("");
      setShowQuickShareForm(false);
      setQuickShareMessage("");
    } else if (result?.message) {
      setQuickShareMessage(result.message);
    }
  };

  const fallbackEmails = Array.isArray(sharedEmails) ? sharedEmails : [];
  const displayMembers = sharedMembers.length
    ? sharedMembers
    : fallbackEmails.map((email) => ({ email }));

  const emptyShareMessage = canManageSharedMembers
    ? "Bạn chưa chia sẻ ví này cho ai."
    : sharedFilter === "sharedWithMe"
    ? "Ví này đang được người khác chia sẻ cho bạn."
    : "Chưa có thành viên nào được chia sẻ.";

  const renderShareSection = () => {
    if (sharedMembersLoading) {
      return (
        <p className="wallets-detail__share-empty">Đang tải danh sách chia sẻ...</p>
      );
    }
    if (sharedMembersError) {
      return (
        <p className="wallets-detail__share-error">{sharedMembersError}</p>
      );
    }
    if (!displayMembers.length) {
      return (
        <p className="wallets-detail__share-empty">{emptyShareMessage}</p>
      );
    }

    return (
      <div className="wallet-share-list">
        {displayMembers.map((member) => {
          const key = member.memberId || member.userId || member.email || member.fullName;
          const name = member.fullName || member.name || member.email || "Không rõ tên";
          const detail = member.email && member.email !== name
            ? member.email
            : member.role && member.role !== "OWNER"
              ? member.role
              : "";
          const memberId = member.userId ?? member.memberUserId ?? member.memberId;
          const allowRemove =
            canManageSharedMembers &&
            memberId &&
            (member.role || "").toUpperCase() !== "OWNER";
          const pillClass = allowRemove
            ? "wallet-share-pill"
            : "wallet-share-pill wallet-share-pill--readonly";
          const isRemoving = removingMemberId === memberId;
          return (
            <span key={key || name} className={pillClass}>
              <span className="wallet-share-pill__info">
                {name}
                {detail && <small>{detail}</small>}
              </span>
              {allowRemove && (
                <button
                  type="button"
                  onClick={() => onRemoveSharedMember?.(member)}
                  disabled={isRemoving}
                  aria-label={`Xóa ${name}`}
                >
                  {isRemoving ? "…" : "×"}
                </button>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="wallets-section wallets-section--view">
      <div className="wallets-section__header">
        <h3>Chi tiết ví</h3>
        <span>Thông tin cơ bản, chia sẻ và lịch sử giao dịch.</span>
      </div>

      <div className="wallets-detail-view">
        <div className="wallets-detail-view__col">
          <div className="wallets-detail-view__card">
            <div className="wallets-detail-view__card-header">
              <span>Thông tin &amp; chia sẻ</span>
            </div>

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

            <div className="wallets-detail__share">
              <div className="wallets-detail__share-header">
                <h4>Chia sẻ ví</h4>
                {canInviteMembers && (
                  <button
                    type="button"
                    className="wallet-share-add-btn"
                    onClick={toggleQuickShareForm}
                  >
                    {showQuickShareForm ? "-" : "+"}
                  </button>
                )}
              </div>
              {canInviteMembers && showQuickShareForm && (
                <form className="wallet-share-quick-form" onSubmit={handleQuickShareSubmit}>
                  <input
                    type="email"
                    value={quickShareEmail}
                    onChange={(e) => setQuickShareEmail(e.target.value)}
                    placeholder="example@gmail.com"
                  />
                  <button
                    type="submit"
                    disabled={!quickShareEmail.trim() || quickShareLoading}
                  >
                    {quickShareLoading ? "Đang chia sẻ..." : "Chia sẻ"}
                  </button>
                </form>
              )}
              {quickShareMessage && (
                <p className="wallet-share-quick-message">{quickShareMessage}</p>
              )}
              {renderShareSection()}
            </div>
          </div>
        </div>

        <div className="wallets-detail-view__col wallets-detail-view__col--history">
          <div className="wallets-detail-view__card">
            <div className="wallets-detail-view__card-header">
              <span>Lịch sử giao dịch</span>
              <span className="wallets-detail-view__counter">
                {isLoadingTransactions ? "Đang tải..." : `${demoTransactions.length} giao dịch`}
              </span>
            </div>

            <div className="wallets-detail__history-summary">
              <div className="wallet-detail-item wallet-detail-item--inline">
                <span className="wallet-detail-item__label">
                  Số giao dịch
                </span>
                <span className="wallet-detail-item__value">
                  {isLoadingTransactions ? "..." : demoTransactions.length}
                </span>
              </div>
            </div>

            <div className="wallets-detail__history">
              {isLoadingTransactions ? (
                <p className="wallets-detail__history-empty">
                  Đang tải lịch sử giao dịch...
                </p>
              ) : demoTransactions.length === 0 ? (
                <p className="wallets-detail__history-empty">
                  Chưa có giao dịch cho ví này.
                </p>
              ) : (
                <ul className="wallets-detail__history-list">
                  {demoTransactions.map((tx) => {
                    const txCurrency = tx.currency || wallet?.currency || "VND";
                    const absAmount = Math.abs(tx.amount);
                    
                    // Format số tiền theo currency
                    let formattedAmount = "";
                    if (txCurrency === "USD") {
                      formattedAmount = absAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8
                      });
                    } else {
                      formattedAmount = absAmount.toLocaleString("vi-VN");
                    }
                    
                    return (
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
                            {txCurrency === "USD" ? `$${formattedAmount}` : `${formattedAmount} ${txCurrency}`}
                          </span>
                        </div>

                        <div className="wallets-detail__history-meta">
                          <span className="wallets-detail__history-category">
                            {tx.categoryName || "Danh mục khác"}
                          </span>
                          <span>{tx.timeLabel}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

