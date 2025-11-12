// src/components/wallets/WalletCreateGroupModal.jsx
import React, { useEffect, useState } from "react";
import { walletService } from "../../services/walletService";

const TYPES = ["CASH","BANK","EWALLET"];

export default function WalletCreateGroupModal({ open, onClose, currencies = ["VND"], onCreated }) {
  // ✅ ALL HOOKS MUST BE AT THE TOP LEVEL
  const [form, setForm] = useState({
    name: "",
    type: "BANK",
    currency: currencies[0] || "VND",
    openingBalance: 0,
    note: "",
    approvalPolicy: { enabled: false, threshold: "" },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(f => ({ ...f, currency: currencies[0] || "VND" }));
  }, [currencies]);

  // ✅ EARLY RETURN AFTER ALL HOOKS
  if (!open) return null;

  const canSubmit = !!form.name.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setLoading(true);
      setError("");

      // ✅ CALL API TO CREATE SHARED WALLET
      const payload = {
        walletName: form.name.trim(),
        currencyCode: form.currency,
        initialBalance: Number(form.openingBalance || 0),
        description: form.note?.trim() || "",
        setAsDefault: false,
      };

      const response = await walletService.createWallet(payload);
      
      // ⚠️ Backend tạo wallet bình thường, không có concept "group wallet" riêng
      // Shared wallet = chia sẻ sau khi tạo bằng shareWallet API
      
      onCreated?.(response.wallet);
      onClose?.();
    } catch (err) {
      console.error("❌ Error creating group wallet:", err);
      setError(err.response?.data?.error || "Không thể tạo ví nhóm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,.35)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <form className="modal-content" onSubmit={submit}>
          <div className="modal-header">
            <h5 className="modal-title">Tạo ví nhóm</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
            
            <div className="mb-3">
              <label className="form-label">Tên ví nhóm *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Loại ví *</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Tiền tệ *</label>
                <select
                  className="form-select"
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value })}
                >
                  {(currencies || ["VND"]).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Số dư ban đầu</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={form.openingBalance}
                  onChange={e => setForm({ ...form, openingBalance: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="form-label">Ghi chú</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
              />
            </div>

            <hr className="my-4" />
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="apprv"
                checked={form.approvalPolicy.enabled}
                onChange={e => setForm({
                  ...form,
                  approvalPolicy: { ...form.approvalPolicy, enabled: e.target.checked }
                })}
              />
              <label className="form-check-label" htmlFor="apprv">
                Bật duyệt chi theo ngưỡng
              </label>
            </div>

            {form.approvalPolicy.enabled && (
              <div className="mt-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ngưỡng duyệt (VND)"
                  value={form.approvalPolicy.threshold}
                  onChange={e => setForm({
                    ...form,
                    approvalPolicy: { ...form.approvalPolicy, threshold: e.target.value }
                  })}
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              Tạo ví nhóm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
