// src/components/transactions/TransactionFormModal.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCategoryData } from "../../home/store/CategoryDataContext";
import { useWalletData } from "../../home/store/WalletDataContext";
import { useLanguage } from "../../home/store/LanguageContext";

/* ================== CẤU HÌNH MẶC ĐỊNH ================== */
const EMPTY_FORM = {
  type: "expense",
  walletName: "",
  amount: "",
  date: "",
  category: "Ăn uống",
  note: "",
  currency: "VND",
  attachment: "",
  sourceWallet: "",
  targetWallet: "",
};

// static defaults kept as fallback
const DEFAULT_CATEGORIES = ["Ăn uống", "Di chuyển", "Quà tặng", "Giải trí", "Hóa đơn", "Khác"];

/* WALLETS will be sourced from WalletDataContext; keep default fallback */
const DEFAULT_WALLETS = ["Ví tiền mặt", "Techcombank", "Momo", "Ngân hàng A", "Ngân hàng B"];

/* ================== Autocomplete + Select Input ================== */
function WalletSelectInput({ label, value, onChange, options, placeholder, id }) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => setInputValue(value), [value]);

  const handleInput = (e) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  const handleSelect = (e) => {
    const selected = e.target.value;
    setInputValue(selected);
    onChange(selected);
  };

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      <div className="d-flex gap-2">
        <input
          list={id}
          className="form-control flex-grow-1"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInput}
          required
        />
        <select
          className="form-select"
          style={{ width: "auto", flexShrink: 0 }}
          onChange={handleSelect}
          value={options.includes(inputValue) ? inputValue : ""}
        >
          <option value="">{t("transactions.form.select_option")}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <datalist id={id}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}

