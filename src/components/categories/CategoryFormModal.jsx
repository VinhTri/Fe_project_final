import React, { useEffect, useState } from "react";
import Modal from "../common/Modal/Modal";

export default function CategoryFormModal({
  open,
  mode = "create", // "create" | "edit"
  initialValue = "",
  typeLabel = "chi phí",
  onSubmit,
  onClose,
}) {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialValue || "");
      setError("");
    }
  }, [open, initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = (name || "").trim();
    if (!trimmed) {
      setError("Vui lòng nhập tên danh mục");
      return;
    }
    if (trimmed.length > 40) {
      setError("Tên danh mục tối đa 40 ký tự");
      return;
    }
    onSubmit && onSubmit(trimmed);
  };

  if (!open) return null;

  const title =
    mode === "edit"
      ? `Sửa danh mục ${typeLabel}`
      : `Thêm danh mục ${typeLabel}`;

  return (
    <Modal open={open} onClose={onClose} width={420}>
      <div className="category-modal">
        <h5 className="category-modal__title mb-3">{title}</h5>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">
              Tên danh mục <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${error ? "is-invalid" : ""}`}
              placeholder="Nhập tên danh mục..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              maxLength={40}
            />
            {error && <div className="invalid-feedback">{error}</div>}
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button
              type="button"
              className="btn btn-light"
              onClick={onClose}
            >
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === "edit" ? "Lưu thay đổi" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}