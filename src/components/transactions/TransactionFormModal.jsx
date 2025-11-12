import React, { useState, useEffect } from "react";
import { walletService } from "../../services/walletService";
import { useToast } from "../../contexts/ToastContext";

// ⚠️ MOCK CATEGORIES - Backend chưa có API categories
const MOCK_CATEGORIES = {
  expense: [
    { categoryId: 1, name: "Ăn uống" },
    { categoryId: 2, name: "Di chuyển" },
    { categoryId: 3, name: "Mua sắm" },
    { categoryId: 4, name: "Giải trí" },
    { categoryId: 5, name: "Hóa đơn" },
    { categoryId: 6, name: "Y tế" },
    { categoryId: 7, name: "Giáo dục" },
    { categoryId: 8, name: "Nhà cửa" },
    { categoryId: 9, name: "Chuyển tiền" },
    { categoryId: 10, name: "Khác" },
  ],
  income: [
    { categoryId: 11, name: "Lương" },
    { categoryId: 12, name: "Thưởng" },
    { categoryId: 13, name: "Đầu tư" },
    { categoryId: 14, name: "Bán đồ" },
    { categoryId: 15, name: "Làm thêm" },
    { categoryId: 16, name: "Quà tặng" },
    { categoryId: 17, name: "Chuyển tiền" },
    { categoryId: 18, name: "Khác" },
  ],
};

const EMPTY_FORM = {
  type: "expense",
  walletId: "", // ✅ Change to walletId instead of walletName
  amount: "",
  date: "",
  categoryId: "", // ✅ Change to categoryId instead of category name
  note: "",
  currency: "VND",
  attachment: "",
  fromWalletId: "", // ✅ For transfers
  toWalletId: "", // ✅ For transfers
};