/* ================== TransactionFormModal ================== */
export default function TransactionFormModal({
  open,
  mode = "create",
  initialData,
  onSubmit,
  onClose,
  variant = "external",
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY_FORM);
  const [attachmentPreview, setAttachmentPreview] = useState("");

  /* ========== ESC để đóng ========== */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* ========== Khóa scroll nền khi mở modal ========== */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [open]);

  /* ========== Đổ dữ liệu ban đầu ========== */
  useEffect(() => {
    if (!open) return;
    const now = new Date().toISOString().slice(0, 16);
  if (variant === "internal") {
      if (mode === "edit" && initialData) {
        let dateValue = "";
        if (initialData.date) {
          const d = new Date(initialData.date);
          if (!Number.isNaN(d.getTime())) dateValue = d.toISOString().slice(0, 16);
        }
        setForm({
          ...EMPTY_FORM,
          type: "transfer",
          sourceWallet: initialData.sourceWallet || "",
          targetWallet: initialData.targetWallet || "",
          amount: String(initialData.amount ?? ""),
          date: dateValue || now,
          category: initialData.category || t("transactions.type.transfer"),
          note: initialData.note || "",
          currency: initialData.currency || "VND",
          attachment: initialData.attachment || "",
        });
        setAttachmentPreview(initialData.attachment || "");
      } else {
        setForm({
          ...EMPTY_FORM,
          type: "transfer",
          date: now,
          category: t("transactions.type.transfer"),
        });
        setAttachmentPreview("");
      }
    } else {
      if (mode === "edit" && initialData) {
        let dateValue = "";
        if (initialData.date) {
          const d = new Date(initialData.date);
          if (!Number.isNaN(d.getTime())) dateValue = d.toISOString().slice(0, 16);
        }
        setForm({
          ...EMPTY_FORM,
          type: initialData.type,
          walletName: initialData.walletName,
          amount: String(initialData.amount),
          date: dateValue || now,
          category: initialData.category,
          note: initialData.note || "",
          currency: initialData.currency || "VND",
          attachment: initialData.attachment || "",
        });
        setAttachmentPreview(initialData.attachment || "");
      } else {
        setForm({ ...EMPTY_FORM, date: now });
        setAttachmentPreview("");
      }
    }
  }, [open, mode, initialData, variant]);

  // get shared categories and wallets
  const { expenseCategories, incomeCategories } = useCategoryData();
  const { wallets: walletList } = useWalletData();

  const categoryOptions = form.type === "income"
    ? (incomeCategories?.map(c => c.name) || DEFAULT_CATEGORIES)
    : (expenseCategories?.map(c => c.name) || DEFAULT_CATEGORIES);

  const walletOptions = (walletList && walletList.length > 0)
    ? walletList.map(w => w.name)
    : DEFAULT_WALLETS;

  // Keep form.category in sync when type changes or categories update
  useEffect(() => {
    if (variant === "internal") return; // internal uses fixed category
    if (!categoryOptions || categoryOptions.length === 0) return;
    if (!form.category || !categoryOptions.includes(form.category)) {
      setForm(f => ({ ...f, category: categoryOptions[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type, expenseCategories, incomeCategories]);

  /* ========== Handlers ========== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setForm((f) => ({ ...f, attachment: "" }));
      setAttachmentPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, attachment: url }));
    setAttachmentPreview(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (variant === "internal") {
      onSubmit?.({
        sourceWallet: form.sourceWallet,
        targetWallet: form.targetWallet,
        amount: Number(form.amount || 0),
        date: form.date,
        note: form.note || "",
        currency: form.currency || "VND",
        attachment: form.attachment,
      });
    } else {
      onSubmit?.({
        ...form,
        amount: Number(form.amount || 0),
        date: form.date,
      });
    }
  };

  if (!open) return null;

  /* ========== UI ========== */
  const modalUI = (
    <>
      <style>{`
        @keyframes tfmFadeIn { from { opacity: 0 } to { opacity: 1 } }

        .transaction-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 2147483647;
          animation: tfmFadeIn .2s ease-out;
        }

        .transaction-modal-content {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.25);
          width: 520px;
          max-width: 95%;
          overflow: hidden;
          z-index: 2147483648;
        }
      `}</style>

      <div
        className="transaction-modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="transaction-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header border-0 pb-0" style={{ padding: "16px 22px 8px" }}>
            <h5 className="modal-title fw-semibold">
              {mode === "create"
                ? variant === "internal"
                  ? t("transactions.form.title_create_transfer")
                  : t("transactions.form.title_create")
                : variant === "internal"
                ? t("transactions.form.title_edit_transfer")
                : t("transactions.form.title_edit")}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ padding: "12px 22px 18px" }}>
              {variant === "external" ? (
                <>
                  {/* ===== GIAO DỊCH NGOÀI ===== */}
                  <div className="mb-3">
                    <div className="form-label fw-semibold">{t("transactions.form.type_label")}</div>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn type-pill ${form.type === "income" ? "active" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, type: "income" }))}
                      >
                        {t("transactions.type.income")}
                      </button>
                      <button
                        type="button"
                        className={`btn type-pill ${form.type === "expense" ? "active" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, type: "expense" }))}
                      >
                        {t("transactions.type.expense")}
                      </button>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <WalletSelectInput
                        id="wallet-options"
                        label={t("transactions.form.wallet")}
                        value={form.walletName}
                        onChange={(v) => setForm((f) => ({ ...f, walletName: v }))}
                        placeholder={t("transactions.form.wallet_placeholder")}
                        options={walletOptions}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t("transactions.form.amount")}</label>
                      <div className="input-group">
                        <input
                          type="number"
                          name="amount"
                          className="form-control"
                          value={form.amount}
                          onChange={handleChange}
                          required
                        />
                        <span className="input-group-text">{form.currency}</span>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t("transactions.form.date")}</label>
                      <input
                        type="datetime-local"
                        name="date"
                        className="form-control"
                        value={form.date}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <WalletSelectInput
                        id="category-options"
                        label={t("transactions.form.category")}
                        value={form.category}
                        onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                        placeholder={t("transactions.form.category_placeholder")}
                        options={categoryOptions}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">{t("transactions.form.note")}</label>
                      <textarea
                        name="note"
                        className="form-control"
                        rows={2}
                        value={form.note}
                        onChange={handleChange}
                        placeholder={t("transactions.form.note_placeholder")}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">{t("transactions.form.attachment")}</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      {attachmentPreview && (
                        <div className="mt-2">
                          <img
                            src={attachmentPreview}
                            alt="Đính kèm"
                            style={{
                              maxWidth: 180,
                              maxHeight: 140,
                              borderRadius: 12,
                              objectFit: "cover",
                              border: "1px solid #e5e7eb",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* ===== CHUYỂN TIỀN ===== */
                <div className="row g-3">
                  <div className="col-12">
                    <div className="form-label fw-semibold mb-0">{t("transactions.form.transfer_legend")}</div>
                    <div className="text-muted small">
                      {t("transactions.form.transfer_hint")}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <WalletSelectInput
                      id="source-wallet"
                      label={t("transactions.form.source_wallet")}
                      value={form.sourceWallet}
                      onChange={(v) => setForm((f) => ({ ...f, sourceWallet: v }))}
                      placeholder={t("transactions.form.source_wallet_placeholder")}
                      options={walletOptions}
                    />
                  </div>

                  <div className="col-md-6">
                    <WalletSelectInput
                      id="target-wallet"
                      label={t("transactions.form.target_wallet")}
                      value={form.targetWallet}
                      onChange={(v) => setForm((f) => ({ ...f, targetWallet: v }))}
                      placeholder={t("transactions.form.target_wallet_placeholder")}
                      options={walletOptions}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t("transactions.form.amount")}</label>
                    <div className="input-group">
                      <input
                        type="number"
                        name="amount"
                        className="form-control"
                        value={form.amount}
                        onChange={handleChange}
                        required
                      />
                      <span className="input-group-text">{form.currency}</span>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t("transactions.form.date")}</label>
                    <input
                      type="datetime-local"
                      name="date"
                      className="form-control"
                      value={form.date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">{t("transactions.form.note")}</label>
                    <textarea
                      name="note"
                      className="form-control"
                      rows={2}
                      value={form.note}
                      onChange={handleChange}
                      placeholder={t("transactions.form.transfer_note_placeholder")}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer border-0 pt-0" style={{ padding: "8px 22px 16px" }}>
              <button type="button" className="btn btn-light" onClick={onClose}>
                {t("transactions.btn.cancel")}
              </button>
              <button type="submit" className="btn btn-primary">
                {t("transactions.btn.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(modalUI, document.body);
}
