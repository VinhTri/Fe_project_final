// src/components/transactions/TransactionFormModal.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCategoryData } from "../../home/store/CategoryDataContext";
import { useWalletData } from "../../home/store/WalletDataContext";
import { uploadReceipt } from "../../services/file.service";

const API_BASE_URL = "http://localhost:8080";

// Helper function để normalize image URL
const getImageUrl = (url) => {
  if (!url) return "";
  // Nếu URL đã là full URL (bắt đầu bằng http:// hoặc https://), trả về nguyên
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Nếu là relative path, thêm base URL
  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`;
  }
  // Nếu không có / ở đầu, thêm /files/receipt/ (default path)
  return `${API_BASE_URL}/files/receipt/${url}`;
};

/* ================== CẤU HÌNH MẶC ĐỊNH ================== */
const EMPTY_FORM = {
  type: "expense",
  walletName: "",
  amount: "",
  date: "",
  category: "", // Không set mặc định, để người dùng tự chọn
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
          <option value="">Chọn</option>
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
  onError,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

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
          category: initialData.category || "Chuyển tiền giữa các ví",
          note: initialData.note || "",
          currency: initialData.currency || "VND",
          attachment: initialData.attachment || "",
        });
        // Normalize image URL nếu có
        const attachmentUrl1 = initialData.attachment ? getImageUrl(initialData.attachment) : "";
        setAttachmentPreview(attachmentUrl1);
      } else {
        setForm({
          ...EMPTY_FORM,
          type: "transfer",
          date: now,
          category: "Chuyển tiền giữa các ví",
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
        // Normalize image URL nếu có
        const attachmentUrl2 = initialData.attachment ? getImageUrl(initialData.attachment) : "";
        setAttachmentPreview(attachmentUrl2);
      } else {
        setForm({ ...EMPTY_FORM, date: now });
        setAttachmentPreview("");
        // Reset file input khi mở form mới
        setTimeout(() => {
          const fileInput = document.getElementById("file-input-attachment");
          if (fileInput) fileInput.value = "";
        }, 0);
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

  // Keep form.category in sync when type changes (chỉ khi đang edit hoặc đã có category)
  useEffect(() => {
    if (variant === "internal") return; // internal uses fixed category
    if (!categoryOptions || categoryOptions.length === 0) return;
    // Chỉ tự động chọn category đầu tiên nếu:
    // 1. Đang ở chế độ edit (có initialData)
    // 2. Hoặc category hiện tại không hợp lệ (không có trong danh sách)
    // Không tự động chọn khi tạo mới (form.category === "")
    if (mode === "edit" && (!form.category || !categoryOptions.includes(form.category))) {
      setForm(f => ({ ...f, category: categoryOptions[0] }));
    } else if (form.category && !categoryOptions.includes(form.category)) {
      // Nếu category không hợp lệ, reset về rỗng
      setForm(f => ({ ...f, category: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type, expenseCategories, incomeCategories, mode]);

  /* ========== Handlers ========== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setForm((f) => ({ ...f, attachment: "" }));
      setAttachmentPreview("");
      return;
    }

    let previewUrl = null;

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        const errorMsg = "Vui lòng chọn file ảnh (jpg, png, gif, etc.)";
        if (onError) {
          onError(errorMsg);
        }
        // Reset file input
        e.target.value = "";
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        const errorMsg = "Kích thước file không được vượt quá 5MB";
        if (onError) {
          onError(errorMsg);
        }
        // Reset file input
        e.target.value = "";
        return;
      }

      // Hiển thị preview ngay với blob URL
      previewUrl = URL.createObjectURL(file);
      setAttachmentPreview(previewUrl);
      setUploadingFile(true);

      console.log("TransactionFormModal: Uploading file:", file.name);
      const result = await uploadReceipt(file);

      if (result.response.ok && result.data?.url) {
        // Lấy URL từ response
        const imageUrl = result.data.url;
        
        // Lưu URL thật vào form (lưu nguyên URL từ API, có thể là relative hoặc full)
        setForm((f) => ({ ...f, attachment: imageUrl }));
        // Thay preview bằng URL thật (normalize để hiển thị)
        URL.revokeObjectURL(previewUrl);
        setAttachmentPreview(getImageUrl(imageUrl));
        console.log("TransactionFormModal: File uploaded successfully:", imageUrl);
      } else {
        throw new Error(result.data?.error || "Server không trả về URL ảnh");
      }
    } catch (error) {
      console.error("TransactionFormModal: Error uploading file:", error);
      // Giữ preview URL tạm thời, nhưng không lưu vào form
      setForm((f) => ({ ...f, attachment: "" }));
      setAttachmentPreview("");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      // Reset file input
      e.target.value = "";
      // Hiển thị error qua toast từ parent component
      if (onError) {
        onError(error.message || "Không thể upload ảnh. Vui lòng thử lại.");
      }
    } finally {
      setUploadingFile(false);
    }
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
                  ? "Chuyển tiền giữa các ví"
                  : "Thêm Giao dịch Mới"
                : variant === "internal"
                ? "Sửa giao dịch chuyển tiền"
                : "Chỉnh sửa Giao dịch"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ padding: "12px 22px 18px" }}>
              {variant === "external" ? (
                <>
                  {/* ===== GIAO DỊCH NGOÀI ===== */}
                  <div className="mb-3">
                    <div className="form-label fw-semibold">Loại giao dịch</div>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn type-pill ${form.type === "income" ? "active" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, type: "income" }))}
                      >
                        Thu nhập
                      </button>
                      <button
                        type="button"
                        className={`btn type-pill ${form.type === "expense" ? "active" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, type: "expense" }))}
                      >
                        Chi tiêu
                      </button>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <WalletSelectInput
                        id="wallet-options"
                        label="Ví"
                        value={form.walletName}
                        onChange={(v) => setForm((f) => ({ ...f, walletName: v }))}
                        placeholder="Nhập hoặc chọn ví..."
                        options={walletOptions}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Số tiền</label>
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
                      <label className="form-label fw-semibold">Ngày & giờ</label>
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
                        label="Danh mục"
                        value={form.category}
                        onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                        placeholder="Nhập hoặc chọn danh mục..."
                        options={categoryOptions}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Ghi chú</label>
                      <textarea
                        name="note"
                        className="form-control"
                        rows={2}
                        value={form.note}
                        onChange={handleChange}
                        placeholder="Thêm mô tả cho giao dịch..."
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Ảnh đính kèm</label>
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex gap-2 align-items-center">
                          <input
                            type="file"
                            id="file-input-attachment"
                            className="form-control"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploadingFile}
                            style={{ display: "none" }}
                          />
                          <label
                            htmlFor="file-input-attachment"
                            className="btn btn-outline-secondary btn-sm"
                            style={{ cursor: uploadingFile ? "not-allowed" : "pointer", margin: 0 }}
                          >
                            {uploadingFile ? "Đang upload..." : "Chọn ảnh"}
                          </label>
                          {attachmentPreview && !uploadingFile && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => {
                                setForm((f) => ({ ...f, attachment: "" }));
                                setAttachmentPreview("");
                                // Reset file input
                                const fileInput = document.getElementById("file-input-attachment");
                                if (fileInput) fileInput.value = "";
                              }}
                            >
                              Xóa ảnh
                            </button>
                          )}
                        </div>
                        {uploadingFile && (
                          <div className="text-muted small">
                            Đang upload ảnh...
                          </div>
                        )}
                        {attachmentPreview && !uploadingFile && (
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
                              onError={(e) => {
                                console.error("Error loading preview image:", attachmentPreview);
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ===== CHUYỂN TIỀN ===== */
                <div className="row g-3">
                  <div className="col-12">
                    <div className="form-label fw-semibold mb-0">Chuyển tiền giữa các ví</div>
                    <div className="text-muted small">
                      Chọn ví gửi, ví nhận và số tiền cần chuyển.
                    </div>
                  </div>

                  <div className="col-md-6">
                    <WalletSelectInput
                      id="source-wallet"
                      label="Ví gửi"
                      value={form.sourceWallet}
                      onChange={(v) => setForm((f) => ({ ...f, sourceWallet: v }))}
                      placeholder="Nhập hoặc chọn ví gửi..."
                      options={walletOptions}
                    />
                  </div>

                  <div className="col-md-6">
                    <WalletSelectInput
                      id="target-wallet"
                      label="Ví nhận"
                      value={form.targetWallet}
                      onChange={(v) => setForm((f) => ({ ...f, targetWallet: v }))}
                      placeholder="Nhập hoặc chọn ví nhận..."
                      options={walletOptions}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Số tiền</label>
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
                    <label className="form-label fw-semibold">Ngày & giờ</label>
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
                    <label className="form-label fw-semibold">Ghi chú</label>
                    <textarea
                      name="note"
                      className="form-control"
                      rows={2}
                      value={form.note}
                      onChange={handleChange}
                      placeholder="Thêm ghi chú cho lần chuyển tiền..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer border-0 pt-0" style={{ padding: "8px 22px 16px" }}>
              <button type="button" className="btn btn-light" onClick={onClose}>
                Hủy bỏ
              </button>
              <button type="submit" className="btn btn-primary">
                Lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(modalUI, document.body);
}
