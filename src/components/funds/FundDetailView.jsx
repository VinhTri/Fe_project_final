// src/components/funds/FundDetailView.jsx
import React, { useEffect, useState } from "react";
import ConfirmModal from "../common/Modal/ConfirmModal";
import Modal from "../common/Modal/Modal";

const buildFormState = (fund) => ({
  name: fund.name || "",
  hasTerm: !!fund.hasTerm,
  current: fund.current ?? 0,
  target: fund.target ?? "",
  currency: fund.currency || "VND",
  description: fund.description || "",
});

export default function FundDetailView({ fund, onBack, onUpdateFund, onDeleteFund, onDepositFund, onWithdrawFund, onCloseFund, onError }) {
  const isGroup = fund.type === "group";

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => buildFormState(fund));
  const [members, setMembers] = useState(() =>
    Array.isArray(fund.members) ? [...fund.members] : []
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [inputModal, setInputModal] = useState({ open: false, type: null, value: "" });

  // Khi chọn quỹ khác thì reset form + tắt chế độ sửa
  useEffect(() => {
    setIsEditing(false);
    setForm(buildFormState(fund));
    setMembers(Array.isArray(fund.members) ? [...fund.members] : []);
  }, [fund]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ====== MEMBERS (chỉ cho quỹ nhóm) ======
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm(buildFormState(fund));
    setMembers(Array.isArray(fund.members) ? [...fund.members] : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!onUpdateFund) {
      setIsEditing(false);
      return;
    }

    // Map form data to API format
    // Note: API chỉ cho phép update: fundName, frequency, amountPerPeriod, startDate, endDate, note, reminder, autoDeposit
    // Không thể update: fundType, hasDeadline, targetAmount, currentAmount, currencyCode, targetWalletId
    const updateData = {
      fundName: form.name.trim(),
      frequency: fund.frequency || "MONTHLY",
      amountPerPeriod: fund.amountPerPeriod || 0,
      startDate: fund.startDate || new Date().toISOString().split("T")[0],
      endDate: fund.hasTerm && fund.endDate ? fund.endDate : undefined,
      note: form.description.trim() || null,
      reminderEnabled: fund.reminderEnabled || false,
      reminderType: fund.reminderType || "MONTHLY",
      reminderTime: fund.reminderTime || "20:00:00",
      reminderDayOfWeek: fund.reminderDayOfWeek, // Cho WEEKLY
      reminderDayOfMonth: fund.reminderDayOfMonth, // Cho MONTHLY
      reminderMonth: fund.reminderMonth, // Cho YEARLY
      reminderDay: fund.reminderDay, // Cho YEARLY
      autoDepositEnabled: fund.autoDepositEnabled || false,
      autoDepositType: fund.autoDepositType || "FOLLOW_REMINDER",
      sourceWalletId: fund.sourceWalletId, // Cho auto deposit
      autoDepositScheduleType: fund.autoDepositScheduleType, // Cho CUSTOM_SCHEDULE
      autoDepositTime: fund.autoDepositTime, // Cho CUSTOM_SCHEDULE
      autoDepositDayOfWeek: fund.autoDepositDayOfWeek, // Cho WEEKLY auto deposit
      autoDepositDayOfMonth: fund.autoDepositDayOfMonth, // Cho MONTHLY auto deposit
      autoDepositAmount: fund.autoDepositAmount, // Cho CUSTOM_SCHEDULE
    };

    // If group fund, include members
    if (isGroup && members.length > 0) {
      updateData.members = members
        .filter((m) => m.email && m.email.trim())
        .map((m) => ({
          email: m.email.trim(),
          role: m.role === "owner" ? "OWNER" : m.role === "use" || m.role === "manage" ? "CONTRIBUTOR" : "CONTRIBUTOR",
        }));
    }

    try {
      await onUpdateFund({ ...fund, ...updateData });
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating fund:", err);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteFund) return;
    setConfirmDelete(true);
  };

  const confirmDeleteAction = async () => {
    setConfirmDelete(false);
    try {
      await onDeleteFund(fund.fundId || fund.id);
    } catch (err) {
      console.error("Error deleting fund:", err);
    }
  };

  const handleClose = async () => {
    if (!onCloseFund) return;
    setConfirmClose(true);
  };

  const confirmCloseAction = async () => {
    setConfirmClose(false);
    try {
      await onCloseFund(fund.fundId || fund.id);
    } catch (err) {
      console.error("Error closing fund:", err);
    }
  };

  const handleDeposit = () => {
    setInputModal({ open: true, type: "deposit", value: "" });
  };

  const handleWithdraw = () => {
    if (fund.hasTerm) {
      onError?.("Quỹ có thời hạn không thể rút tiền.");
      return;
    }
    setInputModal({ open: true, type: "withdraw", value: "" });
  };

  const handleInputSubmit = async () => {
    const amount = Number(inputModal.value);
    if (!inputModal.value || isNaN(amount) || amount <= 0) {
      onError?.("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    
    setInputModal({ open: false, type: null, value: "" });
    
    if (inputModal.type === "deposit" && onDepositFund) {
      try {
        await onDepositFund(fund.fundId || fund.id, amount);
      } catch (err) {
        console.error("Error depositing to fund:", err);
      }
    } else if (inputModal.type === "withdraw" && onWithdrawFund) {
      try {
        await onWithdrawFund(fund.fundId || fund.id, amount);
      } catch (err) {
        console.error("Error withdrawing from fund:", err);
      }
    }
  };

  const progress =
    fund.target && fund.target > 0
      ? Math.min(100, Math.round((fund.current / fund.target) * 100))
      : null;

  return (
    <div className="fund-detail-layout">
      {/* CỘT TRÁI: THÔNG TIN QUỸ */}
      <div className="fund-detail-card">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h4 className="fund-detail-title mb-1">{fund.name}</h4>
            <div className="fund-detail-chip">
              {fund.type === "personal" ? "Quỹ cá nhân" : "Quỹ nhóm"}
              <span className="mx-1">•</span>
              {fund.hasTerm ? "Có thời hạn" : "Không thời hạn"}
            </div>
          </div>

          {onBack && (
            <button
              type="button"
              className="btn btn-link p-0 small"
              onClick={onBack}
            >
              ← Quay lại danh sách
            </button>
          )}
        </div>

        <div className="mt-3">
          <div className="fund-detail-label">Số dư hiện tại</div>
          <div className="fund-detail-amount">
            {fund.current.toLocaleString("vi-VN")}{" "}
            <span className="fund-detail-currency">
              {fund.currency || "VND"}
            </span>
          </div>

          <div className="mt-2 fund-detail-label">Mục tiêu</div>
          <div className="fund-detail-text">
            {fund.target
              ? `${fund.target.toLocaleString("vi-VN")} ${fund.currency || "VND"}`
              : "Không thiết lập mục tiêu"}
          </div>

          {progress !== null && (
            <div className="mt-2">
              <div className="fund-card__progress">
                <div className="fund-card__progress-bar">
                  <span style={{ width: `${progress}%` }} />
                </div>
                <div className="fund-card__progress-text">
                  {progress}% hoàn thành mục tiêu
                </div>
              </div>
            </div>
          )}

          {fund.description && (
            <>
              <div className="mt-3 fund-detail-label">Ghi chú</div>
              <div className="fund-detail-text">{fund.description}</div>
            </>
          )}

          {/* QUỸ NHÓM: HIỂN THỊ THÀNH VIÊN THAM GIA */}
          {isGroup && (
            <div className="mt-3">
              <div className="fund-detail-label mb-1">Thành viên tham gia</div>
              {members.length === 0 ? (
                <div className="fund-detail-text">
                  Chưa có thành viên được thêm.
                </div>
              ) : (
                <ul className="fund-detail-members list-unstyled mb-0">
                  {members.map((m) => (
                    <li key={m.id}>
                      <strong>{m.name || "Chưa đặt tên"}</strong>{" "}
                      <span className="text-muted">
                        {m.email ? `(${m.email})` : ""}
                      </span>{" "}
                      •{" "}
                      <span className="text-muted">
                        {m.role === "owner"
                          ? "Chủ quỹ"
                          : m.role === "use"
                          ? "Được sử dụng"
                          : m.role === "manage"
                          ? "Quản lý"
                          : "Chỉ xem"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-3 d-flex gap-2 flex-wrap">
            {!isEditing && (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="bi bi-pencil-square me-1" />
                  Sửa quỹ này
                </button>
                {fund.status !== "CLOSED" && (
                  <>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleDeposit}
                    >
                      <i className="bi bi-plus-circle me-1" />
                      Nạp tiền
                    </button>
                    {!fund.hasTerm && (
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={handleWithdraw}
                      >
                        <i className="bi bi-dash-circle me-1" />
                        Rút tiền
                      </button>
                    )}
                  </>
                )}
                {fund.status === "CLOSED" && (
                  <div className="alert alert-warning mb-0">
                    <i className="bi bi-lock me-2" />
                    Quỹ đã được đóng. Không thể nạp tiền hoặc rút tiền.
                  </div>
                )}
                {fund.status !== "CLOSED" && (
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleClose}
                  >
                    <i className="bi bi-lock me-1" />
                    Đóng quỹ
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  <i className="bi bi-trash me-1" />
                  Xóa quỹ
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: FORM CHỈNH SỬA */}
      <div className="fund-detail-form">
        <h5 className="mb-2">Chỉnh sửa quỹ</h5>
        {!isEditing && (
          <p className="text-muted small mb-0">
            Bấm nút <strong>Sửa quỹ này</strong> ở bên trái để bật chế độ chỉnh
            sửa đầy đủ.
          </p>
        )}

        {isEditing && (
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="funds-field">
              <label>Tên quỹ</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="funds-field funds-field--inline">
              <div>
                <label>Loại quỹ</label>
                <input
                  type="text"
                  disabled
                  value={isGroup ? "Quỹ nhóm" : "Quỹ cá nhân"}
                />
                <div className="funds-hint">Không thể thay đổi</div>
              </div>
              <div>
                <label>Thời hạn</label>
                <input
                  type="text"
                  disabled
                  value={form.hasTerm ? "Có thời hạn" : "Không thời hạn"}
                />
                <div className="funds-hint">Không thể thay đổi</div>
              </div>
            </div>

            <div className="funds-field funds-field--inline">
              <div>
                <label>Số dư hiện tại</label>
                <input
                  type="text"
                  disabled
                  value={`${form.current.toLocaleString("vi-VN")} ${form.currency}`}
                />
                <div className="funds-hint">Không thể thay đổi trực tiếp. Dùng nút Nạp tiền / Rút tiền.</div>
              </div>
              <div>
                <label>Mục tiêu</label>
                <input
                  type="text"
                  disabled
                  value={form.target ? `${form.target.toLocaleString("vi-VN")} ${form.currency}` : "Không thiết lập"}
                />
                <div className="funds-hint">Không thể thay đổi</div>
              </div>
            </div>

            <div className="funds-field funds-field--inline">
              <div>
                <label>Tiền tệ</label>
                <input
                  type="text"
                  disabled
                  value={form.currency}
                />
                <div className="funds-hint">Không thể thay đổi</div>
              </div>
              <div>
                <label>Ghi chú</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Mục tiêu, ghi chú thêm..."
                />
              </div>
            </div>

            {/* Nếu là quỹ nhóm thì cho phép sửa danh sách thành viên */}
            {isGroup && (
              <div className="funds-field mt-2">
                <label>Thành viên quỹ</label>
                <div className="funds-hint mb-1">
                  Bạn có thể thêm, xoá và cập nhật thông tin thành viên.
                </div>

                <div className="funds-members">
                  {members.map((m) => (
                    <div key={m.id} className="funds-member-row">
                      <input
                        type="text"
                        placeholder="Tên"
                        value={m.name}
                        onChange={(e) =>
                          handleChangeMember(m.id, "name", e.target.value)
                        }
                      />
                      <input
                        type="email"
                        placeholder="Email"
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
                        <option value="owner">Chủ quỹ</option>
                        <option value="manage">Quản lý</option>
                        <option value="use">Được sử dụng</option>
                        <option value="view">Chỉ xem</option>
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
            )}

            <div className="funds-actions mt-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
              >
                Huỷ
              </button>
              <button type="submit" className="btn-primary">
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Xóa quỹ"
        message={`Bạn có chắc chắn muốn xóa quỹ "${fund.name}"? Hành động này không thể hoàn tác.`}
        okText="Xóa"
        cancelText="Hủy"
        danger={true}
        onOk={confirmDeleteAction}
        onClose={() => setConfirmDelete(false)}
      />

      <ConfirmModal
        open={confirmClose}
        title="Đóng quỹ"
        message={`Bạn có chắc chắn muốn đóng quỹ "${fund.name}"? Quỹ đóng sẽ không thể nạp tiền hoặc rút tiền.`}
        okText="Đóng quỹ"
        cancelText="Hủy"
        onOk={confirmCloseAction}
        onClose={() => setConfirmClose(false)}
      />

      <Modal
        open={inputModal.open}
        onClose={() => setInputModal({ open: false, type: null, value: "" })}
        width={400}
      >
        <div style={{ padding: "1.5rem" }}>
          <h5 className="mb-3">
            {inputModal.type === "deposit" ? "Nạp tiền vào quỹ" : "Rút tiền từ quỹ"}
          </h5>
          <div className="mb-3">
            <label className="form-label">Số tiền ({fund.currency || "VND"})</label>
            <input
              type="number"
              className="form-control"
              min="0"
              step="0.01"
              value={inputModal.value}
              onChange={(e) => setInputModal({ ...inputModal, value: e.target.value })}
              placeholder="Nhập số tiền"
              autoFocus
            />
          </div>
          <div className="d-flex gap-2 justify-content-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setInputModal({ open: false, type: null, value: "" })}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleInputSubmit}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
