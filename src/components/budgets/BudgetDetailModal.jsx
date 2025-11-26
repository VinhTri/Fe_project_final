import React from "react";
import Modal from "../common/Modal/Modal";

export default function BudgetDetailModal({ open, budget, usage, wallets = [], onClose, onEdit, onRemind }) {
  if (!open || !budget) return null;

  // Format số tiền - giống formatMoney trong WalletsPage và TransactionsPage
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

  // Lấy currency từ wallet của budget
  const getBudgetCurrency = () => {
    if (!budget || !budget.walletId) {
      return "VND"; // Mặc định VND nếu không có wallet hoặc áp dụng cho tất cả ví
    }
    const wallet = wallets.find((w) => w.id === budget.walletId);
    return wallet?.currency || "VND";
  };

  const budgetCurrency = getBudgetCurrency();

  const statusLabel = {
    healthy: "Đang ổn",
    warning: "Sắp đạt ngưỡng",
    over: "Đã vượt hạn mức",
  };

  const statusTone = {
    healthy: "success",
    warning: "warning",
    over: "danger",
  }[usage?.status || "healthy"] || "success";
  const percent = usage?.percent ?? 0;
  const limit = budget.limitAmount || 0;
  const spent = usage?.spent || 0;
  const remaining = usage?.remaining ?? limit - spent;
  const rangeLabel = budget.startDate && budget.endDate
    ? `${new Date(budget.startDate).toLocaleDateString("vi-VN")} - ${new Date(budget.endDate).toLocaleDateString("vi-VN")}`
    : "Chưa thiết lập";

  return (
    <Modal open={open} onClose={onClose} width={620}>
      <div className="budget-detail-modal">
        <div className="budget-detail-header">
          <div>
            <p className="eyebrow-text">Tổng quan hạn mức</p>
            <h4>{budget.categoryName}</h4>
            <span className="text-muted">Áp dụng cho ví: {budget.walletName || "Tất cả ví"}</span>
          </div>
          <span className={`budget-status-chip ${statusTone}`}>
            {statusLabel[usage?.status || "healthy"]}
          </span>
        </div>

        <div className="budget-detail-grid">
          <div>
            <label>Hạn mức</label>
            <p>{formatMoney(limit, budgetCurrency)}</p>
          </div>
          <div>
            <label>Đã chi</label>
            <p className={spent > limit ? "text-danger" : ""}>{formatMoney(spent, budgetCurrency)}</p>
          </div>
          <div>
            <label>Còn lại</label>
            <p className={remaining < 0 ? "text-danger" : "text-success"}>{formatMoney(remaining, budgetCurrency)}</p>
          </div>
          <div>
            <label>Khoảng thời gian</label>
            <p>{rangeLabel}</p>
          </div>
        </div>

        <div className="budget-detail-body">
          <div className="budget-detail-chart">
            <div className="budget-detail-chart-ring">
              <span>{Math.min(percent, 999)}%</span>
              <small>Đã dùng</small>
            </div>
          </div>
          <div className="budget-detail-info">
            <p>
              Hạn mức sẽ gửi cảnh báo khi đạt <strong>{budget.alertPercentage ?? 80}%</strong> tổng hạn mức.
            </p>
            {budget.note && <p className="budget-detail-note">Ghi chú: {budget.note}</p>}
            <ul>
              <li>Danh mục: {budget.categoryName}</li>
              <li>Ví áp dụng: {budget.walletName || "Tất cả ví"}</li>
              <li>Ngày tạo: {budget.createdAt ? new Date(budget.createdAt).toLocaleDateString("vi-VN") : "--"}</li>
            </ul>
          </div>
        </div>

        <div className="budget-detail-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={() => onRemind?.(budget)}>
            Gửi nhắc nhở
          </button>
          <div className="ms-auto d-flex gap-2">
            <button type="button" className="btn btn-light" onClick={onClose}>
              Đóng
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onEdit?.(budget)}>
              Chỉnh sửa hạn mức
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
