import React, { useEffect, useState } from "react";
import { useWalletData } from "../../home/store/WalletDataContext";

const TYPES = ["CASH", "BANK", "EWALLET"];

export default function WalletCreateGroupModal({ open, onClose, currencies = ["VND"], onCreated }) {
  const { createWallet } = useWalletData();

  const [form, setForm] = useState({
    walletName: "",
    type: "BANK",
    currencyCode: currencies[0] || "VND",
    initialBalance: 0,
    description: "",
    setAsDefault: false,
    approvalPolicy: { enabled: false, threshold: "" },
  });

  // cập nhật lại currencyCode khi props currencies thay đổi
  useEffect(() => {
    setForm((f) => ({ ...f, currencyCode: currencies[0] || "VND" }));
  }, [currencies]);

  if (!open) return null;

  const canSubmit = !!form.walletName.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // ✅ Dữ liệu khớp backend WalletController
    const payload = {
      walletName: form.walletName.trim(),
      currencyCode: form.currencyCode,
      type: form.type || "BANK",
      initialBalance: Number(form.initialBalance || 0),
      description: form.description?.trim() || "",
      setAsDefault: form.setAsDefault || false,
      isShared: true, // ✅ ví nhóm
      groupId: null,
      approvalPolicy: form.approvalPolicy.enabled
        ? {
            enabled: true,
            threshold: Number(form.approvalPolicy.threshold || 0),
          }
        : { enabled: false },
    };

    const w = await createWallet(payload); // gọi API qua context
    onCreated?.(w);
    onClose?.();
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,.35)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <form className="modal-content" onSubmit={submit}>
          {/* ================= HEADER ================= */}
          <div className="modal-header">
            <h5 className="modal-title">Tạo ví nhóm</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {/* ================= BODY ================= */}
          <div className="modal-body">
            {/* ====== Tên ví nhóm ====== */}
            <div className="mb-3">
              <label className="form-label">Tên ví nhóm *</label>
              <input
                className="form-control"
                value={form.walletName}
                onChange={(e) => setForm({ ...form, walletName: e.target.value })}
                placeholder="Nhập tên ví nhóm..."
              />
            </div>

            {/* ====== Loại ví, Tiền tệ, Số dư ====== */}
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Loại ví *</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Tiền tệ *</label>
                <select
                  className="form-select"
                  value={form.currencyCode}
                  onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}
                >
                  {(currencies || ["VND"]).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Số dư ban đầu</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={form.initialBalance}
                  onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* ====== Ghi chú ====== */}
            <div className="mt-3">
              <label className="form-label">Ghi chú</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ghi chú cho ví nhóm..."
              />
            </div>

            <hr className="my-4" />

            {/* ====== Chính sách duyệt chi ====== */}
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="apprv"
                checked={form.approvalPolicy.enabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    approvalPolicy: { ...form.approvalPolicy, enabled: e.target.checked },
                  })
                }
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
                  onChange={(e) =>
                    setForm({
                      ...form,
                      approvalPolicy: {
                        ...form.approvalPolicy,
                        threshold: e.target.value,
                      },
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* ================= FOOTER ================= */}
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              Tạo ví nhóm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
