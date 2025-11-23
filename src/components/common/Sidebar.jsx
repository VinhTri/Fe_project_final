import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../../../styles/home/Sidebar.css";
import { useLanguage } from "../../home/store/LanguageContext";

const MENU = [
  { to: "/home", labelVi: "Tổng quan", labelEn: "Overview", icon: "bi-speedometer2", end: true },
  { to: "/home/wallets", labelVi: "Ví", labelEn: "Wallets", icon: "bi-wallet2" },
  { to: "/home/budgets", labelVi: "Ngân sách", labelEn: "Budgets", icon: "bi-graph-up-arrow" },
  { to: "/home/reports", labelVi: "Báo cáo", labelEn: "Reports", icon: "bi-graph-up-arrow" },
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

  const collapseLabel = t(
    "Thu gọn / Mở rộng Sidebar",
    "Collapse / expand sidebar"
  );
  const collapseTitle = t("Thu gọn / Mở rộng", "Collapse / Expand");

  return (
    <div className={`sb__container ${collapsed ? "is-collapsed" : ""}`}>
      {/* Nút 3 gạch – thay thế logo */}
      <button
        className="sb__hamburger"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapseLabel}
        title={collapseTitle}
      >
        <i className="bi bi-list" />
      </button>

      {/* Menu chính */}
      <nav className="sb__nav">
        {MENU.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            className={({ isActive }) =>
              "sb__link" + (isActive ? " is-active" : "")
            }
            title={collapsed ? t(m.labelVi, m.labelEn) : undefined}
          >
            <span className="sb__icon">
              <i className={`bi ${m.icon}`} />
            </span>
            <span className="sb__text">{t(m.labelVi, m.labelEn)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sb__footer">
        <div className="sb__leaf" />
      </div>
    </div>
  );
}