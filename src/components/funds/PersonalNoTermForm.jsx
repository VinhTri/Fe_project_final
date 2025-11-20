// src/components/funds/PersonalNoTermForm.jsx
import React, { useMemo, useState } from "react";
import WalletSourceField from "./WalletSourceField";
import ReminderBlock from "./ReminderBlock";
import AutoTopupBlock from "./AutoTopupBlock";
import { useLanguage } from "../../home/store/LanguageContext";

export default function PersonalNoTermForm({ wallets }) {
  const { t } = useLanguage();
  const [srcWalletId, setSrcWalletId] = useState(null);
  const selectedWallet = useMemo(
    () => wallets.find((w) => String(w.id) === String(srcWalletId)) || null,
    [wallets, srcWalletId]
  );

  const currentBalance = Number(selectedWallet?.balance || 0);
  const currency = selectedWallet?.currency || "";

  const currentBalanceText = selectedWallet
    ? `${currentBalance.toLocaleString("vi-VN")} ${currency}`
    : "";

  const [reminderOn, setReminderOn] = useState(false);
  const [autoTopupOn, setAutoTopupOn] = useState(false);
  const [freq, setFreq] = useState("month");

  const handleSave = () => {
    if (!selectedWallet) {
      alert(t("funds.form.alert_wallet"));
      return;
    }
    console.log("Lưu quỹ cá nhân không thời hạn", {
      srcWalletId,
      freq,
    });
  };

  return (
    <div className="funds-grid">
      <div className="funds-fieldset">
        <div className="funds-fieldset__legend">{t("funds.form.info_legend")}</div>

        <div className="funds-field">
          <label>
            {t("funds.form.name")} <span className="req">*</span>
          </label>
          <input
            type="text"
            maxLength={50}
            placeholder={t("funds.form.name_placeholder_no_term")}
          />
        </div>

        <WalletSourceField
          required
          wallets={wallets}
          value={srcWalletId}
          onChange={setSrcWalletId}
        />

        <div className="funds-field funds-field--inline">
          <div>
            <label>{t("funds.form.current_balance")}</label>
            <input
              type="text"
              disabled
              placeholder={t("funds.form.auto_balance")}
              value={currentBalanceText}
            />
          </div>
          <div>
            <label>{t("funds.form.start_date")}</label>
            <input type="date" />
          </div>
        </div>
      </div>

      <div className="funds-fieldset">
        <div className="funds-fieldset__legend">{t("funds.form.freq_legend_optional")}</div>

        <div className="funds-field funds-field--inline">
          <div>
            <label>{t("funds.form.freq_label")}</label>
            <select value={freq} onChange={(e) => setFreq(e.target.value)}>
              <option value="day">{t("funds.form.freq_day")}</option>
              <option value="week">{t("funds.form.freq_week")}</option>
              <option value="month">{t("funds.form.freq_month")}</option>
              <option value="year">{t("funds.form.freq_year")}</option>
            </select>
          </div>
          <div>
            <label>{t("funds.form.period_amount")}</label>
            <input type="number" min={0} placeholder={t("funds.form.period_placeholder_optional")} />
          </div>
        </div>
      </div>

      <ReminderBlock
        reminderOn={reminderOn}
        setReminderOn={setReminderOn}
        freq={freq}
      />

      <AutoTopupBlock
        autoTopupOn={autoTopupOn}
        setAutoTopupOn={setAutoTopupOn}
        dependsOnReminder={reminderOn}
        reminderFreq={freq}
      />

      <div className="funds-fieldset funds-fieldset--full">
        <div className="funds-field">
          <label>{t("funds.form.note")}</label>
          <textarea rows={3} placeholder={t("funds.form.note_placeholder")} />
        </div>

        <div className="funds-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              console.log("Hủy tạo quỹ cá nhân không thời hạn")
            }
          >
            {t("funds.form.cancel")}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
          >
            {t("funds.form.save_personal")}
          </button>
        </div>
      </div>
    </div>
  );
}
