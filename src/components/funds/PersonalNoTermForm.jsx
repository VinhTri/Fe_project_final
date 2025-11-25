// src/components/funds/PersonalNoTermForm.jsx
import React, { useMemo, useState } from "react";
import WalletSourceField from "./WalletSourceField";
import ReminderBlock from "./ReminderBlock";
import AutoTopupBlock from "./AutoTopupBlock";

export default function PersonalNoTermForm({ wallets, onSubmit, onCancel, onError }) {
  const [srcWalletId, setSrcWalletId] = useState(null);
  const selectedWallet = useMemo(
    () => wallets.find((w) => String(w.walletId || w.id) === String(srcWalletId)) || null,
    [wallets, srcWalletId]
  );

  const currentBalance = Number(selectedWallet?.balance || 0);
  const currency = selectedWallet?.currency || selectedWallet?.currencyCode || "";

  const currentBalanceText = selectedWallet
    ? `${currentBalance.toLocaleString("vi-VN")} ${currency}`
    : "";

  const [fundName, setFundName] = useState("");
  const [note, setNote] = useState("");
  const [startDate, setStartDate] = useState("");
  const [periodAmount, setPeriodAmount] = useState("");
  const [reminderOn, setReminderOn] = useState(false);
  const [autoTopupOn, setAutoTopupOn] = useState(false);
  const [freq, setFreq] = useState("month");
  const [loading, setLoading] = useState(false);
  const [reminderData, setReminderData] = useState(null);
  const [autoDepositData, setAutoDepositData] = useState(null);
  const [sourceWalletId, setSourceWalletId] = useState(null);

  const handleSave = async () => {
    if (!selectedWallet) {
      onError?.("Vui lòng chọn ví đích trước khi lưu quỹ.");
      return;
    }
    if (!fundName.trim()) {
      onError?.("Vui lòng nhập tên quỹ.");
      return;
    }

    const frequencyMap = {
      day: "DAILY",
      week: "WEEKLY",
      month: "MONTHLY",
      year: "YEARLY",
    };
    const apiFrequency = frequencyMap[freq] || "MONTHLY";

    const reminderTypeMap = {
      day: "DAILY",
      week: "WEEKLY",
      month: "MONTHLY",
      year: "YEARLY",
    };

    let finalReminderData = null;
    if (reminderData?.enabled) {
      const reminderType = reminderData.mode === "follow" ? apiFrequency : reminderTypeMap[reminderData.type] || "MONTHLY";
      finalReminderData = {
        reminderEnabled: true,
        reminderType,
        reminderTime: reminderData.time ? `${reminderData.time}:00` : "20:00:00",
        reminderDayOfWeek: reminderData.dayOfWeek, // Cho WEEKLY
        reminderDayOfMonth: reminderData.dayOfMonth, // Cho MONTHLY
        reminderMonth: reminderData.month, // Cho YEARLY (nếu có trong tương lai)
        reminderDay: reminderData.day, // Cho YEARLY (nếu có trong tương lai)
      };
    }

    let finalAutoDepositData = null;
    if (autoDepositData?.enabled) {
      if (autoDepositData.type === "FOLLOW_REMINDER") {
        finalAutoDepositData = {
          autoDepositEnabled: true,
          autoDepositType: "FOLLOW_REMINDER",
          sourceWalletId: sourceWalletId || (selectedWallet.walletId || selectedWallet.id),
        };
      } else {
        const scheduleTypeMap = {
          day: "DAILY",
          week: "WEEKLY",
          month: "MONTHLY",
        };
        finalAutoDepositData = {
          autoDepositEnabled: true,
          autoDepositType: "CUSTOM_SCHEDULE",
          sourceWalletId: sourceWalletId || (selectedWallet.walletId || selectedWallet.id),
          autoDepositScheduleType: scheduleTypeMap[autoDepositData.scheduleType] || "MONTHLY",
          autoDepositTime: autoDepositData.time ? `${autoDepositData.time}:00` : "20:00:00",
          autoDepositDayOfWeek: autoDepositData.dayOfWeek,
          autoDepositDayOfMonth: autoDepositData.dayOfMonth,
          autoDepositAmount: autoDepositData.amount || 0,
        };
      }
    }

    const fundData = {
      fundName: fundName.trim(),
      targetWalletId: selectedWallet.walletId || selectedWallet.id,
      fundType: "PERSONAL",
      hasDeadline: false,
      frequency: apiFrequency,
      amountPerPeriod: periodAmount ? Number(periodAmount) : undefined,
      startDate: startDate || new Date().toISOString().split("T")[0],
      note: note.trim() || null,
      ...finalReminderData,
      ...finalAutoDepositData,
    };

    if (onSubmit) {
      setLoading(true);
      try {
        await onSubmit(fundData);
      } catch (err) {
        console.error("Error submitting fund:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="funds-grid">
      <div className="funds-fieldset">
        <div className="funds-fieldset__legend">Thông tin quỹ</div>

        <div className="funds-field">
          <label>
            Tên quỹ <span className="req">*</span>
          </label>
          <input
            type="text"
            maxLength={50}
            placeholder="Ví dụ: Quỹ khẩn cấp"
            value={fundName}
            onChange={(e) => setFundName(e.target.value)}
            required
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
            <label>Số dư hiện tại của ví</label>
            <input
              type="text"
              disabled
              placeholder="Tự động hiển thị sau khi chọn ví"
              value={currentBalanceText}
            />
          </div>
          <div>
            <label>Ngày bắt đầu</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="funds-fieldset">
        <div className="funds-fieldset__legend">Tần suất gửi (tuỳ chọn)</div>

        <div className="funds-field funds-field--inline">
          <div>
            <label>Tần suất gửi quỹ</label>
            <select value={freq} onChange={(e) => setFreq(e.target.value)}>
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
              <option value="year">Theo năm</option>
            </select>
          </div>
          <div>
            <label>Số tiền gửi mỗi kỳ</label>
            <input
              type="number"
              min={0}
              placeholder="Tuỳ chọn"
              value={periodAmount}
              onChange={(e) => setPeriodAmount(e.target.value)}
            />
          </div>
        </div>
      </div>

      <ReminderBlock
        reminderOn={reminderOn}
        setReminderOn={setReminderOn}
        freq={freq}
        onDataChange={setReminderData}
      />

      <AutoTopupBlock
        autoTopupOn={autoTopupOn}
        setAutoTopupOn={setAutoTopupOn}
        dependsOnReminder={reminderOn}
        reminderFreq={freq}
        sourceWallets={wallets}
        selectedSourceWalletId={sourceWalletId}
        onSourceWalletChange={setSourceWalletId}
        onDataChange={setAutoDepositData}
      />

      <div className="funds-fieldset funds-fieldset--full">
        <div className="funds-field">
          <label>Ghi chú</label>
          <textarea
            rows={3}
            placeholder="Ghi chú cho quỹ này"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="funds-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel || (() => console.log("Hủy tạo quỹ cá nhân không thời hạn"))}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Đang tạo...
              </>
            ) : (
              "Lưu quỹ cá nhân"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
