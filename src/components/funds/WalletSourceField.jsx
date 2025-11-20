// src/components/funds/WalletSourceField.jsx
import React, { useMemo, useState } from "react";
import { useLanguage } from "../../home/store/LanguageContext";

export default function WalletSourceField({ required, wallets = [], value, onChange }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      wallets.filter((w) =>
        (w.name || "").toLowerCase().includes(search.toLowerCase())
      ),
    [wallets, search]
  );

  return (
    <div className="funds-field">
      <label>
        {t("funds.form.wallet_source")} {required && <span className="req">*</span>}
      </label>
      <div className="wallet-source">
        <input
          type="text"
          className="wallet-source__search"
          placeholder={t("funds.form.wallet_search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="wallet-source__list">
          {filtered.length === 0 ? (
            <span className="funds-hint">{t("funds.form.wallet_not_found")}</span>
          ) : (
            filtered.map((w) => {
              const selected = String(value) === String(w.id);
              const label = w.currency ? `${w.name} · ${w.currency}` : w.name;

              return (
                <button
                  key={w.id}
                  type="button"
                  className={
                    "wallet-source__item" + (selected ? " is-active" : "")
                  }
                  onClick={() => {
                    onChange && onChange(w.id);
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
          {t("funds.form.wallet_hint")}
        </div>
      </div>
    </div>
  );
}
