// src/components/funds/GroupTermForm.jsx
// src/components/funds/GroupTermForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import WalletSourceField from "./WalletSourceField";
import ReminderBlock from "./ReminderBlock";
import AutoTopupBlock from "./AutoTopupBlock";
import { calcEstimateDate } from "./fundUtils";
import { useLanguage } from "../../home/store/LanguageContext";

export default function GroupTermForm({ wallets = [] }) {
  const { t } = useLanguage();
  const [srcWalletId, setSrcWalletId] = useState(null);
  const selectedWallet = useMemo(
    () =>
      wallets.find((w) => String(w.id) === String(srcWalletId)) || null,
    [wallets, srcWalletId]
  );

  const currentBalance = Number(selectedWallet?.balance || 0);
  const currency = selectedWallet?.currency || "";

  const currentBalanceText = selectedWallet
    ? `${currentBalance.toLocaleString("vi-VN")} ${currency}`
    : "";

  const [targetAmount, setTargetAmount] = useState("");
  const [targetError, setTargetError] = useState("");

  const [freq, setFreq] = useState("month");
  const [periodAmount, setPeriodAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [estimateText, setEstimateText] = useState("");

  const [reminderOn, setReminderOn] = useState(false);
  const [autoTopupOn, setAutoTopupOn] = useState(false);

  const [members, setMembers] = useState([]);

  // validate target
  useEffect(() => {
    if (!selectedWallet || !targetAmount) {
      setTargetError("");
      return;
    }

    const tVal = Number(targetAmount);
    if (Number.isNaN(tVal) || tVal <= 0) {
      setTargetError(t("funds.form.target_invalid"));
      return;
    }

    if (tVal <= currentBalance) {
      setTargetError(
        t("funds.form.target_error_balance")
          .replace("{balance}", currentBalance.toLocaleString("vi-VN"))
          .replace("{currency}", currency)
      );
      return;
    }

    setTargetError("");
  }, [targetAmount, selectedWallet, currentBalance, currency, t]);

  // ước tính ngày hoàn thành
  useEffect(() => {
    if (!selectedWallet) {
      setEstimateText("");
      return;
    }

    const tVal = Number(targetAmount);
    const p = Number(periodAmount);

    if (
      !targetAmount ||
      !periodAmount ||
      Number.isNaN(tVal) ||
      Number.isNaN(p) ||
      p <= 0
    ) {
      setEstimateText("");
      return;
    }
    if (tVal <= currentBalance) {
      setEstimateText("");
      return;
    }

    const need = tVal - currentBalance;
    const periods = Math.ceil(need / p);
    if (!periods || periods <= 0) {
      setEstimateText("");
      return;
    }

    const base = startDate || new Date().toISOString().slice(0, 10);
    const doneDate = calcEstimateDate(base, freq, periods);
    if (!doneDate) {
      setEstimateText("");
      return;
    }

    const dateStr = doneDate.toLocaleDateString("vi-VN");
    let unitText = "";
    switch (freq) {
      case "day":
        unitText = `${periods} ${t("funds.form.freq_day").toLowerCase()}`;
        break;
      case "week":
        unitText = `${periods} ${t("funds.form.freq_week").toLowerCase()}`;
        break;
      case "month":
        unitText = `${periods} ${t("funds.form.freq_month").toLowerCase()}`;
        break;
      case "year":
        unitText = `${periods} ${t("funds.form.freq_year").toLowerCase()}`;
        break;
      default:
        break;
    }

    setEstimateText(
      t("funds.form.estimate_text")
        .replace("{duration}", unitText)
        .replace("{date}", dateStr)
    );
  }, [selectedWallet, targetAmount, periodAmount, freq, startDate, currentBalance, t]);

  // member handlers
  const handleAddMember = () => {
    setMembers((prev) => [
      ...prev,
      { id: Date.now(), name: "", email: "", role: "view" },
    ]);
  };

  const handleChangeMember = (id, field, value) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleRemoveMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSave = () => {
    if (!selectedWallet) {
      alert(t("funds.form.alert_wallet_group"));
      return;
    }
    if (!targetAmount) {
      alert(t("funds.form.alert_target"));
      return;
    }
    if (targetError) {
      alert(t("funds.form.alert_target_invalid"));
      return;
    }

    console.log("Lưu quỹ nhóm có thời hạn", {
      srcWalletId,
      targetAmount,
      freq,
      periodAmount,
      startDate,
      endDate,
      members,
    });
  };

  return (
    <div className="funds-grid">
      <div className="funds-fieldset">
        <div className="funds-fieldset__legend">{t("funds.form.info_legend_group")}</div>

        <div className="funds-field">
          <label>
            {t("funds.form.name_group")} <span className="req">*</span>
          </label>
          <input
            type="text"
            maxLength={50}
            placeholder={t("funds.form.name_placeholder_group")}
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
            <label>{t("funds.form.create_date")}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="funds-fieldset">
        <div className="funds-fieldset__legend">{t("funds.form.target_legend")}</div>

        <div className="funds-field">
          <label>
            {t("funds.form.target_amount")} {currency && <span>({currency})</span>}
          </label>
          <input
            type="number"
            min={0}
            placeholder={t("funds.form.target_placeholder")}
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
          <div className="funds-hint">
            {t("funds.form.target_hint")}
          </div>
          {targetError && <div className="funds-error">{targetError}</div>}
        </div>

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
            <input
              type="number"
              min={0}
              placeholder={t("funds.form.period_placeholder")}
              value={periodAmount}
              onChange={(e) => setPeriodAmount(e.target.value)}
            />
            <div className="funds-hint">
              {t("funds.form.period_hint")}
            </div>
            {estimateText && (
              <div className="funds-hint funds-hint--strong">
                {estimateText}
              </div>
            )}
          </div>
        </div>

        <div className="funds-field funds-field--inline">
          <div>
            <label>{t("funds.form.start_date")}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label>{t("funds.form.end_date")}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
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

      <div className="funds-fieldset">
        <div className="funds-fieldset__legend">{t("funds.form.members")}</div>

        <div className="funds-hint" dangerouslySetInnerHTML={{ __html: t("funds.form.members_hint") }} />

        <div className="funds-members">
          {members.map((m) => (
            <div key={m.id} className="funds-member-row">
              <input
                type="text"
                placeholder={t("funds.form.member_name_placeholder")}
                value={m.name}
                onChange={(e) =>
                  handleChangeMember(m.id, "name", e.target.value)
                }
              />
              <input
                type="email"
                placeholder={t("funds.form.member_email_placeholder")}
                value={m.email}
                onChange={(e) =>
                  handleChangeMember(m.id, "email", e.target.value)
                }
              />
              <select
                value={m.role}
                onChange={(e) =>
                  handleChangeMember(m.id, "role", e.target.value)
                }
              >
                <option value="view">{t("funds.detail.role.view")}</option>
                <option value="use">{t("funds.detail.role.use")}</option>
              </select>
              <button
                type="button"
                className="btn-icon"
                onClick={() => handleRemoveMember(m.id)}
              >
                <i className="bi bi-x" />
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn-link"
            onClick={handleAddMember}
          >
            <i className="bi bi-person-plus me-1" />
            {t("funds.form.add_member")}
          </button>
        </div>
      </div>

      <div className="funds-fieldset funds-fieldset--full">
        <div className="funds-field">
          <label>{t("funds.form.note")}</label>
          <textarea rows={3} placeholder={t("funds.form.note_placeholder_group")} />
        </div>

        <div className="funds-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              console.log("Hủy tạo quỹ nhóm có thời hạn")
            }
          >
            {t("funds.form.cancel")}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
          >
            {t("funds.form.save_group")}
          </button>
        </div>
      </div>
    </div>
  );
}
