import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../../../styles/home/Sidebar.css";
import { useAuth, ROLES } from "../../../home/store/AuthContext";
import { useLanguage } from "../../../home/store/LanguageContext";

export default function HomeSidebar() {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sb_collapsed") === "1"
  );
  const { currentUser } = useAuth();

  // =============================
  // 👉 Build menu
  // =============================
  const MENU = [
    { to: "/home", label: t("sidebar.overview"), icon: "bi-speedometer2", end: true },
    { to: "/home/wallets", label: t("sidebar.wallets"), icon: "bi-wallet2" },
    { to: "/home/funds", label: t("sidebar.funds"), icon: "bi-piggy-bank" },
    { to: "/home/transactions", label: t("sidebar.transactions"), icon: "bi-cash-stack" },
    { to: "/home/categories", label: t("sidebar.categories"), icon: "bi-tags" },
    { to: "/home/budgets", label: t("sidebar.budgets"), icon: "bi-graph-up-arrow" },
    { to: "/home/reports", label: t("sidebar.reports"), icon: "bi-bar-chart-line" },
  ];

  if (currentUser?.role === ROLES.ADMIN) {
    MENU.push(
      {
        to: "/admin/users",
        label: t("sidebar.user_management"),
        icon: "bi-people-fill",
      },
      {
        to: "/admin/reviews",
        label: t("sidebar.feedback"),
        icon: "bi-chat-dots",
      }
    );
  } else {
    // Nếu là User/Viewer thì có thể thêm link Feedback (Gửi đánh giá)
    MENU.push({
      to: "/home/feedback",
      label: t("sidebar.feedback"),
      icon: "bi-chat-text",
    });
  }

  useEffect(() => {
    document.body.classList.toggle("sb-collapsed", collapsed);
    localStorage.setItem("sb_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <>
      {/* BRAND */}
      <div className="sb__brand">
        <video
          className="sb__brand-video"
          src="/videos/logo.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="sb__brand-text">
          <div className="sb__brand-title">{t("sidebar.brand.title")}</div>
          <div className="sb__brand-sub">{t("sidebar.brand.subtitle")}</div>
        </div>
      </div>

      {/* HEADER BUTTON */}
      <button
        type="button"
        className="sb__link sb__link--header"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="sb__icon">
          <i className="bi bi-list" />
        </span>
        <span className="sb__text sb__menu-title">{t("sidebar.menu")}</span>
      </button>

      <div className="sb__divider" />

      {/* NAV */}
      <nav className="sb__nav sb__scroll">
        {MENU.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            className={({ isActive }) =>
              "sb__link" + (isActive ? " is-active" : "")
            }
            data-title={collapsed ? m.label : undefined}
            aria-label={collapsed ? m.label : undefined}
          >
            <span className="sb__icon">
              <i className={`bi ${m.icon}`} />
            </span>
            <span className="sb__text">{m.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sb__footer" />
    </>
  );
}
