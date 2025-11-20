import React, { useEffect, useState } from "react";
import Modal from "../common/Modal/Modal";
import { useLanguage } from "../../home/store/LanguageContext";

export default function CategoryFormModal({
  open,
  mode = "create", // "create" | "edit"
  initialValue = "",
  typeLabel = "chi phí",
  onSubmit,
  onClose,
}) {
  const { t } = useLanguage();
  // initialValue can be a string (name) or object { name, description }
  const [name, setName] = useState(
    initialValue && typeof initialValue === "object"
      ? initialValue.name
      : initialValue
  );
  const [description, setDescription] = useState(
    initialValue && typeof initialValue === "object"
      ? initialValue.description || ""
      : ""
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(
        initialValue && typeof initialValue === "object"
          ? initialValue.name || ""
          : initialValue || ""
      );
      setDescription(
        initialValue && typeof initialValue === "object"
          ? initialValue.description || ""
          : ""
      );
      setError("");
    }
  }, [open, initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = (name || "").trim();
    if (!trimmed) {
      setError(t("categories.error.name_required"));
      return;
    }
    if (trimmed.length > 40) {
      setError(t("categories.error.name_length"));
      return;
    }
    onSubmit && onSubmit({ name: trimmed, description: (description || "").trim() });
  };

  if (!open) return null;

  const title =
    mode === "edit"
      ? t("categories.form.title_edit", { type: typeLabel })
      : t("categories.form.title_create", { type: typeLabel });

  return (
    <Modal open={open} onClose={onClose} width={420}>
      <div className="category-modal">
        <h5 className="category-modal__title mb-3">{title}</h5>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">
              {t("categories.form.name_label")} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${error ? "is-invalid" : ""}`}
              placeholder={t("categories.form.name_placeholder")}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              maxLength={40}
            />
            {error && <div className="invalid-feedback">{error}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">{t("categories.form.desc_label")}</label>
            <textarea
              className="form-control"
              placeholder={t("categories.form.desc_placeholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={120}
              rows={3}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-light" onClick={onClose}>
              {t("categories.btn.cancel")}
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === "edit" ? t("categories.btn.save") : t("categories.btn.create")}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}