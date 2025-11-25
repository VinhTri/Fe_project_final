// src/components/funds/GroupNoTermForm.jsx
import React, { useMemo, useState } from "react";
import WalletSourceField from "./WalletSourceField";
import ReminderBlock from "./ReminderBlock";
import AutoTopupBlock from "./AutoTopupBlock";

export default function GroupNoTermForm({ wallets, onSubmit, onCancel }) {
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
  const [members, setMembers] = useState([]);

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

  const handleSave = async () => {
    if (!selectedWallet) {
      alert("Vui lòng chọn ví đích trước khi lưu quỹ nhóm.");
      return;
    }
    if (!fundName.trim()) {
      alert("Vui lòng nhập tên quỹ nhóm.");
      return;
    }
    if (members.length === 0) {
      alert("Quỹ nhóm phải có ít nhất 1 thành viên ngoài chủ quỹ.");
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
        reminderDayOfWeek: reminderData.dayOfWeek,
        reminderDayOfMonth: reminderData.dayOfMonth,
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

    const apiMembers = members
      .filter((m) => m.email && m.email.trim())
      .map((m) => ({
        email: m.email.trim(),
        role: m.role === "use" ? "CONTRIBUTOR" : "CONTRIBUTOR",
      }));

    if (apiMembers.length === 0) {
      alert("Vui lòng thêm ít nhất 1 thành viên với email hợp lệ.");
      return;
    }

    const fundData = {
      fundName: fundName.trim(),
      targetWalletId: selectedWallet.walletId || selectedWallet.id,
      fundType: "GROUP",
      hasDeadline: false,
      frequency: apiFrequency,
      amountPerPeriod: periodAmount ? Number(periodAmount) : undefined,
      startDate: startDate || new Date().toISOString().split("T")[0],
      note: note.trim() || null,
      members: apiMembers,
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
        <div className="funds-fieldset__legend">Thông tin quỹ nhóm</div>

        <div className="funds-field">
          <label>
            Tên quỹ nhóm <span className="req">*</span>
          </label>
          <input
            type="text"
            maxLength={50}
            placeholder="Ví dụ: Quỹ sinh hoạt nhóm"
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
      <div className="funds-fieldset">
        <div className="funds-fieldset__legend">Thành viên quỹ</div>
        <div className="funds-hint">
          Thêm thành viên bằng email, gán quyền <strong>xem</strong> hoặc <strong>sử dụng</strong>.
        </div>
        <div className="funds-members">
          {members.map((m) => (
            <div key={m.id} className="funds-member-row">
              <input
                type="text"
                placeholder="Tên"
                value={m.name}
                onChange={(e) => handleChangeMember(m.id, "name", e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                value={m.email}
                onChange={(e) => handleChangeMember(m.id, "email", e.target.value)}
              />
              <select
                value={m.role}
                onChange={(e) => handleChangeMember(m.id, "role", e.target.value)}
              >
                <option value="view">Xem</option>
                <option value="use">Sử dụng</option>
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
            Thêm thành viên
          </button>
        </div>
      </div>

      <div className="funds-fieldset funds-fieldset--full">
        <div className="funds-field">
          <label>Ghi chú</label>
          <textarea
            rows={3}
            placeholder="Ghi chú cho quỹ nhóm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="funds-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel || (() => console.log("Hủy tạo quỹ nhóm không thời hạn"))}
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
              "Lưu quỹ nhóm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
