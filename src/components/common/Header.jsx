// src/components/common/Header.jsx
import { Link } from "react-router-dom";
import "../../styles/Header.css";

export default function Header() {
  return (
    <header className="app-header d-flex justify-content-between align-items-center p-3">
        <div className="app-header__brand d-flex align-items-center ">
          <img src="../assets/images/logo.png" alt="Logo" className="app-header__logo me-3" />
          <div className="app-header__brand-text">
            <strong className="app-header__title">Hệ thống quản lý chi tiêu cá nhân</strong>
            <p className="app-header__subtitle mb-0">Chào mừng bạn đến với hệ thống</p>
          </div>
        {/* chừa chỗ cho nút hoặc menu sau này */}
      </div>
    </header>
  );
}
