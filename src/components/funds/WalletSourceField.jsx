// src/components/funds/WalletSourceField.jsx
import React, { useMemo, useState } from "react";

export default function WalletSourceField({ required, wallets = [], value, onChange }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      wallets.filter((w) => {
        const walletName = w.name || w.walletName || "";
        return walletName.toLowerCase().includes(search.toLowerCase());
      }),
    [wallets, search]
  );

  return (
    <div className="funds-field">
      <label>
        Ví nguồn {required && <span className="req">*</span>}
      </label>
      <div className="wallet-source">
        <input
          type="text"
          className="wallet-source__search"
          placeholder="Nhập để tìm ví..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="wallet-source__list">
          {filtered.length === 0 ? (
            <span className="funds-hint">Không tìm thấy ví phù hợp.</span>
          ) : (
            filtered.map((w) => {
              const walletId = w.walletId || w.id;
              const walletName = w.name || w.walletName || "Unnamed Wallet";
              const selected = String(value) === String(walletId);
              const currency = w.currency || w.currencyCode || "";
              const label = currency ? `${walletName} · ${currency}` : walletName;

              return (
                <button
                  key={w.id}
                  type="button"
                  className={
                    "wallet-source__item" + (selected ? " is-active" : "")
                  }
                  onClick={() => {
                    const walletId = w.walletId || w.id;
                    onChange && onChange(walletId);
                    setSearch(label);
                  }}
                >
                  {label}
                </button>
              );
            })
          )}
        </div>

        <div className="funds-hint">
          Hiển thị các ví phù hợp với loại quỹ hiện tại (cá nhân / nhóm). Kéo
          ngang nếu danh sách dài.
        </div>
      </div>
    </div>
  );
}