export default function TransactionFormModal({
  open,
  mode = "create",
  initialData,
  onSubmit,
  onClose,
  // "external" = giao dịch ngoài, "internal" = chuyển tiền giữa các ví
  variant = "external",
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  
  // ✅ LOAD DATA FROM API
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load wallets and categories when modal opens
  useEffect(() => {
    if (!open) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // ✅ Load wallets từ DATABASE
        const walletsRes = await walletService.getWallets();
        setWallets(walletsRes.wallets || []);
        
        // ✅ Load categories based on type
        if (variant === "external") {
          // For external transactions, load by type (expense/income)
          const cats = MOCK_CATEGORIES[form.type] || [];
          setCategories(cats);
        } else {
          // For internal transfers, use "Chuyển tiền" category
          const transferCat = MOCK_CATEGORIES.expense.find(c => c.name.includes("Chuyển"));
          setCategories(transferCat ? [transferCat] : []);
          
          // Auto-select transfer category
          if (transferCat && !form.categoryId) {
            setForm(f => ({ ...f, categoryId: String(transferCat.categoryId) }));
          }
        }
      } catch (error) {
        console.error("❌ Error loading transaction form data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.type, variant]);

  // Initialize form when modal opens or data changes
  useEffect(() => {
    if (!open) return;

    const now = new Date().toISOString().slice(0, 16);

    if (variant === "internal") {
      // ===== form cho chuyển tiền giữa các ví =====
      if (mode === "edit" && initialData) {
        let dateValue = "";
        if (initialData.date) {
          const d = new Date(initialData.date);
          if (!Number.isNaN(d.getTime())) {
            dateValue = d.toISOString().slice(0, 16);
          }
        }
        if (!dateValue) dateValue = now;

        setForm({
          ...EMPTY_FORM,
          type: "transfer",
          fromWalletId: String(initialData.fromWalletId || ""),
          toWalletId: String(initialData.toWalletId || ""),
          amount: String(initialData.amount ?? ""),
          date: dateValue,
          categoryId: String(initialData.categoryId || ""),
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
        });
        setAttachmentPreview("");
      }
    } else {
      // ===== form cho giao dịch ngoài (thu/chi) =====
      if (mode === "edit" && initialData) {
        let dateValue = "";
        if (initialData.date) {
          const d = new Date(initialData.date);
          if (!Number.isNaN(d.getTime())) {
            dateValue = d.toISOString().slice(0, 16);
          }
        }
        if (!dateValue) dateValue = now;

        setForm({
          ...EMPTY_FORM,
          type: initialData.type || "expense",
          walletId: String(initialData.walletId || ""),
          amount: String(initialData.amount ?? ""),
          date: dateValue,
          categoryId: String(initialData.categoryId || ""),
          note: initialData.note || "",
          currency: initialData.currency || "VND",
          attachment: initialData.attachment || "",
        });
        setAttachmentPreview(initialData.attachment || "");
      } else {
        setForm({ ...EMPTY_FORM, date: now, type: "expense" });
        setAttachmentPreview("");
      }
    }
  }, [open, mode, initialData, variant]);

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ SPECIAL HANDLING for fromWalletId change
    if (name === "fromWalletId" && variant === "internal") {
      const fromWallet = wallets.find(w => w.walletId === Number(value));
      const toWallet = wallets.find(w => w.walletId === Number(form.toWalletId));
      
      // Reset toWalletId nếu khác currency
      if (fromWallet && toWallet && fromWallet.currencyCode !== toWallet.currencyCode) {
        setForm((f) => ({ ...f, [name]: value, toWalletId: "" }));
        return;
      }
    }
    
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setForm((f) => ({ ...f, attachment: "" }));
      setAttachmentPreview("");
      return;
    }
    const url = URL.createObjectURL(file); // demo: dùng URL tạm
    setForm((f) => ({ ...f, attachment: url }));
    setAttachmentPreview(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (variant === "internal") {
      // ✅ Submit with wallet IDs for transfer
      // ⚠️ Validate required fields
      if (!form.fromWalletId || !form.toWalletId) {
        showToast("Vui lòng chọn ví gửi và ví nhận!");
        return;
      }
      
      // ✅ VALIDATE SAME CURRENCY
      const fromWallet = wallets.find(w => w.walletId === Number(form.fromWalletId));
      const toWallet = wallets.find(w => w.walletId === Number(form.toWalletId));
      
      if (fromWallet && toWallet && fromWallet.currencyCode !== toWallet.currencyCode) {
        showToast(
          `Chỉ có thể chuyển tiền giữa các ví cùng loại tiền tệ! ` +
          `Ví gửi: ${fromWallet.walletName} (${fromWallet.currencyCode}), ` +
          `Ví nhận: ${toWallet.walletName} (${toWallet.currencyCode}). ` +
          `Vui lòng chọn 2 ví cùng loại tiền.`
        );
        return;
      }
      
      // ✅ Find or use first category for transfer
      let categoryId = Number(form.categoryId);
      if (!categoryId && categories.length > 0) {
        // Use first available category as fallback
        categoryId = categories[0].categoryId;
        console.warn("⚠️ No transfer category found, using first category:", categories[0]);
      }
      
      if (!categoryId) {
        showToast("Không tìm thấy danh mục cho chuyển tiền. Vui lòng tạo danh mục trước!");
        return;
      }
      
      // ✅ Backend API /wallets/transfer chỉ nhận: fromWalletId, toWalletId, amount, categoryId, note
      const payload = {
        fromWalletId: Number(form.fromWalletId),
        toWalletId: Number(form.toWalletId),
        amount: Number(form.amount || 0),
        categoryId: categoryId,
        note: form.note || "",
        // ⚠️ Backend KHÔNG nhận date, currency, attachment cho transfer
        // Backend tự động dùng timestamp hiện tại
      };
      onSubmit?.(payload);
    } else {
      // ✅ Submit with walletId and categoryId
      if (!form.walletId || !form.categoryId) {
        showToast("Vui lòng chọn ví và danh mục!");
        return;
      }
      
      const payload = {
        type: form.type,
        walletId: Number(form.walletId),
        categoryId: Number(form.categoryId),
        amount: Number(form.amount || 0),
        date: form.date,
        note: form.note || "",
        attachment: form.attachment,
      };
      onSubmit?.(payload);
    }
  };

  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div className="modal-dialog modal-dialog-scrollable" style={{ maxWidth: 520 }}>
        <div
          className="modal-content border-0 shadow-lg"
          style={{
            borderRadius: 20,
            backgroundColor: "#ffffff",
          }}
        >
          <div
            className="modal-header border-0 pb-0"
            style={{ padding: "16px 22px 8px" }}
          >
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
            <div
              className="modal-body"
              style={{ padding: "12px 22px 18px" }}
            >
              {variant === "external" ? (
                <>
                  {/* Loại giao dịch */}
                  <div className="mb-3">
                    <div className="form-label fw-semibold">Loại giao dịch</div>
                    <div className="btn-group btn-group-sm w-100" role="group">
                      <button
                        type="button"
                        className={
                          "btn type-pill " +
                          (form.type === "income" ? "btn-success" : "btn-outline-secondary")
                        }
                        onClick={() => {
                          setForm((f) => ({ ...f, type: "income", categoryId: "" }));
                          const cats = MOCK_CATEGORIES.income || [];
                          setCategories(cats);
                        }}
                      >
                        Thu nhập
                      </button>
                      <button
                        type="button"
                        className={
                          "btn type-pill " +
                          (form.type === "expense" ? "btn-danger" : "btn-outline-secondary")
                        }
                        onClick={() => {
                          setForm((f) => ({ ...f, type: "expense", categoryId: "" }));
                          const cats = MOCK_CATEGORIES.expense || [];
                          setCategories(cats);
                        }}
                      >
                        Chi tiêu
                      </button>
                    </div>
                  </div>

                  <div className="row g-3">
                    {/* Ví - ✅ LOAD TỪ DATABASE */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Ví</label>
                      <select
                        name="walletId"
                        className="form-select"
                        value={form.walletId}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <option value="">-- Chọn ví --</option>
                        {wallets.map((w) => (
                          <option key={w.walletId} value={w.walletId}>
                            {w.walletName} ({w.currencyCode})
                          </option>
                        ))}
                      </select>
                      {loading && <small className="text-muted">Đang tải danh sách ví...</small>}
                      {!loading && wallets.length === 0 && (
                        <small className="text-danger">⚠️ Chưa có ví nào. Vui lòng tạo ví trước!</small>
                      )}
                    </div>

                    {/* Số tiền */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Số tiền</label>
                      <div className="input-group">
                        <input
                          type="number"
                          name="amount"
                          className="form-control"
                          value={form.amount}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          required
                        />
                        <span className="input-group-text">
                          {wallets.find(w => w.walletId === Number(form.walletId))?.currencyCode || "VND"}
                        </span>
                      </div>
                    </div>

                    {/* Ngày & giờ */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Ngày & giờ
                      </label>
                      <input
                        type="datetime-local"
                        name="date"
                        className="form-control"
                        value={form.date}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Danh mục - ✅ LOAD TỪ HỆ THỐNG */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Danh mục</label>
                      <select
                        name="categoryId"
                        className="form-select"
                        value={form.categoryId}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((c) => (
                          <option key={c.categoryId} value={c.categoryId}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ghi chú */}
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

                    {/* Ảnh đính kèm */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Ảnh đính kèm
                      </label>
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
                // ===== Form cho chuyển tiền giữa các ví =====
                <div className="row g-3">
                  <div className="col-12">
                    <div className="form-label fw-semibold mb-0">
                      Chuyển tiền giữa các ví
                    </div>
                    <div className="text-muted small">
                      Chọn ví gửi, ví nhận và số tiền cần chuyển.
                    </div>
                  </div>

                  {/* Ví gửi - ✅ LOAD TỪ DATABASE */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Ví gửi</label>
                    <select
                      name="fromWalletId"
                      className="form-select"
                      value={form.fromWalletId}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value="">-- Chọn ví gửi --</option>
                      {wallets.map((w) => (
                        <option key={w.walletId} value={w.walletId}>
                          {w.walletName} ({w.currencyCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ví nhận - ✅ LOAD TỪ DATABASE */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Ví nhận</label>
                    <select
                      name="toWalletId"
                      className="form-select"
                      value={form.toWalletId}
                      onChange={handleChange}
                      required
                      disabled={loading || !form.fromWalletId}
                    >
                      <option value="">
                        {!form.fromWalletId ? "-- Chọn ví gửi trước --" : "-- Chọn ví nhận --"}
                      </option>
                      {wallets
                        .filter(w => {
                          // Loại bỏ ví gửi
                          if (w.walletId === Number(form.fromWalletId)) return false;
                          
                          // ✅ CHỈ HIỂN THỊ VÍ CÙNG CURRENCY
                          const fromWallet = wallets.find(fw => fw.walletId === Number(form.fromWalletId));
                          if (fromWallet && w.currencyCode !== fromWallet.currencyCode) return false;
                          
                          return true;
                        })
                        .map((w) => (
                          <option key={w.walletId} value={w.walletId}>
                            {w.walletName} ({w.currencyCode})
                          </option>
                        ))}
                    </select>
                    {form.fromWalletId && (
                      <small className="text-muted">
                        Chỉ hiển thị ví cùng loại tiền với ví gửi
                      </small>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Số tiền</label>
                    <div className="input-group">
                      <input
                        type="number"
                        name="amount"
                        className="form-control"
                        value={form.amount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                      />
                      <span className="input-group-text">
                        {wallets.find(w => w.walletId === Number(form.fromWalletId))?.currencyCode || "VND"}
                      </span>
                    </div>
                    <small className="text-muted">
                      ⚠️ Chỉ chuyển được giữa các ví cùng loại tiền tệ
                    </small>
                  </div>

                  {/* ⚠️ HIDDEN: Backend không cho phép set custom date cho transfer */}
                  {/* Backend tự động dùng timestamp hiện tại */}

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

                  {/* ⚠️ HIDDEN: Backend không hỗ trợ attachment cho transfer */}
                  {/* Backend chỉ hỗ trợ: fromWalletId, toWalletId, amount, categoryId, note */}
                </div>
              )}
            </div>

            <div
              className="modal-footer border-0 pt-0"
              style={{ padding: "8px 22px 16px" }}
            >
              <button type="button" className="btn btn-light" onClick={onClose}>
                Hủy bỏ
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Đang tải..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
