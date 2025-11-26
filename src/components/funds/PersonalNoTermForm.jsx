// src/components/funds/PersonalNoTermForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import WalletSourceField from "./WalletSourceField";
import ReminderBlock from "./ReminderBlock";
import AutoTopupBlock from "./AutoTopupBlock";
import { formatMoneyInput, getMoneyValue } from "../../utils/formatMoneyInput";

export default function PersonalNoTermForm({ wallets, onSubmit, onCancel, onError }) {
  const [srcWalletId, setSrcWalletId] = useState(null);
  const selectedWallet = useMemo(
    () => wallets.find((w) => String(w.id) === String(srcWalletId)) || null,
    [wallets, srcWalletId]
  );

  const currentBalance = Number(selectedWallet?.balance || 0);
  const currency = selectedWallet?.currency || "";

  // Format số dư ví - giống formatMoney trong WalletsPage
  const formatMoney = (amount = 0, currency = "VND") => {
    const numAmount = Number(amount) || 0;
    if (currency === "USD") {
      if (Math.abs(numAmount) < 0.01 && numAmount !== 0) {
        const formatted = numAmount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 8,
        });
        return `$${formatted}`;
      }
      const formatted =
        numAmount % 1 === 0
          ? numAmount.toLocaleString("en-US")
          : numAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 8,
            });
      return `$${formatted}`;
    }
    if (currency === "VND") {
      return `${numAmount.toLocaleString("vi-VN")} VND`;
    }
    if (Math.abs(numAmount) < 0.01 && numAmount !== 0) {
      return `${numAmount.toLocaleString("vi-VN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      })} ${currency}`;
    }
    return `${numAmount.toLocaleString("vi-VN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })} ${currency}`;
  };

  const currentBalanceText = selectedWallet
    ? formatMoney(currentBalance, currency)
    : "";

  const [fundName, setFundName] = useState("");
  const [note, setNote] = useState("");
  const [reminderOn, setReminderOn] = useState(false);
  const [autoTopupOn, setAutoTopupOn] = useState(false);
  const [freq, setFreq] = useState("month");
  const [periodAmountFormatted, setPeriodAmountFormatted] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dateError, setDateError] = useState("");

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDate();

  // Validate start date - không được trong quá khứ
  useEffect(() => {
    setDateError("");
    
    if (!startDate) {
      return;
    }

    if (startDate < todayDate) {
      setDateError("Ngày tạo quỹ không được ở trong quá khứ.");
    }
  }, [startDate, todayDate]);

  const handleSave = () => {
    if (!selectedWallet) {
      onError?.("Vui lòng chọn ví đích trước khi lưu quỹ.");
      return;
    }
    if (!fundName.trim()) {
      onError?.("Vui lòng nhập tên quỹ.");
      return;
    }
    if (!startDate) {
      onError?.("Vui lòng chọn ngày bắt đầu.");
      return;
    }
    if (startDate < todayDate) {
      onError?.("Ngày tạo quỹ không được ở trong quá khứ.");
      return;
    }
    if (dateError) {
      onError?.(dateError);
      return;
    }

    // Map frequency từ form sang API enum format
    const frequencyMap = {
      day: "DAILY",
      week: "WEEKLY",
      month: "MONTHLY",
      year: "YEARLY",
    };
    const apiFrequency = frequencyMap[freq] || "MONTHLY";

    // Call onSubmit if provided
    if (onSubmit) {
      const fundData = {
        fundName: fundName.trim(),
        targetWalletId: selectedWallet.id,
        fundType: "PERSONAL",
        hasDeadline: false,
        frequency: apiFrequency,
        amountPerPeriod: periodAmountFormatted ? getMoneyValue(periodAmountFormatted) : undefined,
        startDate: startDate || todayDate,
        note: note.trim() || null,
      };
      onSubmit(fundData);
    }
  };

  return (
    <div className="funds-grid">
      {/* THÔNG TIN QUỸ */}
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
              min={todayDate}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {dateError && (
              <div className="funds-error" style={{ marginTop: "4px", fontSize: "0.875rem" }}>
                {dateError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TẦN SUẤT GỬI (TÙY CHỌN) */}
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
              type="text"
              inputMode="numeric"
              placeholder="Tuỳ chọn"
              value={periodAmountFormatted}
              onChange={(e) => {
                const value = e.target.value;
                // Loại bỏ tất cả ký tự không phải số
                const numStr = value.replace(/[^\d]/g, "");
                // Format lại với dấu chấm
                const formatted = formatMoneyInput(numStr);
                setPeriodAmountFormatted(formatted);
              }}
            />
          </div>
        </div>
      </div>

      {/* NHẮC NHỞ & TỰ ĐỘNG NẠP */}
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

      {/* GHI CHÚ + ACTIONS */}
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
            onClick={onCancel || (() => console.log("Hủy tạo quỹ không thời hạn"))}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
          >
            Lưu quỹ
          </button>
        </div>
      </div>
    </div>
  );
}
