import React, { useState, useMemo, useCallback } from "react";
import "../../styles/home/BudgetsPage.css";
import { useBudgetData } from "../../home/store/BudgetDataContext";
import { useCategoryData } from "../../home/store/CategoryDataContext";
import { useWalletData } from "../../home/store/WalletDataContext";
import BudgetFormModal from "../../components/budgets/BudgetFormModal";
import BudgetDetailModal from "../../components/budgets/BudgetDetailModal";
import ConfirmModal from "../../components/common/Modal/ConfirmModal";
import Toast from "../../components/common/Toast/Toast";
import { useLanguage } from "../../home/store/LanguageContext";

// Use centralized categories from CategoryDataContext

export default function BudgetsPage() {
  const {
    budgets,
    loading: budgetsLoading,
    error: budgetsError,
    getSpentAmount,
    getSpentForBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    externalTransactionsList,
    reloadBudgets,
  } = useBudgetData();
  const { expenseCategories } = useCategoryData();
  const { wallets } = useWalletData();
  const [modalMode, setModalMode] = useState("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [searchName, setSearchName] = useState("");
  const [searchDesc, setSearchDesc] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [detailBudget, setDetailBudget] = useState(null);
  const statusTabs = [
    { value: "all", label: "all" },
    { value: "healthy", label: "healthy" },
    { value: "warning", label: "warning" },
    { value: "over", label: "over" },
  ];

  const computeBudgetUsage = useCallback(
    (budget) => {
      if (!budget) {
        return { spent: 0, remaining: 0, percent: 0, status: "healthy" };
      }

      // Ưu tiên sử dụng giá trị từ API response nếu có
      if (budget.spentAmount !== undefined && budget.spentAmount !== null) {
        const spentValue = Number(budget.spentAmount) || 0;
        const remainingValue = budget.remainingAmount !== undefined 
          ? Number(budget.remainingAmount) || 0
          : (budget.limitAmount || 0) - spentValue;
        const percent = budget.usagePercentage !== undefined
          ? Math.min(999, Math.max(0, Math.round(Number(budget.usagePercentage) || 0)))
          : 0;
        
        // Map status từ API (OK, WARNING, EXCEEDED) sang frontend (healthy, warning, over)
        let status = "healthy";
        const apiStatus = budget.status || "";
        if (apiStatus === "EXCEEDED") {
          status = "over";
        } else if (apiStatus === "WARNING") {
          status = "warning";
        } else {
          // Fallback: tự tính status nếu không có từ API
          const limit = budget.limitAmount || 0;
          const percentRaw = limit > 0 ? (spentValue / limit) * 100 : 0;
          const threshold = budget.alertPercentage ?? 80;
          if (percentRaw >= 100) {
            status = "over";
          } else if (percentRaw >= threshold) {
            status = "warning";
          }
        }

        return {
          spent: spentValue,
          remaining: remainingValue,
          percent,
          status,
        };
      }

      // Fallback: tính toán từ transactions nếu không có giá trị từ API
      const spentValue = getSpentForBudget
        ? getSpentForBudget(budget)
        : getSpentAmount(budget.categoryName, budget.walletName);

      const limit = budget.limitAmount || 0;
      const percentRaw = limit > 0 ? (spentValue / limit) * 100 : 0;
      const percent = Math.min(999, Math.max(0, Math.round(percentRaw)));
      const threshold = budget.alertPercentage ?? 80;

      let status = "healthy";
      if (percent >= 100) {
        status = "over";
      } else if (percent >= threshold) {
        status = "warning";
      }

      return {
        spent: spentValue,
        remaining: limit - spentValue,
        percent,
        status,
      };
    },
    [getSpentAmount, getSpentForBudget]
  );

  const budgetUsageMap = useMemo(() => {
    const map = new Map();
    (budgets || []).forEach((budget) => {
      map.set(budget.id, computeBudgetUsage(budget));
    });
    return map;
  }, [budgets, computeBudgetUsage]);

  const handleAddBudget = () => {
    setModalMode("create");
    setModalInitial(null);
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEditBudget = (budget) => {
    setModalMode("edit");
    setModalInitial({
      categoryId: budget.categoryId,
      categoryName: budget.categoryName,
      categoryType: budget.categoryType,
      limitAmount: budget.limitAmount,
      startDate: budget.startDate,
      endDate: budget.endDate,
      // If walletId is null and walletName is missing or equals the special label, treat as ALL
      walletId: budget.walletId != null ? budget.walletId : (budget.walletName === "Tất cả ví" ? "ALL" : (budget.walletName || null)),
      walletName: budget.walletName != null ? budget.walletName : (budget.walletId == null ? "Tất cả ví" : null),
      alertPercentage: budget.alertPercentage ?? 90,
      note: budget.note || "",
    });
    setEditingId(budget.id);
    setModalOpen(true);
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const dateObj = new Date(value);
    if (Number.isNaN(dateObj.getTime())) return value;
    return `${dateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} ${dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const parseDateOnly = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split("T")[0].split("-").map((part) => Number(part));
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const budgetStatusLabel = {
    healthy: "healthy",
    warning: "warning",
    over: "over",
  };

  const budgetStatusTone = {
    healthy: "success",
    warning: "warning",
    over: "danger",
  };

  const statusCounts = useMemo(() => {
    const total = Array.isArray(budgets) ? budgets.length : 0;
    const counts = { all: total, healthy: 0, warning: 0, over: 0 };
    budgetUsageMap.forEach((usage) => {
      if (usage?.status === "warning") counts.warning += 1;
      if (usage?.status === "over") counts.over += 1;
      if (usage?.status === "healthy") counts.healthy += 1;
    });
    counts.healthy = counts.healthy || 0;
    return counts;
  }, [budgets, budgetUsageMap]);

  const overviewStats = useMemo(() => {
    if (!budgets || budgets.length === 0) {
      return {
        totalLimit: 0,
        totalSpent: 0,
        totalRemaining: 0,
        warningCount: 0,
        overCount: 0,
        activeBudgets: 0,
      };
    }

    let totalLimit = 0;
    let totalSpent = 0;
    let warningCount = 0;
    let overCount = 0;
    let activeBudgets = 0;
    const today = new Date();

    budgets.forEach((budget) => {
      totalLimit += budget.limitAmount || 0;
      const usage = budgetUsageMap.get(budget.id) || { spent: 0, status: "healthy" };
      totalSpent += usage.spent || 0;
      if (usage.status === "warning") warningCount += 1;
      if (usage.status === "over") overCount += 1;

      const start = budget.startDate ? parseDateOnly(budget.startDate) : null;
      const end = budget.endDate ? parseDateOnly(budget.endDate) : null;
      if (!start || !end || (today >= start && today <= end)) {
        activeBudgets += 1;
      }
    });

    return {
      totalLimit,
      totalSpent,
      totalRemaining: totalLimit - totalSpent,
      warningCount,
      overCount,
      activeBudgets,
    };
  }, [budgets, budgetUsageMap]);

  const bannerState = useMemo(() => {
    const overItems = [];
    const warningItems = [];
    budgets.forEach((budget) => {
      const usage = budgetUsageMap.get(budget.id);
      if (!usage) return;
      if (usage.status === "over") overItems.push({ budget, usage });
      if (usage.status === "warning") warningItems.push({ budget, usage });
    });
    return { overItems, warningItems };
  }, [budgets, budgetUsageMap]);


  // Format số tiền - giống formatMoney trong WalletsPage và TransactionsPage
  const formatMoney = (amount = 0, currency = "VND") => {
    const numAmount = Number(amount) || 0;
    if (currency === "USD") {
      if (Math.abs(numAmount) < 0.01 && numAmount !== 0) {
        const formatted = numAmount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 8,
        });
        return `$${formatted}`;
      }
      const formatted =
        numAmount % 1 === 0
          ? numAmount.toLocaleString("en-US")
          : numAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 8,
            });
      return `$${formatted}`;
    }
    if (currency === "VND") {
      return `${numAmount.toLocaleString("vi-VN")} VND`;
    }
    if (Math.abs(numAmount) < 0.01 && numAmount !== 0) {
      return `${numAmount.toLocaleString("vi-VN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      })} ${currency}`;
    }
    return `${numAmount.toLocaleString("vi-VN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })} ${currency}`;
  };

  // Helper để lấy currency từ wallet của budget
  const getBudgetCurrency = useCallback((budget) => {
    if (!budget || !budget.walletId) {
      return "VND"; // Mặc định VND nếu không có wallet hoặc áp dụng cho tất cả ví
    }
    const wallet = wallets.find((w) => w.id === budget.walletId);
    return wallet?.currency || "VND";
  }, [wallets]);

  const filteredCategories = useMemo(() => {
    if (Array.isArray(expenseCategories) && expenseCategories.length > 0) {
      return expenseCategories;
    }
    const fallbackMap = new Map();
    (budgets || []).forEach((budget) => {
      const key = budget.categoryId || budget.categoryName;
      if (!key) return;
      if (!fallbackMap.has(key)) {
        fallbackMap.set(key, {
          id: budget.categoryId || key,
          name: budget.categoryName,
          categoryName: budget.categoryName,
        });
      }
    });
    return Array.from(fallbackMap.values());
  }, [expenseCategories, budgets]);

  const visibleBudgets = useMemo(() => {
    if (!Array.isArray(budgets)) return [];
    const normalizedName = searchName.trim().toLowerCase();
    const normalizedDesc = searchDesc.trim().toLowerCase();

    return budgets.filter((budget) => {
      const matchesName = !normalizedName || budget.categoryName?.toLowerCase().includes(normalizedName);
      const matchesDesc = !normalizedDesc || (budget.note || "").toLowerCase().includes(normalizedDesc);
      if (!matchesName || !matchesDesc) return false;
      if (statusFilter === "all") return true;
      const usage = budgetUsageMap.get(budget.id);
      return usage?.status === statusFilter;
    });
  }, [budgets, searchName, searchDesc, statusFilter, budgetUsageMap]);

  const latestTransactions = useMemo(() => {
    const list = Array.isArray(externalTransactionsList) ? externalTransactionsList : [];
    const filtered = list.filter((tx) => {
      if (transactionFilter === "all") return true;
      return (tx.type || "").toLowerCase() === transactionFilter.toLowerCase();
    });

    return filtered
      .slice()
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);
  }, [externalTransactionsList, transactionFilter]);

  const handleSearchReset = useCallback(() => {
    setSearchName("");
    setSearchDesc("");
  }, []);

  const handleOpenDetail = useCallback((budget) => {
    if (!budget) return;
    const usage = budgetUsageMap.get(budget.id) || computeBudgetUsage(budget);
    setDetailBudget({ budget, usage });
  }, [budgetUsageMap, computeBudgetUsage]);

  const handleCloseDetail = useCallback(() => {
    setDetailBudget(null);
  }, []);

  const handleSendReminder = useCallback((budget) => {
    if (!budget) return;
    setToast({
      open: true,
      message: t("budgets.toast.remind_sent", { category: budget.categoryName }),
      type: "success",
    });
  }, []);

  const handleCreateTransactionShortcut = useCallback((budget) => {
    if (!budget) return;
    setToast({
      open: true,
      message: t("budgets.toast.create_tx_placeholder", { category: budget.categoryName }),
      type: "success",
    });
  }, []);

  const handleViewAllTransactions = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/home/transactions";
      return;
    }
    setToast({
      open: true,
      message: "Không thể điều hướng trong môi trường hiện tại.",
      type: "error",
    });
  }, []);

  const handleModalSubmit = useCallback(async (payload) => {
    try {
      if (modalMode === "edit" && editingId != null) {
        await updateBudget(editingId, payload);
        // Reload budgets from API to refresh list
        if (reloadBudgets) {
          await reloadBudgets();
        }
        setToast({ open: true, message: "Đã cập nhật hạn mức", type: "success" });
      } else {
        await createBudget(payload);
        // Reload budgets from API to refresh list
        if (reloadBudgets) {
          await reloadBudgets();
        }
        setToast({ open: true, message: "Đã tạo hạn mức mới", type: "success" });
      }
    } catch (error) {
      console.error("Failed to save budget", error);
      setToast({ open: true, message: error.message || "Không thể lưu hạn mức. Vui lòng thử lại.", type: "error" });
    } finally {
      setEditingId(null);
    }
  }, [modalMode, editingId, updateBudget, createBudget, reloadBudgets]);

  const handleDeleteBudget = useCallback(async () => {
    if (!confirmDel) return;
    try {
      await deleteBudget(confirmDel.id);
      // Reload budgets from API to refresh list
      if (reloadBudgets) {
        await reloadBudgets();
      }
      setToast({ open: true, message: "Đã xóa hạn mức", type: "success" });
    } catch (error) {
      console.error("Failed to delete budget", error);
      setToast({ open: true, message: error.message || "Không thể xóa hạn mức. Vui lòng thử lại.", type: "error" });
    } finally {
      setConfirmDel(null);
    }
  }, [confirmDel, deleteBudget, reloadBudgets]);

  return (
    <div className="budget-page container-fluid py-4">
      <div className="tx-page-inner">
        {/* HEADER now uses wallet-style single container */}
        <div className="wallet-header">
          <div className="wallet-header-left">
            <div className="wallet-header-icon">
              <i className="bi bi-graph-up-arrow" />
            </div>
            <div>
              <h2 className="wallet-header-title">{t("budgets.page.title")}</h2>
              <p className="wallet-header-subtitle">{t("budgets.page.subtitle")}</p>
            </div>
          </div>

          <div className="wallet-header-right">
            <button
              className="wallet-header-btn d-flex align-items-center"
              onClick={handleAddBudget}
            >
              <i className="bi bi-plus-lg me-2" />
              {t("budgets.btn.add")}
            </button>
          </div>
        </div>

      {/* Overview metrics */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="budget-metric-card">
            <span className="budget-metric-label">Tổng hạn mức</span>
            <div className="budget-metric-value">{formatMoney(overviewStats.totalLimit)}</div>
            <small className="text-muted">{overviewStats.activeBudgets} hạn mức đang hoạt động</small>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="budget-metric-card">
            <span className="budget-metric-label">Đã sử dụng</span>
            <div className="budget-metric-value text-primary">{formatMoney(overviewStats.totalSpent)}</div>
            <small className="text-muted">
              {overviewStats.totalLimit > 0
                ? t("budgets.metric.used_percent", { percent: Math.round((overviewStats.totalSpent / overviewStats.totalLimit) * 100) })
                : t("budgets.metric.no_data")}
            </small>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="budget-metric-card">
            <span className="budget-metric-label">Còn lại</span>
            <div className="budget-metric-value text-success">{formatMoney(overviewStats.totalRemaining)}</div>
            <small className="text-muted">Theo tất cả hạn mức</small>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="budget-metric-card">
            <span className="budget-metric-label">{t("budgets.metric.alerts")}</span>
            <div className="budget-metric-value text-danger">
              {overviewStats.warningCount + overviewStats.overCount}
            </div>
            <small className="text-muted">
              {t("budgets.metric.warning_label", { w: overviewStats.warningCount, o: overviewStats.overCount })}
            </small>
          </div>
        </div>
      </div>

      {(bannerState.warningItems.length > 0 || bannerState.overItems.length > 0) && (
        <div className="budget-warning-banner mb-4">
          <div>
            <p className="budget-warning-title">{t("budgets.banner.title")}</p>
            <span>
              {bannerState.overItems.length > 0 && t("budgets.banner.over_count", { count: bannerState.overItems.length })}
              {bannerState.warningItems.length > 0 && t("budgets.banner.warning_count", { count: bannerState.warningItems.length })}
            </span>
          </div>
          <div className="budget-warning-actions">
            {bannerState.warningItems.length > 0 && (
              <button className="btn btn-warning btn-sm" onClick={() => setStatusFilter("warning")}>
                {t("budgets.banner.view_warnings")}
              </button>
            )}
            {bannerState.overItems.length > 0 && (
              <button className="btn btn-outline-danger btn-sm" onClick={() => setStatusFilter("over")}>
                {t("budgets.banner.view_over")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* FORM TÌM KIẾM */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <form className="budget-filter-form row g-3 align-items-end" onSubmit={(e) => e.preventDefault()}>
            <div className="col-md-4">
              <label className="form-label fw-semibold">{t("budgets.filter.category")}</label>
              <input
                className="form-control"
                placeholder={t("budgets.filter.category_placeholder")}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label fw-semibold">{t("budgets.filter.desc")}</label>
              <input
                className="form-control"
                placeholder={t("budgets.filter.desc_placeholder")}
                value={searchDesc}
                onChange={(e) => setSearchDesc(e.target.value)}
              />
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary flex-grow-1">
                {t("budgets.btn.search")}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={handleSearchReset}>
                {t("budgets.btn.clear")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="budget-status-tabs mb-4">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            className={`budget-status-tab ${statusFilter === tab.value ? "active" : ""}`}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
          >
            {t(`budgets.tab.${tab.label}`)}
            <span className="badge-count">{statusCounts[tab.value] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="budget-content-layout">
        <div className="budget-main-column">
          {budgetsLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p className="mt-3 text-muted">Đang tải danh sách hạn mức...</p>
            </div>
          ) : budgetsError ? (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2" />
              {budgetsError}
            </div>
          ) : visibleBudgets.length === 0 ? (
            <div className="budget-empty-state">
              <svg className="budget-empty-icon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="50" stroke="#e9ecef" strokeWidth="2" />
                <path d="M60 35v50M40 55h40" stroke="#6c757d" strokeWidth="3" strokeLinecap="round" />
                <circle cx="75" cy="35" r="8" fill="#28a745" />
                <path d="M72 35l2 2 4-4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3>Bạn chưa thiết lập Hạn mức Chi tiêu</h3>
              <p>Hãy bắt đầu bằng cách tạo hạn mức cho một danh mục để kiểm soát chi tiêu của bạn.</p>
              <button className="btn btn-primary" onClick={handleAddBudget}>Thiết lập Hạn mức Chi tiêu đầu tiên</button>
            </div>
          ) : (
            <div className="row g-4">
              {visibleBudgets.map((budget) => {
                const usage = budgetUsageMap.get(budget.id) || computeBudgetUsage(budget);
                const { spent, remaining, percent, status } = usage;
                const isOver = status === "over";
                const isWarning = status === "warning";
                const budgetCurrency = getBudgetCurrency(budget);

                return (
                  <div className="col-xl-6" key={budget.id}>
                    <div className="budget-card">
                      <div className="budget-card-header">
                        <div className="budget-card-heading">
                          <div className="budget-card-icon">
                            <i className="bi bi-wallet2" />
                          </div>
                          <div>
                            <h5 className="budget-card-title">{budget.categoryName}</h5>
                            {budget.walletName && <div className="text-muted small">Ví: {budget.walletName}</div>}
                          </div>
                        </div>
                        <span className={`budget-status-chip ${budgetStatusTone[status] || ""}`}>
                          {t(`budgets.status.${status}`)}
                        </span>
                      </div>

                      <div className="budget-card-meta">
                            <div>
                          <label>{t("budgets.form.date_range_label")}</label>
                          <p>
                            {budget.startDate && budget.endDate
                              ? t("budgets.card.from_to", { start: new Date(budget.startDate).toLocaleDateString(), end: new Date(budget.endDate).toLocaleDateString() })
                              : t("budgets.card.no_date")}
                          </p>
                        </div>
                        <div>
                          <label>{t("budgets.card.alert_label")}</label>
                          <p>{(budget.alertPercentage ?? 80) + "% " + t("budgets.card.alert_suffix")}</p>
                        </div>
                      </div>

                      <div className="progress">
                        <div
                          className={`progress-bar ${isOver ? "bg-danger" : isWarning ? "bg-warning" : ""}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>

                      <div className="budget-stats">
                        <div className="budget-stat-item">
                          <label className="budget-stat-label">Hạn mức</label>
                          <div className="budget-stat-value">{formatMoney(budget.limitAmount, budgetCurrency)}</div>
                        </div>
                        <div className="budget-stat-item">
                          <label className="budget-stat-label">Đã chi</label>
                          <div className={`budget-stat-value ${isOver ? "danger" : ""}`}>{formatMoney(spent, budgetCurrency)}</div>
                        </div>
                        <div className="budget-stat-item">
                          <label className="budget-stat-label">Còn lại</label>
                          <div className={`budget-stat-value ${remaining < 0 ? "danger" : "success"}`}>{formatMoney(remaining, budgetCurrency)}</div>
                        </div>
                        <div className="budget-stat-item">
                          <label className="budget-stat-label">Sử dụng</label>
                          <div className={`budget-stat-value ${isOver ? "danger" : isWarning ? "warning" : ""}`}>{Math.round(percent)}%</div>
                        </div>
                      </div>

                      {budget.note && (
                        <div className="budget-note">
                          <i className="bi bi-chat-left-text" />
                          <span>{budget.note}</span>
                        </div>
                      )}

                      <div className="budget-card-quick-actions">
                        <button type="button" onClick={() => handleOpenDetail(budget)}>
                          <i className="bi bi-pie-chart" /> {t("budgets.action.detail")}
                        </button>
                        <button type="button" onClick={() => handleSendReminder(budget)}>
                          <i className="bi bi-bell" /> {t("budgets.action.remind")}
                        </button>
                        <button type="button" onClick={() => handleCreateTransactionShortcut(budget)}>
                          <i className="bi bi-plus-circle" /> {t("budgets.action.create_tx")}
                        </button>
                      </div>

                      <div className="budget-card-actions">
                        <button className="btn-edit-budget" onClick={() => handleEditBudget(budget)} title={t("budgets.action.edit")}>
                          <i className="bi bi-pencil me-1"></i>{t("budgets.action.edit")}
                        </button>
                        <button className="btn-delete-budget" onClick={() => setConfirmDel(budget)} title={t("budgets.action.delete")}>
                          <i className="bi bi-trash me-1"></i>{t("budgets.action.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="budget-side-column">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="mb-1">{t("budgets.side.recent_title")}</h5>
                </div>
                <select
                  className="form-select budget-transaction-filter"
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                >
                  <option value="all">{t("transactions.all")}</option>
                  <option value="expense">{t("transactions.type.expense")}</option>
                  <option value="income">{t("transactions.type.income")}</option>
                </select>
              </div>

              <div className="table-responsive budget-transaction-mini">
                <table className="table budget-transaction-table">
                  <thead>
                    <tr>
                      <th>{t("transactions.col.code")}</th>
                      <th>{t("transactions.col.category")}</th>
                      <th>{t("transactions.col.amount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-4">
                          {t("budgets.transactions.empty")}
                        </td>
                      </tr>
                    ) : (
                      latestTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.code || tx.id}</td>
                          <td>
                            <div className="fw-semibold">{tx.category || "Không xác định"}</div>
                            <small className="text-muted">{formatDateTime(tx.date)}</small>
                          </td>
                          <td className={`fw-semibold ${tx.type === "expense" ? "text-danger" : "text-success"}`}>
                            {formatMoney(tx.amount, tx.currency || "VND")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <button className="btn btn-outline-primary w-100" type="button" onClick={handleViewAllTransactions}>
                {t("transactions.view_all")}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <BudgetDetailModal
        open={!!detailBudget}
        budget={detailBudget?.budget}
        usage={detailBudget?.usage}
        wallets={wallets}
        onClose={handleCloseDetail}
        onEdit={handleEditBudget}
        onRemind={handleSendReminder}
      />

      <BudgetFormModal
        open={modalOpen}
        mode={modalMode}
        initialData={modalInitial}
        categories={filteredCategories}
        wallets={wallets}
        onSubmit={handleModalSubmit}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmModal
        open={!!confirmDel}
        title={t("budgets.confirm.delete_title")}
        message={confirmDel ? t("budgets.confirm.delete_message", { category: confirmDel.categoryName }) : ""}
        okText={t("budgets.confirm.delete_ok")}
        cancelText={t("budgets.confirm.delete_cancel")}
        onOk={handleDeleteBudget}
        onClose={() => setConfirmDel(null)}
      />

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        duration={2200}
        onClose={() => setToast({ open: false, message: "", type: "success" })}
      />
      </div>
    </div>
  );
}
