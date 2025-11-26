// src/components/funds/PersonalTermForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import WalletSourceField from "./WalletSourceField";
import ReminderBlock from "./ReminderBlock";
import AutoTopupBlock from "./AutoTopupBlock";
import { calcEstimateDate } from "./fundUtils";
import { formatMoneyInput, getMoneyValue } from "../../utils/formatMoneyInput";

export default function PersonalTermForm({ wallets, onSubmit, onCancel, onError }) {
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

  const [targetAmount, setTargetAmount] = useState("");
  const [targetAmountFormatted, setTargetAmountFormatted] = useState("");
  const [targetError, setTargetError] = useState("");

  const [freq, setFreq] = useState("month");
  const [periodAmount, setPeriodAmount] = useState("");
  const [periodAmountFormatted, setPeriodAmountFormatted] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [estimateText, setEstimateText] = useState("");

  const [fundName, setFundName] = useState("");
  const [note, setNote] = useState("");
  const [reminderOn, setReminderOn] = useState(false);
  const [autoTopupOn, setAutoTopupOn] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDate();

  // Validate target money
  useEffect(() => {
    if (!selectedWallet || !targetAmountFormatted) {
      setTargetError("");
      return;
    }

    const t = getMoneyValue(targetAmountFormatted);
    if (t <= 0) {
      setTargetError("Vui lòng nhập số tiền mục tiêu hợp lệ.");
      return;
    }

    if (t <= currentBalance) {
      setTargetError(
        `Số tiền mục tiêu phải lớn hơn số dư hiện tại của ví (${currentBalance.toLocaleString(
          "vi-VN"
        )} ${currency}).`
      );
      return;
    }

    setTargetError("");
  }, [targetAmountFormatted, selectedWallet, currentBalance, currency]);

  // Validate dates
  useEffect(() => {
    setDateError("");
    
    if (!startDate && !endDate) {
      return;
    }

    // Validate start date - không được trong quá khứ
    if (startDate) {
      if (startDate < todayDate) {
        setDateError("Ngày tạo quỹ không được ở trong quá khứ.");
        return;
      }
    }

    // Validate end date - phải sau ngày bắt đầu
    if (startDate && endDate) {
      if (endDate <= startDate) {
        setDateError("Ngày kết thúc phải sau ngày bắt đầu.");
        return;
      }
    }
  }, [startDate, endDate, todayDate]);

  // Tính ngày dự kiến hoàn thành
  useEffect(() => {
    if (!selectedWallet) {
      setEstimateText("");
      return;
    }

    const t = getMoneyValue(targetAmountFormatted);
    const p = getMoneyValue(periodAmountFormatted);

    if (
      !targetAmountFormatted ||
      !periodAmountFormatted ||
      t <= 0 ||
      p <= 0
    ) {
      setEstimateText("");
      return;
    }
    if (t <= currentBalance) {
      setEstimateText("");
      return;
    }

    const need = t - currentBalance;
    const periods = Math.ceil(need / p);
    if (!periods || periods <= 0) {
      setEstimateText("");
      return;
    }

    const base = startDate || todayDate;
    const doneDate = calcEstimateDate(base, freq, periods);
    if (!doneDate) {
      setEstimateText("");
      return;
    }

    const dateStr = doneDate.toLocaleDateString("vi-VN");

    const unitText =
      freq === "day"
        ? `${periods} ngày`
        : freq === "week"
        ? `${periods} tuần`
        : freq === "month"
        ? `${periods} tháng`
        : `${periods} năm`;

    setEstimateText(
      `Dự kiến hoàn thành sau khoảng ${unitText}, vào khoảng ngày ${dateStr}.`
    );
  }, [selectedWallet, targetAmountFormatted, periodAmountFormatted, freq, startDate, currentBalance, todayDate]);

  const handleSave = () => {
    if (!selectedWallet) {
      onError?.("Vui lòng chọn ví đích trước khi lưu quỹ.");
      return;
    }
    if (!fundName.trim()) {
      onError?.("Vui lòng nhập tên quỹ.");
      return;
    }
    if (!targetAmountFormatted) {
      onError?.("Vui lòng nhập số tiền mục tiêu quỹ.");
      return;
    }
    if (targetError) {
      onError?.("Số tiền mục tiêu chưa hợp lệ, vui lòng kiểm tra lại.");
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
    if (!endDate) {
      onError?.("Vui lòng chọn ngày kết thúc.");
      return;
    }
    if (endDate <= startDate) {
      onError?.("Ngày kết thúc phải sau ngày bắt đầu.");
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
        hasDeadline: true,
        targetAmount: getMoneyValue(targetAmountFormatted),
        frequency: apiFrequency,
        amountPerPeriod: getMoneyValue(periodAmountFormatted) || 0,
        startDate,
        endDate,
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
            placeholder="Ví dụ: Quỹ mua xe máy"
            value={fundName}
            onChange={(e) => setFundName(e.target.value)}
          />
          <div className="funds-hint">Tối đa 50 ký tự.</div>
        </div>

        <WalletSourceField
          required
          wallets={wallets}
          value={srcWalletId}
          onChange={setSrcWalletId}
        />

        <div className="funds-field">
          <label>Số dư hiện tại của ví</label>
          <input
            type="text"
            disabled
            placeholder="Tự động hiển thị sau khi chọn ví"
            value={currentBalanceText}
          />
        </div>
      </div>

      {/* MỤC TIÊU + TẦN SUẤT */}
      <div className="funds-fieldset">
        <div className="funds-fieldset__legend">Mục tiêu & tần suất gửi</div>

        <div className="funds-field">
          <label>
            Số tiền mục tiêu{" "}
            {currency && <span>({currency})</span>} <span className="req">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Nhập số tiền mục tiêu"
            value={targetAmountFormatted}
            onChange={(e) => {
              const value = e.target.value;
              // Loại bỏ tất cả ký tự không phải số
              const numStr = value.replace(/[^\d]/g, "");
              // Format lại với dấu chấm
              const formatted = formatMoneyInput(numStr);
              setTargetAmountFormatted(formatted);
              setTargetAmount(numStr);
            }}
          />
          <div className="funds-hint">
            Phải lớn hơn số dư ví nguồn. Đơn vị tiền tệ của quỹ sẽ giống ví nguồn.
          </div>
          {targetError && <div className="funds-error">{targetError}</div>}
        </div>

        <div className="funds-field funds-field--inline">
          <div>
            <label>Tần suất gửi</label>
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
              placeholder="Nhập số tiền mỗi kỳ"
              value={periodAmountFormatted}
              onChange={(e) => {
                const value = e.target.value;
                // Loại bỏ tất cả ký tự không phải số
                const numStr = value.replace(/[^\d]/g, "");
                // Format lại với dấu chấm
                const formatted = formatMoneyInput(numStr);
                setPeriodAmountFormatted(formatted);
                setPeriodAmount(numStr);
              }}
            />
            <div className="funds-hint">
              Dùng để gợi ý thời gian hoàn thành.
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
            <label>Ngày bắt đầu</label>
            <input
              type="date"
              min={todayDate}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label>Ngày kết thúc (tùy chọn)</label>
            <input
              type="date"
              min={startDate || todayDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        {dateError && (
          <div className="funds-error" style={{ marginTop: "8px" }}>
            {dateError}
          </div>
        )}
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

      {/* GHI CHÚ + ACTION */}
      <div className="funds-fieldset funds-fieldset--full">
        <div className="funds-field">
          <label>Ghi chú</label>
          <textarea
            rows={3}
            placeholder="Ghi chú cho quỹ này (không bắt buộc)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="funds-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel || (() => console.log("Hủy tạo quỹ"))}
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
