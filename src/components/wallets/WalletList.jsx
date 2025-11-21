import React from "react";

export default function WalletList({
  activeTab,
  onTabChange,
  personalCount,
  groupCount,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  wallets,
  selectedId,
  onSelectWallet,
}) {
  return (
    <div className="wallets-list-panel">
      {/* Tabs */}
      <div className="wallets-list-panel__tabs">
        <button
          className={
            activeTab === "personal"
              ? "wallets-tab wallets-tab--active"
              : "wallets-tab"
          }
          onClick={() => onTabChange("personal")}
        >
          Ví cá nhân
          {personalCount > 0 && (
            <span className="wallets-tab__badge">{personalCount}</span>
          )}
        </button>
        <button
          className={
            activeTab === "group"
              ? "wallets-tab wallets-tab--active"
              : "wallets-tab"
          }
          onClick={() => onTabChange("group")}
        >
          Ví nhóm
          {groupCount > 0 && (
            <span className="wallets-tab__badge">{groupCount}</span>
          )}
        </button>
      </div>

      {/* Search + Sort */}
      <div className="wallets-list-panel__controls">
        <div className="wallets-list-panel__search">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc ghi chú ví…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="wallets-list-panel__sort">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="default">Sắp xếp: Mặc định</option>
            <option value="name_asc">Tên (A → Z)</option>
            <option value="balance_desc">Số dư (cao → thấp)</option>
            <option value="balance_asc">Số dư (thấp → cao)</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="wallets-list-panel__list">
        {wallets.length === 0 && (
          <div className="wallets-list__empty">
            Không có ví nào trong mục này.
          </div>
        )}

        {wallets.map((w) => {
          const isActive = selectedId && String(selectedId) === String(w.id);
          const balance = Number(w.balance ?? w.current ?? 0) || 0;
          return (
            <button
              key={w.id}
              className={
                isActive
                  ? "wallets-list-item wallets-list-item--active"
                  : "wallets-list-item"
              }
              onClick={() => onSelectWallet(w.id)}
            >
              <div className="wallets-list-item__header">
                <span className="wallets-list-item__name">
                  {w.name || "Chưa đặt tên"}
                </span>
                <div className="wallets-list-item__pill-row">
                  <span className="wallets-list-item__type">
                    {w.isShared ? "Nhóm" : "Cá nhân"}
                  </span>
                  {w.isDefault && (
                    <span className="wallets-list-item__default-pill">
                      Mặc định
                    </span>
                  )}
                </div>
              </div>
              <div className="wallets-list-item__balance">
                {balance.toLocaleString("vi-VN")} {w.currency || "VND"}
              </div>
              {w.note && (
                <div className="wallets-list-item__desc">{w.note}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

