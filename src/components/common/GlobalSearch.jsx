import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/GlobalSearch.css";
import { useLanguage } from "../../home/store/LanguageContext";

const MENU_ITEMS = [
  { id: "dashboard", labelVi: "Tổng quan", labelEn: "Overview", path: "/home", icon: "bi-speedometer2" },
  { id: "wallets", labelVi: "Ví", labelEn: "Wallets", path: "/home/wallets", icon: "bi-wallet2" },
  { id: "budgets", labelVi: "Ngân sách", labelEn: "Budgets", path: "/home/budgets", icon: "bi-graph-up-arrow" },
  { id: "transactions", labelVi: "Giao dịch", labelEn: "Transactions", path: "/home/transactions", icon: "bi-cash-stack" },
  { id: "categories", labelVi: "Danh mục", labelEn: "Categories", path: "/home/categories", icon: "bi-tag" },
  { id: "reports", labelVi: "Báo cáo", labelEn: "Reports", path: "/home/reports", icon: "bi-graph-up" },
  { id: "budgets-edit", labelVi: "Chỉnh sửa ngân sách", labelEn: "Edit budgets", path: "/home/budgets", icon: "bi-pencil" },
  { id: "add-transaction", labelVi: "Thêm giao dịch", labelEn: "Add transaction", path: "/home/transactions", icon: "bi-plus-lg" },
  { id: "add-category", labelVi: "Thêm danh mục", labelEn: "Add category", path: "/home/categories", icon: "bi-plus-lg" },
  { id: "add-wallet", labelVi: "Thêm ví", labelEn: "Add wallet", path: "/home/wallets", icon: "bi-plus-lg" },
  { id: "settings", labelVi: "Cài đặt", labelEn: "Settings", path: "/home/settings", icon: "bi-gear" },
  { id: "profile", labelVi: "Hồ sơ", labelEn: "Profile", path: "/home/profile", icon: "bi-person-circle" },
];

export default function GlobalSearch() {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchBoxRef = useRef(null);
  const resultsRef = useRef(null);
  const { translate } = useLanguage();
  const t = translate;

  // Tìm kiếm khi gõ
  const handleSearch = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);

    if (text.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Lọc các mục khớp với text tìm kiếm
    const filtered = MENU_ITEMS.filter((item) => {
      const vi = item.labelVi.toLowerCase();
      const en = item.labelEn.toLowerCase();
      return (
        vi.includes(text) ||
        en.includes(text) ||
        item.id.toLowerCase().includes(text)
      );
    });

    setResults(filtered);
    setIsOpen(true);
  };

  // Chọn một mục từ kết quả
  const handleSelectResult = (item) => {
    setSearchText("");
    setResults([]);
    setIsOpen(false);
    navigate(item.path);
  };

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý phím Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && results.length > 0) {
      handleSelectResult(results[0]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchText("");
    }
  };

  return (
    <div className="global-search-container">
      <div
        className="global-search-box"
        ref={searchBoxRef}
      >
        <i className="bi bi-search global-search-icon" />
        <input
          type="text"
          className="global-search-input"
          placeholder={t("Tìm kiếm chức năng...", "Search features...")}
          value={searchText}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          onFocus={() => searchText.trim().length > 0 && setIsOpen(true)}
        />
      </div>

      {/* Dropdown kết quả */}
      {isOpen && results.length > 0 && (
        <div className="global-search-results" ref={resultsRef}>
          {results.map((item) => (
            <div
              key={item.id}
              className="global-search-result-item"
              onClick={() => handleSelectResult(item)}
            >
              <i className={`bi ${item.icon} global-search-result-icon`} />
              <span className="global-search-result-label">{t(item.labelVi, item.labelEn)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Thông báo không tìm thấy */}
      {isOpen && searchText.trim().length > 0 && results.length === 0 && (
        <div className="global-search-empty">
          <p className="mb-0">
            {t(
              `Không tìm thấy chức năng "${searchText}"`,
              `No feature found for "${searchText}"`
            )}
          </p>
        </div>
      )}
    </div>
  );
}
