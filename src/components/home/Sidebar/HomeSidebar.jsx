import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../../../styles/home/Sidebar.css";

const MENU = [
  { to: "/home", label: "Tổng quan", icon: "bi-speedometer2", end: true },
  { to: "/home/wallets", label: "Ví", icon: "bi-wallet2" },
  { to: "/home/categories", label: "Danh mục", icon: "bi-tags" },
  { to: "/home/wallet-groups", label: "Nhóm ví", icon: "bi-collection" },
  { to: "/home/budgets", label: "Ngân sách", icon: "bi-graph-up-arrow" },
  { to: "/home/transactions", label: "Giao dịch", icon: "bi-cash-stack" },
  { to: "/home/reports", label: "Báo cáo", icon: "bi-bar-chart-line" },
  { to: "/home/accounts", label: "Tài khoản", icon: "bi-credit-card-2-front" },
];

export default function HomeSidebar() {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sb_collapsed") === "1"
  );

  useEffect(() => {
    document.body.classList.toggle("sb-collapsed", collapsed);
    localStorage.setItem("sb_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <>
      {/* Header: nút 3 gạch + MENU (dùng data-title thay vì title) */}
      <button
        type="button"
        className="sb__link sb__link--header"
        onClick={() => setCollapsed((v) => !v)}
        aria-label="Thu gọn / Mở rộng Sidebar"
        data-title={collapsed ? "Mở rộng" : undefined}
      >
        <span className="sb__icon" aria-hidden="true">
          <i className="bi bi-list" />
        </span>
        <span className="sb__text sb__menu-title">Menu</span>
      </button>

      <div className="sb__divider" />

      {/* Danh sách menu đặt trong vùng cuộn riêng */}
      <nav className="sb__nav sb__scroll" aria-label="Sidebar">
        {MENU.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            className={({ isActive }) =>
              "sb__link" + (isActive ? " is-active" : "")
            }
            // ❌ KHÔNG dùng title để tránh tooltip mặc định
            // ✅ Dùng data-title + aria-label
            data-title={collapsed ? m.label : undefined}
            aria-label={collapsed ? m.label : undefined}
          >
            <span className="sb__icon" aria-hidden="true">
              <i className={`bi ${m.icon}`} />
            </span>
            <span className="sb__text">{m.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer (đệm dưới) */}
      <div className="sb__footer" />
    </>
  );
}
