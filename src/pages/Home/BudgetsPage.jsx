import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/home/BudgetsPage.css";
import { useBudgetData } from "../../home/store/BudgetDataContext";
import { useCategoryData } from "../../home/store/CategoryDataContext";
import { useWalletData } from "../../home/store/WalletDataContext";
import { useLanguage } from "../../home/store/LanguageContext";
import BudgetFormModal from "../../components/budgets/BudgetFormModal";
import BudgetDetailModal from "../../components/budgets/BudgetDetailModal";
import ConfirmModal from "../../components/common/Modal/ConfirmModal";
import Toast from "../../components/common/Toast/Toast";
import { useDateFormat } from "../../hooks/useDateFormat";

// Use centralized categories from CategoryDataContext

export default function BudgetsPage() {
  const { translate } = useLanguage();
  const t = translate;
  const {
    budgets,
    getSpentAmount,
    getSpentForBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    externalTransactionsList,
  } = useBudgetData();
  const { expenseCategories } = useCategoryData();
  const { wallets } = useWalletData();
  const [modalMode, setModalMode] = useState("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [highlightedBudgetId, setHighlightedBudgetId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailBudget, setDetailBudget] = useState(null);
  const [transactionBudgetFilter, setTransactionBudgetFilter] = useState(null);
  const transactionFilter = "all"; // giữ tương thích với logic cũ
  const navigate = useNavigate();
  const { formatDate } = useDateFormat();
  const statusTabs = useMemo(
    () => [
      { value: "all", label: t("Tất cả", "All") },
      { value: "healthy", label: t("Đang ổn", "Healthy") },
      { value: "warning", label: t("Sắp đạt ngưỡng", "Near limit") },
      { value: "over", label: t("Đã vượt", "Exceeded") },
    ],
    [t]
  );

  const parseDateOnly = useCallback((value) => {
    if (!value) return null;
    const [datePart] = value.split("T");
    if (!datePart) return null;
    const [year, month, day] = datePart.split("-").map((part) => Number(part));
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }, []);

  const isBudgetExpired = useCallback(
    (budget) => {
      if (!budget?.endDate) return false;
      const end = parseDateOnly(budget.endDate);
      if (!end) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return end < today;
    },
    [parseDateOnly]
  );

  const isBudgetNotStarted = useCallback(
    (budget) => {
      if (!budget?.startDate) return false;
      const start = parseDateOnly(budget.startDate);
      if (!start) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      return start > today;
    },
    [parseDateOnly]
  );

  const computeBudgetUsage = useCallback(
    (budget) => {
      if (!budget) {
        return { spent: 0, remaining: 0, percent: 0, status: "healthy" };
      }

      const spentValue = getSpentForBudget
        ? getSpentForBudget(budget)
        : getSpentAmount(budget.categoryName, budget.walletName);

      const limit = budget.limitAmount || 0;
      const percentRaw = limit > 0 ? (spentValue / limit) * 100 : 0;
      const percent = Math.min(999, Math.max(0, Math.round(percentRaw)));
      const threshold = budget.alertPercentage ?? 80;

      const expired = isBudgetExpired(budget);
      const notStarted = isBudgetNotStarted(budget);

      let status = "healthy";
      if (expired) {
        status = "expired";
      } else if (notStarted) {
        status = "upcoming";
      } else if (percent >= 100) {
        status = "over";
      } else if (percent >= threshold) {
        status = "warning";
      }

      return {
        spent: spentValue,
        remaining: limit - spentValue,
        percent,
        status,
        expired,
        notStarted,
      };
    },
    [getSpentAmount, getSpentForBudget, isBudgetExpired, isBudgetNotStarted]
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

  const formatDateOnly = useCallback(
    (value) => {
      const formatted = formatDate(value);
      return formatted === "--" ? "" : formatted;
    },
    [formatDate]
  );

  const formatDateTime = useCallback(
    (value) => {
      const formatted = formatDate(value, { withTime: true });
      if (formatted === "--") return "";
      return formatted;
    },
    [formatDate]
  );

  const budgetStatusLabel = useMemo(
    () => ({
      healthy: t("Đang ổn", "Healthy"),
      warning: t("Sắp đạt", "Warning"),
      over: t("Đã vượt", "Exceeded"),
      expired: t("Hết hạn", "Expired"),
      upcoming: t("Chưa bắt đầu", "Not started"),
    }),
    [t]
  );

  const budgetStatusTone = {
    healthy: "success",
    warning: "warning",
    over: "danger",
    expired: "expired",
    upcoming: "upcoming",
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
  }, [budgets, budgetUsageMap, parseDateOnly]);

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

  const currencyFormatter = useMemo(() => new Intl.NumberFormat("vi-VN"), []);

  const formatCurrency = useCallback((value = 0) => {
    if (value == null || Number.isNaN(Number(value))) {
      return "0";
    }
    try {
      return currencyFormatter.format(Number(value));
    } catch (error) {
      return String(value ?? 0);
    }
  }, [currencyFormatter]);

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

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const matchesSearch = useCallback(
    (budget) => {
      if (!normalizedSearch) return true;
      const haystack = [
        budget.categoryName,
        budget.walletName,
        budget.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    },
    [normalizedSearch]
  );

  const visibleBudgets = useMemo(() => {
    if (!Array.isArray(budgets)) return [];
    return budgets.filter((budget) => {
      if (!matchesSearch(budget)) return false;
      if (statusFilter === "all") return true;
      const usage = budgetUsageMap.get(budget.id);
      return usage?.status === statusFilter;
    });
  }, [budgets, matchesSearch, statusFilter, budgetUsageMap]);

  const quickSearchResults = useMemo(() => {
    if (!normalizedSearch || !Array.isArray(budgets)) return [];
    return budgets.filter((budget) => matchesSearch(budget)).slice(0, 6);
  }, [budgets, matchesSearch, normalizedSearch]);

  const latestTransactions = useMemo(() => {
    const list = Array.isArray(externalTransactionsList) ? externalTransactionsList : [];
    if (transactionBudgetFilter?.isInactive) {
      return [];
    }

    const filteredByBudget = transactionBudgetFilter
      ? list.filter((tx) => {
          const txCategory = (tx.category || "").toLowerCase();
          const budgetCategory = (transactionBudgetFilter.categoryName || "").toLowerCase();
          if (txCategory !== budgetCategory) return false;

          if (!transactionBudgetFilter.walletName || transactionBudgetFilter.walletName === "Tất cả ví") {
            return true;
          }

          return (tx.walletName || "").toLowerCase() === (transactionBudgetFilter.walletName || "").toLowerCase();
        })
      : list;

    return filteredByBudget
      .slice()
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);
  }, [externalTransactionsList, transactionBudgetFilter]);

  const handleOpenDetail = useCallback((budget) => {
    if (!budget) return;
    const usage = budgetUsageMap.get(budget.id) || computeBudgetUsage(budget);
    setDetailBudget({ budget, usage });
  }, [budgetUsageMap, computeBudgetUsage]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailBudget(null);
  }, []);

  const handleHighlightBudget = useCallback((budgetId) => {
    if (!budgetId) return;
    setHighlightedBudgetId(budgetId);
    const cardEl = document.querySelector(`[data-budget-card="${budgetId}"]`);
    if (cardEl && typeof cardEl.scrollIntoView === "function") {
      cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    window.setTimeout(() => {
      setHighlightedBudgetId((prev) => (prev === budgetId ? null : prev));
    }, 2800);
  }, []);

  const handleSelectBudgetForTransactions = useCallback((budget) => {
    if (!budget) return;
    handleHighlightBudget(budget.id);
    const usage = budgetUsageMap.get(budget.id) || computeBudgetUsage(budget);
    const status = usage?.status;
    setTransactionBudgetFilter({
      id: budget.id,
      categoryName: budget.categoryName,
      walletName: budget.walletName,
      status,
      isInactive: status === "expired" || status === "upcoming",
    });
  }, [handleHighlightBudget, budgetUsageMap, computeBudgetUsage]);

  const handleClearTransactionBudgetFilter = useCallback(() => {
    setTransactionBudgetFilter(null);
  }, []);

  const transactionPanelSubtitle = useMemo(() => {
    if (!transactionBudgetFilter) {
      return t("Hiển thị 5 giao dịch mới nhất", "Showing the 5 most recent transactions");
    }
    if (transactionBudgetFilter.isInactive) {
      return t("Thẻ này chưa hoạt động.", "This budget is inactive.");
    }
    const walletLabel = transactionBudgetFilter.walletName && transactionBudgetFilter.walletName !== "Tất cả ví"
      ? ` • ${transactionBudgetFilter.walletName}`
      : "";
    return t(
      `Đang xem giao dịch cho ${transactionBudgetFilter.categoryName}${walletLabel}`,
      `Viewing transactions for ${transactionBudgetFilter.categoryName}${walletLabel}`
    );
  }, [transactionBudgetFilter, t]);

  const handleSendReminder = useCallback((budget) => {
    if (!budget) return;
    setToast({
      open: true,
      message: t(
        `Đã gửi nhắc nhở cho hạn mức "${budget.categoryName}"`,
        `Reminder sent for budget "${budget.categoryName}"`
      ),
      type: "success",
    });
  }, [t]);

  const handleCreateTransactionShortcut = useCallback((budget) => {
    if (!budget) return;
    setToast({
      open: true,
      message: t(
        `Tính năng tạo giao dịch nhanh cho "${budget.categoryName}" đang được phát triển.`,
        `Quick transaction for "${budget.categoryName}" is under development.`
      ),
      type: "success",
    });
  }, [t]);

  const handleViewAllTransactions = useCallback(() => {
    if (navigate) {
      navigate("/home/transactions");
      return;
    }
    setToast({
      open: true,
      message: t("Không thể điều hướng trong môi trường hiện tại.", "Cannot navigate in the current environment."),
      type: "error",
    });
  }, [navigate, t]);

  const handleModalSubmit = useCallback(async (payload) => {
    try {
      if (modalMode === "edit" && editingId != null) {
        await updateBudget(editingId, payload);
        setToast({ open: true, message: t("Đã cập nhật hạn mức", "Budget updated"), type: "success" });
      } else {
        await createBudget(payload);
        setToast({ open: true, message: t("Đã tạo hạn mức mới", "New budget created"), type: "success" });
      }
    } catch (error) {
      console.error("Failed to save budget", error);
      setToast({ open: true, message: t("Không thể lưu hạn mức. Vui lòng thử lại.", "Unable to save budget. Please try again."), type: "error" });
    } finally {
      setEditingId(null);
    }
  }, [modalMode, editingId, updateBudget, createBudget, t]);

  const handleDeleteBudget = useCallback(async () => {
    if (!confirmDel) return;
    try {
      await deleteBudget(confirmDel.id);
      setToast({ open: true, message: t("Đã xóa hạn mức", "Budget deleted"), type: "success" });
    } catch (error) {
      console.error("Failed to delete budget", error);
      setToast({ open: true, message: t("Không thể xóa hạn mức. Vui lòng thử lại.", "Unable to delete budget. Please try again."), type: "error" });
    } finally {
      setConfirmDel(null);
    }
  }, [confirmDel, deleteBudget, t]);

  return (
    <div className="budget-page container py-4">
      {/* HEADER – bố cục giống trang Giao dịch: trái = icon + text, phải = nút */}
      <div className="budget-hero mb-4">
        <div className="budget-hero__content">
          {/* BÊN TRÁI: ICON + TIÊU ĐỀ + MÔ TẢ */}
          <div className="budget-hero__info">
            <div className="budget-header-icon-wrap">
              {/* icon tương ứng chức năng: hạn mức = bi-graph-up-arrow */}
              <i className="bi bi-graph-up-arrow budget-header-icon" />
            </div>
            <div>
              <h2 className="budget-title mb-1">
                {t("Quản lý Hạn mức Chi tiêu", "Manage spending budgets")}
              </h2>
              <p className="mb-0 budget-subtitle">
                {t("Thiết lập và theo dõi hạn mức chi tiêu cho từng danh mục.", "Set up and track spending limits per category.")}
              </p>
            </div>
          </div>

          {/* BÊN PHẢI: NÚT THÊM HẠN MỨC */}
          <div className="budget-hero__actions">
            <button
              className="budget-add-btn budget-hero__btn d-flex align-items-center"
              style={{ whiteSpace: "nowrap" }}
              onClick={handleAddBudget}
            >
              <i className="bi bi-plus-lg me-2" />
              {t("Thêm Hạn mức", "Add budget")}
            </button>
          </div>
        </div>
      </div>

      {/* Overview metrics */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="budget-metric-card">
            <span className="budget-metric-label">{t("Tổng hạn mức", "Total budget limit")}</span>
            <div className="budget-metric-value">{formatCurrency(overviewStats.totalLimit)} VND</div>
            <small className="text-muted">{t(`${overviewStats.activeBudgets} hạn mức đang hoạt động`, `${overviewStats.activeBudgets} active budgets`)}</small>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="budget-metric-card">
            <span className="budget-metric-label">{t("Đã sử dụng", "Spent")}</span>
            <div className="budget-metric-value text-primary">{formatCurrency(overviewStats.totalSpent)} VND</div>
            <small className="text-muted">
              {overviewStats.totalLimit > 0
                ? t(
                    `${Math.round((overviewStats.totalSpent / overviewStats.totalLimit) * 100)}% tổng hạn mức`,
                    `${Math.round((overviewStats.totalSpent / overviewStats.totalLimit) * 100)}% of total limit`
                  )
                : t("Chưa có dữ liệu", "No data yet")}
            </small>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="budget-metric-card">
            <span className="budget-metric-label">{t("Còn lại", "Remaining")}</span>
            <div className="budget-metric-value text-success">{formatCurrency(overviewStats.totalRemaining)} VND</div>
            <small className="text-muted">{t("Theo tất cả hạn mức", "Across all budgets")}</small>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="budget-metric-card">
            <span className="budget-metric-label">{t("Cảnh báo", "Alerts")}</span>
            <div className="budget-metric-value text-danger">
              {overviewStats.warningCount + overviewStats.overCount}
            </div>
            <small className="text-muted">
              {t(
                `${overviewStats.warningCount} sắp đạt • ${overviewStats.overCount} đã vượt`,
                `${overviewStats.warningCount} near limit • ${overviewStats.overCount} exceeded`
              )}
            </small>
          </div>
        </div>
      </div>

      {(bannerState.warningItems.length > 0 || bannerState.overItems.length > 0) && (
        <div className="budget-warning-banner mb-4">
          <div>
            <p className="budget-warning-title">{t("Thông báo hạn mức", "Budget alerts")}</p>
            <span>
              {bannerState.overItems.length > 0 &&
                t(
                  `${bannerState.overItems.length} hạn mức đã vượt.`,
                  `${bannerState.overItems.length} budgets exceeded.`
                )}
              {bannerState.warningItems.length > 0 &&
                t(
                  ` ${bannerState.warningItems.length} hạn mức sắp đạt ngưỡng.`,
                  ` ${bannerState.warningItems.length} budgets nearing the limit.`
                )}
            </span>
          </div>
          <div className="budget-warning-actions">
            <div className="budget-warning-button-groups">
              {bannerState.warningItems.length > 0 && (
                <div className="budget-warning-button-group">
                  <button className="btn btn-warning btn-sm budget-warning-btn" onClick={() => setStatusFilter("warning")}>
                    {t("Xem cảnh báo", "View warnings")}
                  </button>
                </div>
              )}
              {bannerState.overItems.length > 0 && (
                <div className="budget-warning-button-group">
                  <button className="btn btn-sm budget-warning-over" onClick={() => setStatusFilter("over")}>
                    {t("Xem đã vượt", "View exceeded")}
                  </button>
                </div>
              )}
            </div>
            {(statusFilter === "warning" || statusFilter === "over") && (
              <button
                type="button"
                className="btn btn-sm budget-warning-exit"
                onClick={() => setStatusFilter("all")}
              >
                {t("Thoát", "Exit")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* FORM TÌM KIẾM */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body budget-filter-card">
          <div className="budget-filter-row">
            <form className="budget-filter-form" onSubmit={(e) => e.preventDefault()}>
              <div className="budget-search-field">
                <input
                  id="budget-search-input"
                  type="text"
                  className="form-control budget-search-input"
                  placeholder={t("Nhập một ký tự để bắt đầu tìm...", "Type a character to start searching...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="budget-search-clear"
                    onClick={handleClearSearch}
                    aria-label={t("Xóa tìm kiếm", "Clear search")}
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                )}
              </div>
            </form>

            <div className="budget-status-tabs budget-status-tabs--inline">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  className={`budget-status-tab ${statusFilter === tab.value ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                >
                  {tab.label}
                  <span className="badge-count">{statusCounts[tab.value] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          {searchQuery && (
            <div className="budget-search-results">
              {quickSearchResults.length === 0 ? (
                <p className="text-muted mb-0 small">
                  {t("Không tìm thấy hạn mức phù hợp.", "No budgets matched your search.")}
                </p>
              ) : (
                <ul className="budget-search-result-list">
                  {quickSearchResults.map((budget) => (
                    <li
                      key={budget.id}
                      className="budget-search-result-item"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleHighlightBudget(budget.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleHighlightBudget(budget.id);
                        }
                      }}
                    >
                      <div>
                        <span className="result-title">{budget.categoryName}</span>
                        <span className="result-meta">
                          {budget.walletName
                            ? `${t("Ví:", "Wallet:")} ${budget.walletName}`
                            : t("Tất cả ví", "All wallets")}
                        </span>
                      </div>
                      {budget.categoryType && (
                        <span className="result-chip">{budget.categoryType}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="budget-content-layout">
        <div className="budget-main-column">
          {visibleBudgets.length === 0 ? (
            <div className="budget-empty-state">
              <svg className="budget-empty-icon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="50" stroke="#e9ecef" strokeWidth="2" />
                <path d="M60 35v50M40 55h40" stroke="#6c757d" strokeWidth="3" strokeLinecap="round" />
                <circle cx="75" cy="35" r="8" fill="#28a745" />
                <path d="M72 35l2 2 4-4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3>{t("Bạn chưa thiết lập Hạn mức Chi tiêu", "You haven’t set up any budgets yet")}</h3>
              <p>{t("Hãy bắt đầu bằng cách tạo hạn mức cho một danh mục để kiểm soát chi tiêu của bạn.", "Create a budget for a category to start controlling your spending.")}</p>
              <button className="btn btn-primary" onClick={handleAddBudget}>{t("Thiết lập Hạn mức Chi tiêu đầu tiên", "Set up your first budget")}</button>
            </div>
          ) : (
            <div className="budget-card-scroll">
              <div className="budget-card-grid">
                {visibleBudgets.map((budget) => {
                const usage = budgetUsageMap.get(budget.id) || computeBudgetUsage(budget);
                const { spent, remaining, percent, status } = usage;
                const isExpired = status === "expired";
                const isUpcoming = status === "upcoming";
                const isInactive = isExpired || isUpcoming;
                const isOver = status === "over";
                const isWarning = status === "warning";
                const isSelected = transactionBudgetFilter?.id === budget.id;

                  return (
                    <div className="budget-card-grid__item" key={budget.id}>
                    <div
                      className={`budget-card${highlightedBudgetId === budget.id ? " budget-card--highlight" : ""}${isExpired ? " budget-card--expired" : ""}${isUpcoming ? " budget-card--upcoming" : ""}${isSelected ? " budget-card--selected" : ""}`}
                      data-budget-card={budget.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectBudgetForTransactions(budget)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelectBudgetForTransactions(budget);
                        }
                      }}
                    >
                      <div className="budget-card-header">
                        <div className="budget-card-heading">
                          <div className="budget-card-icon">
                            <i className="bi bi-wallet2" />
                          </div>
                          <div>
                            <h5 className="budget-card-title">{budget.categoryName}</h5>
                            {budget.walletName && (
                              <div className="text-muted small">
                                {budget.walletName === "Tất cả ví"
                                  ? t("Tất cả ví", "All wallets")
                                  : `${t("Ví:", "Wallet:")} ${budget.walletName}`}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`budget-status-chip ${budgetStatusTone[status] || ""}`}>
                          {budgetStatusLabel[status] || t("Đang ổn", "Healthy")}
                        </span>
                      </div>

                      <div className="budget-card-meta">
                        <div>
                          <label>{t("Khoảng thời gian", "Time range")}</label>
                          <p>
                            {budget.startDate && budget.endDate
                              ? `${formatDateOnly(budget.startDate)} - ${formatDateOnly(budget.endDate)}`
                              : t("Chưa đặt", "Not set")}
                          </p>
                        </div>
                        <div>
                          <label>{t("Cảnh báo", "Alert")}</label>
                          <p>
                            {t(
                              `${budget.alertPercentage ?? 80}% sử dụng`,
                              `${budget.alertPercentage ?? 80}% usage`
                            )}
                          </p>
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
                          <label className="budget-stat-label">{t("Hạn mức", "Limit")}</label>
                          <div className="budget-stat-value">{formatCurrency(budget.limitAmount)}</div>
                        </div>
                        <div className="budget-stat-item">
                          <label className="budget-stat-label">{t("Đã chi", "Spent")}</label>
                          <div className={`budget-stat-value ${isOver ? "danger" : ""}`}>{formatCurrency(spent)}</div>
                        </div>
                        <div className="budget-stat-item">
                          <label className="budget-stat-label">{t("Còn lại", "Remaining")}</label>
                          <div className={`budget-stat-value ${remaining < 0 ? "danger" : "success"}`}>{formatCurrency(remaining)}</div>
                        </div>
                        <div className="budget-stat-item">
                          <label className="budget-stat-label">{t("Sử dụng", "Used")}</label>
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
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenDetail(budget);
                          }}
                          disabled={isInactive}
                        >
                          <i className="bi bi-pie-chart" /> {t("Chi tiết", "Details")}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSendReminder(budget);
                          }}
                          disabled={isInactive}
                        >
                          <i className="bi bi-bell" /> {t("Nhắc nhở", "Reminder")}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCreateTransactionShortcut(budget);
                          }}
                          disabled={isInactive}
                        >
                          <i className="bi bi-plus-circle" /> {t("Tạo giao dịch", "Create transaction")}
                        </button>
                      </div>

                      <div className="budget-card-actions">
                        <button
                          className="btn-edit-budget"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditBudget(budget);
                          }}
                          title={t("Chỉnh sửa", "Edit")}
                        >
                          <i className="bi bi-pencil me-1"></i>{t("Chỉnh sửa", "Edit")}
                        </button>
                        <button
                          className="btn-delete-budget"
                          onClick={(event) => {
                            event.stopPropagation();
                            setConfirmDel(budget);
                          }}
                          title={t("Xóa", "Delete")}
                        >
                          <i className="bi bi-trash me-1"></i>{t("Xóa", "Delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </div>

        <aside className="budget-side-column">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="mb-1">{t("Giao dịch gần đây", "Recent transactions")}</h5>
                  <p className="text-muted small mb-0">{transactionPanelSubtitle}</p>
                </div>
              </div>

              {transactionBudgetFilter && !transactionBudgetFilter.isInactive && (
                <div className="budget-transaction-filter-pill">
                  <span>
                    {t(
                      `Đang xem giao dịch cho "${transactionBudgetFilter.categoryName}"${transactionBudgetFilter.walletName && transactionBudgetFilter.walletName !== "Tất cả ví" ? ` (${transactionBudgetFilter.walletName})` : ""}`,
                      `Viewing transactions for "${transactionBudgetFilter.categoryName}"${transactionBudgetFilter.walletName && transactionBudgetFilter.walletName !== "Tất cả ví" ? ` (${transactionBudgetFilter.walletName})` : ""}`
                    )}
                  </span>
                  <button type="button" onClick={handleClearTransactionBudgetFilter}>
                    {t("Xóa lọc", "Clear filter")}
                  </button>
                </div>
              )}

              <div className="table-responsive budget-transaction-mini">
                <table className="table budget-transaction-table">
                  <thead>
                    <tr>
                      <th>{t("Mã", "Code")}</th>
                      <th>{t("Danh mục", "Category")}</th>
                      <th>{t("Số tiền", "Amount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionBudgetFilter?.isInactive ? (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-4">
                          {t("Thẻ này chưa hoạt động.", "This budget card is inactive.")}
                        </td>
                      </tr>
                    ) : latestTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-4">
                          {t("Chưa có giao dịch được đồng bộ.", "No transactions have synced yet.")}
                        </td>
                      </tr>
                    ) : (
                      latestTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.code || tx.id}</td>
                          <td>
                            <div className="fw-semibold">{tx.category || t("Không xác định", "Unknown")}</div>
                            <small className="text-muted">{formatDateTime(tx.date)}</small>
                          </td>
                          <td className={`fw-semibold ${tx.type === "expense" ? "text-danger" : "text-success"}`}>
                            {formatCurrency(tx.amount)} {tx.currency || "VND"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <button className="btn btn-outline-primary w-100" type="button" onClick={handleViewAllTransactions}>
                {t("Xem tất cả giao dịch", "View all transactions")}
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
        title={t("Xóa Hạn mức Chi tiêu", "Delete budget")}
        message={
          confirmDel
            ? t(
                `Bạn chắc chắn muốn xóa hạn mức cho danh mục "${confirmDel.categoryName}"?`,
                `Are you sure you want to delete the budget for "${confirmDel.categoryName}"?`
              )
            : ""
        }
        okText={t("Xóa", "Delete")}
        cancelText={t("Hủy", "Cancel")}
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
  );
}
