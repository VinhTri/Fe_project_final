// src/components/funds/FundDetailView.jsx
import React, { useEffect, useState } from "react";
import { formatMoneyInput, getMoneyValue } from "../../utils/formatMoneyInput";

/**
 * Format số tiền - giống formatMoney trong WalletsPage và TransactionsPage
 */
function formatMoney(amount = 0, currency = "VND") {
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
}

const buildFormState = (fund) => ({
  name: fund.name || "",
  hasTerm: !!fund.hasTerm,
  current: fund.current ?? 0,
  target: fund.target ?? "",
  currency: fund.currency || "VND",
  description: fund.description || "",
});

// Helper để format giá trị ban đầu cho input
const formatInitialValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return formatMoneyInput(value);
};

export default function FundDetailView({ fund, onBack, onUpdateFund }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => buildFormState(fund));
  
  // State riêng cho formatted values để hiển thị trong input
  const [currentFormatted, setCurrentFormatted] = useState(() => 
    formatInitialValue(fund.current ?? 0)
  );
  const [targetFormatted, setTargetFormatted] = useState(() => 
    formatInitialValue(fund.target ?? "")
  );

  // Khi chọn quỹ khác thì reset form + tắt chế độ sửa
  useEffect(() => {
    setIsEditing(false);
    const newFormState = buildFormState(fund);
    setForm(newFormState);
    setCurrentFormatted(formatInitialValue(fund.current ?? 0));
    setTargetFormatted(formatInitialValue(fund.target ?? ""));
  }, [fund]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    const resetForm = buildFormState(fund);
    setForm(resetForm);
    setCurrentFormatted(formatInitialValue(fund.current ?? 0));
    setTargetFormatted(formatInitialValue(fund.target ?? ""));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Parse các giá trị từ formatted strings
    const currentValue = getMoneyValue(currentFormatted);
    const targetValue = targetFormatted ? getMoneyValue(targetFormatted) : null;

    const updated = {
      ...fund,
      name: form.name.trim(),
      hasTerm: !!form.hasTerm,
      current: currentValue || 0,
      target: targetValue || null,
      currency: form.currency || "VND",
      description: form.description.trim(),
    };

    onUpdateFund?.(updated);
    setIsEditing(false);
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
              Quỹ tiết kiệm cá nhân
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
            {formatMoney(fund.current, fund.currency || "VND")}
          </div>

          <div className="mt-2 fund-detail-label">Mục tiêu</div>
          <div className="fund-detail-text">
            {fund.target
              ? formatMoney(fund.target, fund.currency || "VND")
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

          <div className="mt-3">
            {!isEditing && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                <i className="bi bi-pencil-square me-1" />
                Sửa quỹ này
              </button>
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
            sửa.
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
                <label>Thời hạn</label>
                <select
                  value={form.hasTerm ? "yes" : "no"}
                  onChange={(e) =>
                    handleChange("hasTerm", e.target.value === "yes")
                  }
                >
                  <option value="yes">Có thời hạn</option>
                  <option value="no">Không thời hạn</option>
                </select>
              </div>
              <div>
                <label>Tiền tệ</label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                />
              </div>
            </div>

            <div className="funds-field funds-field--inline">
              <div>
                <label>Số dư hiện tại</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={currentFormatted}
                  onChange={(e) => {
                    const formatted = formatMoneyInput(e.target.value);
                    setCurrentFormatted(formatted);
                    // Cập nhật form.current với giá trị số để validation
                    const numericValue = getMoneyValue(formatted);
                    handleChange("current", numericValue);
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <label>Mục tiêu (có thể bỏ trống)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={targetFormatted}
                  onChange={(e) => {
                    const formatted = formatMoneyInput(e.target.value);
                    setTargetFormatted(formatted);
                    // Cập nhật form.target với giá trị số để validation
                    const numericValue = formatted ? getMoneyValue(formatted) : null;
                    handleChange("target", numericValue);
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="funds-field">
              <label>Ghi chú</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Mục tiêu, ghi chú thêm..."
              />
            </div>

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
    </div>
  );
}
