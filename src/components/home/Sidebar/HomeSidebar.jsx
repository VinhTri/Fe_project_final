import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../../../styles/home/Sidebar.css";
import { useLanguage } from "../../../home/store/LanguageContext";

const MENU = [
  { to: "/home", labelVi: "Tổng quan", labelEn: "Overview", icon: "bi-speedometer2", end: true },
  { to: "/home/wallets", labelVi: "Ví", labelEn: "Wallets", icon: "bi-wallet2" },
  { to: "/home/funds", labelVi: "Quỹ", labelEn: "Funds", icon: "bi-piggy-bank" },
  { to: "/home/transactions", labelVi: "Giao dịch", labelEn: "Transactions", icon: "bi-cash-stack" },
  { to: "/home/categories", labelVi: "Danh mục", labelEn: "Categories", icon: "bi-tags" },
  { to: "/home/budgets", labelVi: "Ngân sách", labelEn: "Budgets", icon: "bi-graph-up-arrow" },
  { to: "/home/reports", labelVi: "Báo cáo", labelEn: "Reports", icon: "bi-bar-chart-line" },
  { to: "/home/accounts", labelVi: "Tài khoản", labelEn: "Accounts", icon: "bi-credit-card-2-front" },
];

export default function HomeSidebar() {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sb_collapsed") === "1"
  );
  const { translate } = useLanguage();
  const t = translate;

  useEffect(() => {
    document.body.classList.toggle("sb-collapsed", collapsed);
    localStorage.setItem("sb_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const brandTitle = t("HỆ THỐNG QUẢN LÝ", "MANAGEMENT SYSTEM");
  const brandSub = t("Quản lý ví cá nhân", "Personal wallet manager");
  const toggleLabel = t("Thu gọn / Mở rộng Sidebar", "Collapse / expand sidebar");
  const toggleTooltip = t("Mở rộng", "Expand");
  const menuLabel = t("Menu", "Menu");

  return (
    <div className={`sb__container ${collapsed ? "is-collapsed" : ""}`}>
      {/* ============================
          BRAND / LOGO VIDEO
         ============================ */}
      <div className="sb__brand">
        <video
          className="sb__brand-video"
          src="/videos/logo.mp4" // đổi đường dẫn video của bạn ở đây
          autoPlay
          loop
          muted
          playsInline
        />

        <div className="sb__brand-text">
          <div className="sb__brand-title">{brandTitle}</div>
          <div className="sb__brand-sub">{brandSub}</div>
        </div>
      </div>

      {/* ============================
          HEADER BUTTON (MENU)
         ============================ */}
      <button
        type="button"
        className="sb__link sb__link--header"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={toggleLabel}
        data-title={collapsed ? toggleTooltip : undefined}
      >
        <span className="sb__icon" aria-hidden="true">
          <i className="bi bi-list" />
        </span>
        <span className="sb__text sb__menu-title">{menuLabel}</span>
      </button>

      <div className="sb__divider" />

      {/* ============================
          NAVIGATION
         ============================ */}
      <nav className="sb__nav sb__scroll" aria-label="Sidebar">
        {MENU.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            className={({ isActive }) =>
              "sb__link" + (isActive ? " is-active" : "")
            }
            data-title={collapsed ? t(m.labelVi, m.labelEn) : undefined}
            aria-label={collapsed ? t(m.labelVi, m.labelEn) : undefined}
          >
            <span className="sb__icon" aria-hidden="true">
              <i className={`bi ${m.icon}`} />
            </span>
            <span className="sb__text">{t(m.labelVi, m.labelEn)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer (đệm dưới) */}
      <div className="sb__footer" />
    </div>
  );
}
