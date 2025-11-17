import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../../../styles/home/Sidebar.css";
import { useAuth, ROLES } from "../../../home/store/AuthContext";

const BASE_MENU = [
  { to: "/home", label: "Tổng quan", icon: "bi-speedometer2", end: true },
  { to: "/home/wallets", label: "Ví", icon: "bi-wallet2" },
  { to: "/home/funds", label: "Quỹ", icon: "bi-piggy-bank" },
  { to: "/home/transactions", label: "Giao dịch", icon: "bi-cash-stack" },
  { to: "/home/categories", label: "Danh mục", icon: "bi-tags" },
  { to: "/home/wallet-groups", label: "Nhóm ví", icon: "bi-collection" },
  { to: "/home/budgets", label: "Ngân sách", icon: "bi-graph-up-arrow" },
  { to: "/home/reports", label: "Báo cáo", icon: "bi-bar-chart-line" },
  //Không còn mục “Tài khoản”
];

export default function HomeSidebar() {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sb_collapsed") === "1"
  );
  const { currentUser } = useAuth();

  // =============================
  // Build menu
  // =============================
  const MENU = [...BASE_MENU];

if (currentUser?.role === ROLES.ADMIN) {
  MENU.push(
    {
      to: "/admin/users",
      label: "Quản lý người dùng",
      icon: "bi-people-fill",
    },
    {
      to: "/admin/reviews",
      label: "Đánh giá & bình luận",
      icon: "bi-chat-dots",
    }
  );
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
          <div className="sb__brand-title">HỆ THỐNG QUẢN LÝ</div>
          <div className="sb__brand-sub">Quản lý ví cá nhân</div>
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
        <span className="sb__text sb__menu-title">Menu</span>
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
