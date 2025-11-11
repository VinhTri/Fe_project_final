import React, { useState, useEffect } from "react";

const EMPTY_FORM = {
  type: "expense",
  walletName: "",
  amount: "",
  date: "",
  category: "Ăn uống",
  note: "",
  currency: "VND",
  attachment: "", // 🔹 ảnh đính kèm
};

const CATEGORIES = [
  "Ăn uống",
  "Di chuyển",
  "Quà tặng",
  "Giải trí",
  "Hóa đơn",
  "Khác",
];

const WALLETS = ["Tiền mặt", "Ngân hàng A", "Ngân hàng B"];

// Input + datalist: gõ để search, chọn được option, không render list cố định
function AutocompleteInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  options,
}) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      <input
        list={id}
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={id}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}

export default function TransactionFormModal({
  open,
  mode = "create",
  initialData,
  onSubmit,
  onClose,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [attachmentPreview, setAttachmentPreview] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      // Chuẩn hóa date -> yyyy-MM-ddTHH:mm cho input datetime-local
      let dateValue = "";
      if (initialData.date) {
        const d = new Date(initialData.date);
        if (!Number.isNaN(d.getTime())) {
          dateValue = d.toISOString().slice(0, 16);
        }
      }
      if (!dateValue) {
        dateValue = new Date().toISOString().slice(0, 16);
      }

      setForm({
        type: initialData.type,
        walletName: initialData.walletName,
        amount: String(initialData.amount),
        date: dateValue,
        category: initialData.category,
        note: initialData.note || "",
        currency: initialData.currency || "VND",
        attachment: initialData.attachment || "",
      });
      setAttachmentPreview(initialData.attachment || "");
    } else {
      const now = new Date().toISOString().slice(0, 16);
      setForm({ ...EMPTY_FORM, date: now });
      setAttachmentPreview("");
    }
  }, [open, mode, initialData]);

  if (!open) return null;

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
    const payload = {
      ...form,
      amount: Number(form.amount || 0),
      date: form.date, // lưu cả ngày + giờ
    };
    onSubmit?.(payload);
  };

  return (
    <div style={overlayStyle}>
      <div className="modal-dialog modal-dialog-scrollable" style={{ maxWidth: 620 }}>
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
              {mode === "create" ? "Thêm Giao dịch Mới" : "Chỉnh sửa Giao dịch"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit}>
            <div
              className="modal-body"
              style={{ padding: "12px 22px 18px" }}
            >
              {/* Loại giao dịch */}
              <div className="mb-3">
                <div className="form-label fw-semibold">Loại giao dịch</div>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={
                      "btn type-pill " + (form.type === "income" ? "active" : "")
                    }
                    onClick={() => setForm((f) => ({ ...f, type: "income" }))}
                  >
                    Thu nhập
                  </button>
                  <button
                    type="button"
                    className={
                      "btn type-pill " + (form.type === "expense" ? "active" : "")
                    }
                    onClick={() => setForm((f) => ({ ...f, type: "expense" }))}
                  >
                    Chi tiêu
                  </button>
                </div>
              </div>

              <div className="row g-3">
                {/* Ví */}
                <div className="col-md-6">
                  <AutocompleteInput
                    id="wallet-options"
                    label="Ví"
                    value={form.walletName}
                    onChange={(v) => setForm((f) => ({ ...f, walletName: v }))}
                    placeholder="Chọn ví hoặc gõ để tìm..."
                    options={WALLETS}
                  />
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
                      required
                    />
                    <span className="input-group-text">{form.currency}</span>
                  </div>
                </div>

                {/* Ngày & giờ */}
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

                {/* Danh mục */}
                <div className="col-md-6">
                  <AutocompleteInput
                    id="category-options"
                    label="Danh mục"
                    value={form.category}
                    onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                    placeholder="Chọn danh mục hoặc gõ để tìm..."
                    options={CATEGORIES}
                  />
                </div>

                {/* Ảnh đính kèm */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Ảnh đính kèm</label>
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

                {/* Ghi chú */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Ghi chú</label>
                  <input
                    type="text"
                    name="note"
                    className="form-control"
                    placeholder="Bữa trưa với đồng nghiệp..."
                    value={form.note}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div
              className="modal-footer border-0 pt-0"
              style={{ padding: "8px 22px 16px" }}
            >
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
    </div>
  );
}
