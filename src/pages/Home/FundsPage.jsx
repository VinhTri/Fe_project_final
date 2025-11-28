// src/pages/Home/FundsPage.jsx
import React, { useMemo, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useWalletData } from "../../contexts/WalletDataContext";
import "../../styles/pages/FundsPage.css";
import "../../styles/components/funds/FundCard.css";
import "../../styles/components/funds/FundSection.css";
import "../../styles/components/funds/FundDetail.css";
import "../../styles/components/funds/FundForms.css";

// Components
import FundSection from "../../components/funds/FundSection";
import PersonalTermForm from "../../components/funds/PersonalTermForm";
import PersonalNoTermForm from "../../components/funds/PersonalNoTermForm";
import FundDetailView from "../../components/funds/FundDetailView";

export default function FundsPage() {
  const { wallets } = useWalletData();
  const { t } = useLanguage();

  // CHỈ VÍ CÁ NHÂN (vì đã bỏ quỹ nhóm)
  const personalWallets = useMemo(
    () => wallets.filter((w) => !w.isShared),
    [wallets]
  );

  // Dữ liệu mẫu (sau này bind API)
  const [funds, setFunds] = useState([
    {
      id: 1,
      name: "Quỹ Mua Laptop",
      type: "personal",
      hasTerm: true,
      role: "owner",
      current: 4500000,
      target: 15000000,
      currency: "VND",
    },
    {
      id: 2,
      name: "Quỹ Học Tiếng Anh",
      type: "personal",
      hasTerm: true,
      role: "owner",
      current: 2000000,
      target: 10000000,
      currency: "VND",
    },
    {
      id: 3,
      name: "Quỹ Khẩn Cấp",
      type: "personal",
      hasTerm: false,
      role: "owner",
      current: 8000000,
      target: null,
      currency: "VND",
    },
  ]);

  // Chỉ lọc quỹ cá nhân
  const personalTermFunds = useMemo(
    () => funds.filter((f) => f.type === "personal" && f.hasTerm),
    [funds]
  );
  const personalNoTermFunds = useMemo(
    () => funds.filter((f) => f.type === "personal" && !f.hasTerm),
    [funds]
  );

  // View mode
  const [viewMode, setViewMode] = useState("overview"); // overview | detail | create
  const [personalTab, setPersonalTab] = useState("term");
  const [activeFund, setActiveFund] = useState(null);

  // Tìm kiếm + sắp xếp
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState("name"); // name | currentDesc | progressDesc

  const handleSelectFund = (fund) => {
    setActiveFund(fund);
    setViewMode("detail");
  };

  const handleUpdateFund = (updatedFund) => {
    setFunds((prev) =>
      prev.map((f) => (f.id === updatedFund.id ? updatedFund : f))
    );
    setActiveFund(updatedFund);
  };

  // Helper: áp dụng search + sort
  const applySearchAndSort = (list) => {
    let result = [...list];

    // Tìm kiếm theo tên quỹ
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((f) =>
        (f.name || "").toLowerCase().includes(lower)
      );
    }

    // Sắp xếp
    switch (sortMode) {
      case "currentDesc": // Số tiền hiện tại giảm dần
        result.sort((a, b) => (b.current || 0) - (a.current || 0));
        break;
      case "progressDesc": {
        // Tỷ lệ hoàn thành giảm dần
        const getProgress = (f) =>
          f.target && f.target > 0 ? (f.current || 0) / f.target : 0;
        result.sort((a, b) => getProgress(b) - getProgress(a));
        break;
      }
      case "name":
      default:
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
    }

    return result;
  };

  const filteredTermFunds = useMemo(
    () => applySearchAndSort(personalTermFunds),
    [personalTermFunds, searchTerm, sortMode]
  );

  const filteredNoTermFunds = useMemo(
    () => applySearchAndSort(personalNoTermFunds),
    [personalNoTermFunds, searchTerm, sortMode]
  );

  return (
    <div className="funds-page tx-page container-fluid py-4">
      <div className="tx-page-inner">
      {/* HEADER */}
      {/* HEADER QUỸ – CHUẨN LAYOUT GIỐNG VÍ */}
<div className="funds-header-unique mb-3">
  {/* TRÁI: ICON + TEXT */}
  <div className="funds-header-left">
    <div className="funds-header-icon">
      <i className="bi bi-piggy-bank" />
    </div>

    <div className="funds-header-text">
      <h2 className="mb-1">{t('funds.title')}</h2>
      <p className="mb-0 text-muted">{t('funds.subtitle')}</p>
    </div>
  </div>

  {/* PHẢI: NÚT */}
  {viewMode === "overview" ? (
    <button
      type="button"
      className="btn btn-outline-primary funds-header-btn"
      onClick={() => setViewMode("create")}
    >
      <i className="bi bi-plus-circle me-1" />
      {t('funds.btn.create_personal')}
    </button>
  ) : (
    <button
      type="button"
      className="btn btn-outline-secondary funds-header-btn"
      onClick={() => {
        setViewMode("overview");
        setActiveFund(null);
      }}
    >
      <i className="bi bi-arrow-left me-1" />
      {t('funds.btn.back')}
    </button>
  )}
</div>

      {/* OVERVIEW */}
      {viewMode === "overview" && (
        <div className="funds-wrapper">
          {/* Thanh tìm kiếm & sắp xếp */}
          <div className="funds-toolbar">
            <div className="funds-toolbar__search">
              <i className="bi bi-search" />

              <input
                type="text"
                placeholder={t('funds.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {searchTerm && (
                <button
                  type="button"
                  className="funds-clear-search"
                  onClick={() => setSearchTerm("")}
                >
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>

            <div className="funds-toolbar__sort">
              <span>{t('funds.sort_label')}</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
              >
                <option value="name">{t('funds.sort.name')}</option>
                <option value="currentDesc">{t('funds.sort.currentDesc')}</option>
                <option value="progressDesc">{t('funds.sort.progressDesc')}</option>
              </select>
            </div>
          </div>

          {/* 2 cột: có thời hạn / không thời hạn */}
          <div className="funds-two-col">
            {/* BOX 1: QUỸ CÓ THỜI HẠN */}
            <div className="fund-section-wrapper fund-section-wrapper--term">
              <FundSection
                title={t('funds.section.personal_term')}
                subtitle={t('funds.section.personal_term_desc')}
                items={filteredTermFunds}
                onSelectFund={handleSelectFund}
              />
            </div>

            {/* BOX 2: QUỸ KHÔNG THỜI HẠN */}
            <div className="fund-section-wrapper fund-section-wrapper--no-term">
              <FundSection
                title={t('funds.section.personal_no_term')}
                subtitle={t('funds.section.personal_no_term_desc')}
                items={filteredNoTermFunds}
                onSelectFund={handleSelectFund}
              />
            </div>
          </div>
        </div>
      )}

      {/* DETAIL */}
      {viewMode === "detail" && activeFund && (
        <div className="card border-0 shadow-sm p-3 p-lg-4">
          <FundDetailView
            fund={activeFund}
            onBack={() => {
              setViewMode("overview");
              setActiveFund(null);
            }}
            onUpdateFund={handleUpdateFund}
          />
        </div>
      )}

      {/* CREATE FUND */}
      {viewMode === "create" && (
        <div className="card border-0 shadow-sm p-3 p-lg-4">
          <div className="funds-tabs mb-3">
            <button
              className={
                "funds-tab" + (personalTab === "term" ? " funds-tab--active" : "")
              }
              onClick={() => setPersonalTab("term")}
            >
              {t('funds.section.personal_term')}
            </button>
            <button
              className={
                "funds-tab" +
                (personalTab === "no-term" ? " funds-tab--active" : "")
              }
              onClick={() => setPersonalTab("no-term")}
            >
              {t('funds.section.personal_no_term')}
            </button>
          </div>

          {personalTab === "term" ? (
            <PersonalTermForm wallets={personalWallets} />
          ) : (
            <PersonalNoTermForm wallets={personalWallets} />
          )}
        </div>
      )}
      </div>
    </div>
  );
}
