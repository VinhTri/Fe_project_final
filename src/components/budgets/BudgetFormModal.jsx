import React, { useState, useEffect } from "react";
import Modal from "../common/Modal/Modal";
import { useLanguage } from "../../home/store/LanguageContext";

export default function BudgetFormModal({
  open,
  mode, // 'create' or 'edit'
  initialData, // { categoryId, categoryName, categoryType, limitAmount, walletId }
  categories = [], // expense categories array
  wallets = [], // wallet list from WalletDataContext
  onSubmit,
  onClose,
}) {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && mode === "edit") {
      setSelectedCategory(initialData.categoryName);
      setLimitAmount(initialData.limitAmount);
      // If wallet info exists on initialData, preselect
      setSelectedWallet(initialData.walletId || initialData.walletName || "");
      // Set dates from initialData if available
      setStartDate(initialData.startDate || "");
      setEndDate(initialData.endDate || "");
    } else {
      setSelectedCategory("");
      setSelectedWallet("");
      setLimitAmount("");
      setStartDate("");
      setEndDate("");
    }
    setErrors({});
  }, [open, mode, initialData]);

  const handleCategoryChange = (e) => setSelectedCategory(e.target.value);
  const handleWalletChange = (e) => setSelectedWallet(e.target.value);

  const handleLimitChange = (e) => {
    const val = e.target.value;
    // allow only numbers
    if (/^\d*$/.test(val)) {
      setLimitAmount(val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!selectedCategory) {
      newErrors.category = t("budgets.error.category");
    }
    // wallet optional but recommended
    if (!selectedWallet) {
      newErrors.wallet = t("budgets.error.wallet");
    }
    if (!limitAmount || limitAmount === "0") {
      newErrors.limit = t("budgets.error.limit");
    }
    if (!startDate) {
      newErrors.startDate = t("budgets.error.start_date");
    }
    if (!endDate) {
      newErrors.endDate = t("budgets.error.end_date");
    }
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      newErrors.dateRange = t("budgets.error.date_range");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const categoryObj = categories.find((c) => c.name === selectedCategory) || {};
    // support special 'ALL' value meaning apply to all wallets
    let payload = {
      categoryId: categoryObj.id || null,
      categoryName: selectedCategory,
      categoryType: "expense",
      limitAmount: parseInt(limitAmount, 10),
      startDate,
      endDate,
    };

    if (selectedWallet === "ALL") {
      payload = { ...payload, walletId: null, walletName: t("wallets.scope.all") };
    } else {
      const walletObj = wallets.find((w) => String(w.id) === String(selectedWallet)) || wallets.find((w) => w.name === selectedWallet) || {};
      payload = { ...payload, walletId: walletObj.id || null, walletName: walletObj.name || selectedWallet || null };
    }

    onSubmit(payload);
    onClose();
  };

  const categoryList = categories || [];
  const walletList = wallets || [];

  return (
    <Modal open={open} onClose={onClose} width={500}>
      <div className="modal__content" style={{ padding: "2rem" }}>
        <h4 className="mb-4" style={{ fontWeight: 600, color: "#212529" }}>
          {mode === "create" ? t("budgets.form.title_create") : t("budgets.form.title_edit")}
        </h4>

        <form onSubmit={handleSubmit}>
          {/* Category Selector */}
          <div className="mb-3">
            <label className="form-label fw-semibold">{t("budgets.form.category_label")}</label>
            <select
              className={`form-select ${errors.category ? "is-invalid" : ""}`}
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <option value="">{t("budgets.form.category_placeholder")}</option>
              {categoryList.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <div className="invalid-feedback d-block">{errors.category}</div>
            )}
          </div>

          {/* Wallet Selector */}
          <div className="mb-3">
            <label className="form-label fw-semibold">{t("budgets.form.wallet_label")}</label>
            <select
              className={`form-select ${errors.wallet ? "is-invalid" : ""}`}
              value={selectedWallet}
              onChange={handleWalletChange}
            >
              <option value="">{t("budgets.form.wallet_placeholder")}</option>
              <option value="ALL">{t("budgets.form.wallet_all")}</option>
              {walletList.map((w) => (
                <option key={w.id || w.name} value={w.id ?? w.name}>
                  {w.name}
                </option>
              ))}
            </select>
            {errors.wallet && (
              <div className="invalid-feedback d-block">{errors.wallet}</div>
            )}
          </div>

          {/* Limit Amount */}
          <div className="mb-4">
            <label className="form-label fw-semibold">{t("budgets.form.limit_label")}</label>
            <div className="input-group">
              <input
                type="text"
                className={`form-control ${errors.limit ? "is-invalid" : ""}`}
                placeholder="0"
                value={limitAmount}
                onChange={handleLimitChange}
              />
              <span className="input-group-text">VND</span>
            </div>
            {errors.limit && (
              <div className="invalid-feedback d-block">{errors.limit}</div>
            )}
          </div>

          {/* Date Range Selector */}
          <div className="mb-3">
            <label className="form-label fw-semibold">{t("budgets.form.date_range_label")}</label>
            <div className="row g-2">
              <div className="col-6">
                <label className="form-text small mb-1 d-block">{t("budgets.form.date_from")}</label>
                <input
                  type="date"
                  className={`form-control ${errors.startDate ? "is-invalid" : ""}`}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {errors.startDate && (
                  <div className="invalid-feedback d-block">{errors.startDate}</div>
                )}
              </div>
              <div className="col-6">
                <label className="form-text small mb-1 d-block">{t("budgets.form.date_to")}</label>
                <input
                  type="date"
                  className={`form-control ${errors.endDate ? "is-invalid" : ""}`}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                {errors.endDate && (
                  <div className="invalid-feedback d-block">{errors.endDate}</div>
                )}
              </div>
            </div>
            {errors.dateRange && (
              <div className="invalid-feedback d-block" style={{ marginTop: "0.5rem" }}>
                {errors.dateRange}
              </div>
            )}
            <div className="form-text mt-2">{t("budgets.form.date_hint")}</div>
          </div>

          {/* Buttons */}
          <div className="d-flex gap-2 justify-content-end">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t("budgets.form.btn_cancel")}
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === "create" ? t("budgets.form.btn_create") : t("budgets.form.btn_update")}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
