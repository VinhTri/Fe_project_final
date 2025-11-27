import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../../../styles/home/Sidebar.css";
import { useLanguage } from "../../home/store/LanguageContext";

export default function HomeSidebar() {
  const { t } = useLanguage();

  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sb_collapsed") === "1"
  );

  useEffect(() => {
    document.body.classList.toggle("sb-collapsed", collapsed);
    localStorage.setItem("sb_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className={`sb__container ${collapsed ? "is-collapsed" : ""}`}>
      {/* Nút 3 gạch – thay thế logo */}
      <button
        className="sb__hamburger"
        onClick={() => setCollapsed((v) => !v)}
        aria-label="Thu gọn / Mở rộng Sidebar"
        title="Thu gọn / Mở rộng"
      >
        <i className="bi bi-list" />
      </button>

      {/* Menu chính */}
      <nav className="sb__nav">
        {[
          { to: "/home", labelKey: "sidebar.overview", icon: "bi-speedometer2", end: true },
          { to: "/home/wallets", labelKey: "sidebar.wallets", icon: "bi-wallet2" },
          { to: "/home/budgets", labelKey: "sidebar.budgets", icon: "bi-graph-up-arrow" },
          { to: "/home/reports", labelKey: "sidebar.reports", icon: "bi-graph-up-arrow" },
          { to: "/home/accounts", labelKey: "sidebar.accounts", icon: "bi-credit-card-2-front" },
          { to: "/home/funds", labelKey: "sidebar.funds", icon: "bi-wallet" },
          { to: "/home/categories", labelKey: "sidebar.categories", icon: "bi-tags" },
        ].map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            className={({ isActive }) =>
              "sb__link" + (isActive ? " is-active" : "")
            }
            title={collapsed ? t(m.labelKey) : undefined}
          >
            <span className="sb__icon">
              <i className={`bi ${m.icon}`} />
            </span>
            <span className="sb__text">{t(m.labelKey)}</span>
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