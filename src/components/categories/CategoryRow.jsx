import React from "react";
import { useLanguage } from "../../home/store/LanguageContext";

export default function CategoryRow({ category, onEdit, onDelete }) {
  const { t } = useLanguage();
  const initial = category.name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="category-row">
      <div className="category-row__left">
        <div className="category-row__icon">
          <span>{initial}</span>
        </div>
        <div className="category-row__name">{category.name}</div>
      </div>

      <div className="category-row__actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onEdit}
          title={t("categories.action.edit_tooltip")}
        >
          <i className="bi bi-pencil-square" />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--danger"
          onClick={onDelete}
          title={t("categories.action.delete_tooltip")}
        >
          <i className="bi bi-trash" />
        </button>
      </div>
    </div>
  );
}