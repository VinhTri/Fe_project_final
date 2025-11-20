import React from "react";
import Modal from "../common/Modal/Modal";
import { useLanguage } from "../../home/store/LanguageContext";

export default function BudgetWarningModal({
  open,
  categoryName,
  budgetLimit,
  spent,
  transactionAmount,
  totalAfterTx,
  isExceeding,
  onConfirm,
  onCancel,
}) {
  const { t } = useLanguage();
  const remaining = budgetLimit - spent;
  const remainingAfterTx = budgetLimit - totalAfterTx;
  const amountOver = transactionAmount - remaining;
  const percentAfterTx = totalAfterTx && budgetLimit ? (totalAfterTx / budgetLimit) * 100 : 0;

  // Determine title and message based on whether exceeding or approaching
  const isAlert = !isExceeding; // approaching but not exceeding
  const title = isAlert 
    ? t("budgets.warning.title_alert")
    : t("budgets.warning.title_exceed");
  
  const message = isAlert
    ? t("budgets.warning.message_alert").replace("{percent}", Math.round(percentAfterTx))
    : t("budgets.warning.message_exceed");

  return (
    <Modal open={open} onClose={onCancel} width={500}>
      <div className="modal__content" style={{ padding: "2rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ fontWeight: 600, color: "#212529", marginBottom: "0.5rem" }}>
            {isAlert ? (
              <i className="bi bi-exclamation-circle me-2" style={{ color: "#ffc107" }}></i>
            ) : (
              <i className="bi bi-exclamation-triangle me-2" style={{ color: "#dc3545" }}></i>
            )}
            {title}
          </h4>
          <p style={{ color: "#6c757d", fontSize: "0.95rem", margin: 0 }}>
            {message}
          </p>
        </div>

        <div
          style={{
            backgroundColor: isAlert ? "#fff8e1" : "#ffebee",
            borderLeft: `4px solid ${isAlert ? "#ffc107" : "#dc3545"}`,
            padding: "1rem",
            borderRadius: "4px",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 500, color: "#6c757d", marginBottom: "0.25rem", display: "block" }}>
              {t("budgets.warning.category")}
            </label>
            <p style={{ color: "#212529", fontWeight: 500, margin: 0 }}>{categoryName}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ fontWeight: 500, color: "#6c757d", marginBottom: "0.25rem", display: "block" }}>
                {t("budgets.warning.limit")}
              </label>
              <p style={{ color: "#0066cc", fontWeight: 600, margin: 0 }}>
                {budgetLimit.toLocaleString("vi-VN")} VND
              </p>
            </div>
            <div>
              <label style={{ fontWeight: 500, color: "#6c757d", marginBottom: "0.25rem", display: "block" }}>
                {t("budgets.warning.spent")}
              </label>
              <p style={{ color: "#dc3545", fontWeight: 600, margin: 0 }}>
                {spent.toLocaleString("vi-VN")} VND
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontWeight: 500, color: "#6c757d", marginBottom: "0.25rem", display: "block" }}>
                {t("budgets.warning.remaining_before")}
              </label>
              <p
                style={{
                  color: remaining <= 0 ? "#dc3545" : "#28a745",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {remaining.toLocaleString("vi-VN")} VND
              </p>
            </div>
            <div>
              <label style={{ fontWeight: 500, color: "#6c757d", marginBottom: "0.25rem", display: "block" }}>
                {t("budgets.warning.transaction")}
              </label>
              <p style={{ color: "#0099cc", fontWeight: 600, margin: 0 }}>
                {transactionAmount.toLocaleString("vi-VN")} VND
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem", paddingTop: "1rem", borderTop: `1px solid ${isAlert ? "#ffc107" : "#dc3545"}` }}>
            <div>
              <label style={{ fontWeight: 500, color: "#6c757d", marginBottom: "0.25rem", display: "block" }}>
                {t("budgets.warning.total_after")}
              </label>
              <p style={{ color: "#212529", fontWeight: 600, margin: 0 }}>
                {totalAfterTx.toLocaleString("vi-VN")} VND
              </p>
            </div>
            <div>
              <label style={{ fontWeight: 500, color: "#6c757d", marginBottom: "0.25rem", display: "block" }}>
                {t("budgets.warning.remaining_after")}
              </label>
              <p
                style={{
                  color: remainingAfterTx < 0 ? "#dc3545" : remainingAfterTx < budgetLimit * 0.1 ? "#ffc107" : "#28a745",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {remainingAfterTx.toLocaleString("vi-VN")} VND
              </p>
            </div>
          </div>

          {isExceeding && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#ffcccc", borderRadius: "4px" }}>
              <strong style={{ color: "#dc3545" }}>{t("budgets.warning.exceed_amount")}</strong>{" "}
              <span style={{ color: "#dc3545", fontWeight: 600 }}>
                {amountOver.toLocaleString("vi-VN")} VND
              </span>
            </div>
          )}

          {!isExceeding && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#fffbcc", borderRadius: "4px" }}>
              <strong style={{ color: "#ffc107" }}>{t("budgets.warning.usage_after")}</strong>{" "}
              <span style={{ color: "#212529", fontWeight: 600 }}>
                {Math.round(percentAfterTx)}% / 100%
              </span>
            </div>
          )}
        </div>

        <p style={{ fontSize: "0.875rem", color: "#6c757d", marginBottom: "1.5rem" }}>
          {isAlert
            ? t("budgets.warning.hint_alert")
            : t("budgets.warning.hint_exceed")}
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {t("budgets.warning.btn_cancel")}
          </button>
          <button
            type="button"
            className={`btn ${isAlert ? "btn-warning" : "btn-danger"}`}
            onClick={onConfirm}
          >
            {t("budgets.warning.btn_continue")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
