import React, { useState } from "react";

export default function WalletGroupCreateModal({ open, onClose, onSubmit }) {
  // ⚠️ Backend không có concept "Wallet Groups"
  // Component này giữ lại để UI không bị lỗi, nhưng sẽ show message "not supported"
  
  const [form, setForm] = useState({ name: "", description: "", isDefault: false, budgetWalletId: "" });
  
  const wallets = []; // Empty since no context
  const sharedWallets = [];

  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({ name: "", currency: "VND", type: "BANK", openingBalance: 0 });

  if (!open) return null;

  const canSubmit = !!form.name.trim();

  const handleQuickCreateWallet = async () => {
    // ⚠️ Not supported
    console.warn("Quick create wallet in group not supported");
    setQuickOpen(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // ⚠️ Backend không có Wallet Groups API
    if (onSubmit) {
      onSubmit(form);
    }
    onClose?.();
  };

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={submit}>
          <div className="modal-header">
            <h5 className="modal-title">Tạo nhóm ví</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Tên nhóm ví *</label>
              <input className="form-control"
                     value={form.name}
                     onChange={e => setForm({ ...form, name: e.target.value })}/>
            </div>

            <div className="mb-3">
              <label className="form-label">Mô tả</label>
              <textarea className="form-control" rows="2"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}/>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label mb-0">Ví ngân sách của nhóm</label>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setQuickOpen(v => !v)}>
                + Tạo nhanh ví nhóm
              </button>
            </div>

            {quickOpen && (
              <div className="border rounded p-3 mb-3 bg-light">
                <div className="row g-2">
                  <div className="col-md-5">
                    <input className="form-control" placeholder="Tên ví *"
                           value={quick.name} onChange={e=>setQuick(p=>({ ...p, name:e.target.value }))}/>
                  </div>
                  <div className="col-md-3">
                    <select className="form-select" value={quick.type} onChange={e=>setQuick(p=>({ ...p, type:e.target.value }))}>
                      <option value="BANK">BANK</option>
                      <option value="CASH">CASH</option>
                      <option value="EWALLET">EWALLET</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select className="form-select" value={quick.currency} onChange={e=>setQuick(p=>({ ...p, currency:e.target.value }))}>
                      <option>VND</option><option>USD</option><option>EUR</option>
                    </select>
                  </div>
                  <div className="col-md-2 d-grid">
                    <button type="button" className="btn btn-primary" onClick={handleQuickCreateWallet}>Tạo ví</button>
                  </div>
                </div>
              </div>
            )}

            <select className="form-select mb-3" value={form.budgetWalletId}
                    onChange={e=>setForm({ ...form, budgetWalletId: e.target.value })}>
              <option value="">— Chưa chọn —</option>
              {sharedWallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>

            <div className="form-check">
              <input id="setDefaultGroup" type="checkbox" className="form-check-input"
                     checked={form.isDefault}
                     onChange={e => setForm({ ...form, isDefault: e.target.checked })}/>
              <label className="form-check-label" htmlFor="setDefaultGroup">Đặt làm nhóm mặc định</label>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-light" type="button" onClick={onClose}>Hủy</button>
            <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
              <i className="bi bi-check2 me-1"></i> Tạo nhóm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
