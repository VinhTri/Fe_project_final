// src/pages/Home/FundsPage.jsx
import React, { useMemo, useState } from "react";
import { useWalletData } from "../../home/store/WalletDataContext";
import { useLanguage } from "../../home/store/LanguageContext";
import "../../styles/home/FundsPage.css";

import FundSection from "../../components/funds/FundSection";
import ParticipateManager from "../../components/funds/ParticipateManager";
import PersonalTermForm from "../../components/funds/PersonalTermForm";
import PersonalNoTermForm from "../../components/funds/PersonalNoTermForm";
import GroupTermForm from "../../components/funds/GroupTermForm";
import GroupNoTermForm from "../../components/funds/GroupNoTermForm";
import FundDetailView from "../../components/funds/FundDetailView";

export default function FundsPage() {
  const { t } = useLanguage();
  const { wallets } = useWalletData();

  const personalWallets = useMemo(
    () => wallets.filter((w) => !w.isShared),
    [wallets]
  );
  const groupWallets = useMemo(
    () => wallets.filter((w) => w.isShared),
    [wallets]
  );

  // Dữ liệu mẫu quỹ (sau này bind API)
  const [funds, setFunds] = useState([
    // ... (GIỮ Y NGUYÊN 18 QUỸ như bạn đang có – mình giữ lại toàn bộ)
    {
      id: 1,
      name: "Quỹ Mua Laptop",
      type: "personal",
      hasTerm: true,
      role: "owner",
      current: 4_500_000,
      target: 15_000_000,
      currency: "VND",
    },
    {
      id: 2,
      name: "Quỹ Học Tiếng Anh",
      type: "personal",
      hasTerm: true,
      role: "owner",
      current: 2_000_000,
      target: 10_000_000,
      currency: "VND",
    },
    {
      id: 3,
      name: "Quỹ Du Lịch Đà Lạt",
      type: "personal",
      hasTerm: true,
      role: "owner",
      current: 3_500_000,
      target: 12_000_000,
      currency: "VND",
    },
    {
      id: 4,
      name: "Quỹ Khẩn Cấp",
      type: "personal",
      hasTerm: false,
      role: "owner",
      current: 8_000_000,
      target: null,
      currency: "VND",
    },
    {
      id: 5,
      name: "Quỹ Sức Khỏe",
      type: "personal",
      hasTerm: false,
      role: "owner",
      current: 2_500_000,
      target: null,
      currency: "VND",
    },
    {
      id: 6,
      name: "Quỹ Đầu Tư Cá Nhân",
      type: "personal",
      hasTerm: false,
      role: "owner",
      current: 15_000_000,
      target: null,
      currency: "VND",
    },
    {
      id: 7,
      name: "Quỹ Du Lịch Team 2025",
      type: "group",
      hasTerm: true,
      role: "owner",
      current: 12_000_000,
      target: 30_000_000,
      currency: "VND",
      members: [
        { id: 71, name: "Bạn A", email: "a@example.com", role: "owner" },
        { id: 72, name: "Bạn B", email: "b@example.com", role: "use" },
      ],
    },
    {
      id: 8,
      name: "Quỹ Dụng Cụ Học Tập Nhóm",
      type: "group",
      hasTerm: true,
      role: "owner",
      current: 5_000_000,
      target: 12_000_000,
      currency: "VND",
      members: [
        { id: 81, name: "Leader", email: "leader@example.com", role: "owner" },
        { id: 82, name: "Member 1", email: "m1@example.com", role: "view" },
      ],
    },
    {
      id: 9,
      name: "Quỹ Sự Kiện Lớp",
      type: "group",
      hasTerm: true,
      role: "owner",
      current: 9_000_000,
      target: 20_000_000,
      currency: "VND",
      members: [
        {
          id: 91,
          name: "Lớp Trưởng",
          email: "loptruong@example.com",
          role: "owner",
        },
        { id: 92, name: "Thủ Quỹ", email: "thuquy@example.com", role: "use" },
      ],
    },
    {
      id: 10,
      name: "Quỹ Sinh Hoạt Nhóm Bạn Thân",
      type: "group",
      hasTerm: false,
      role: "owner",
      current: 6_500_000,
      target: null,
      currency: "VND",
      members: [
        { id: 101, name: "Bạn 1", email: "ban1@example.com", role: "owner" },
        { id: 102, name: "Bạn 2", email: "ban2@example.com", role: "use" },
      ],
    },
    {
      id: 11,
      name: "Quỹ Cafe Cuối Tuần",
      type: "group",
      hasTerm: false,
      role: "owner",
      current: 1_200_000,
      target: null,
      currency: "VND",
      members: [
        { id: 111, name: "Anh A", email: "anha@example.com", role: "owner" },
        { id: 112, name: "Anh B", email: "anhb@example.com", role: "view" },
      ],
    },
    {
      id: 12,
      name: "Quỹ Thể Thao Nhóm",
      type: "group",
      hasTerm: false,
      role: "owner",
      current: 3_300_000,
      target: null,
      currency: "VND",
      members: [
        { id: 121, name: "Team Lead", email: "team@example.com", role: "owner" },
        { id: 122, name: "Member", email: "mem@example.com", role: "use" },
      ],
    },
    {
      id: 13,
      name: "Quỹ Gia Đình 2025",
      type: "group",
      hasTerm: true,
      role: "view",
      current: 21_500_000,
      target: 30_000_000,
      currency: "VND",
      members: [
        { id: 131, name: "Bố", email: "bo@example.com", role: "owner" },
        { id: 132, name: "Mẹ", email: "me@example.com", role: "use" },
        { id: 133, name: "Bạn", email: "ban@example.com", role: "view" },
      ],
    },
    {
      id: 14,
      name: "Quỹ Xây Sửa Nhà",
      type: "group",
      hasTerm: true,
      role: "view",
      current: 50_000_000,
      target: 100_000_000,
      currency: "VND",
      members: [
        {
          id: 141,
          name: "Anh Cả",
          email: "anhca@example.com",
          role: "owner",
        },
        { id: 142, name: "Em", email: "em@example.com", role: "view" },
      ],
    },
    {
      id: 15,
      name: "Quỹ Học Bổng Nhóm",
      type: "group",
      hasTerm: false,
      role: "view",
      current: 7_000_000,
      target: null,
      currency: "VND",
      members: [
        {
          id: 151,
          name: "Cô Giáo",
          email: "cogiao@example.com",
          role: "owner",
        },
        { id: 152, name: "Bạn", email: "ban@example.com", role: "view" },
      ],
    },
    {
      id: 16,
      name: "Quỹ Sinh Hoạt Lớp",
      type: "group",
      hasTerm: false,
      role: "manage",
      current: 7_800_000,
      target: null,
      currency: "VND",
      members: [
        {
          id: 161,
          name: "Lớp Trưởng",
          email: "loptruong@example.com",
          role: "owner",
        },
        { id: 162, name: "Thủ Quỹ", email: "thuquy@example.com", role: "use" },
        { id: 163, name: "Bạn", email: "ban@example.com", role: "manage" },
      ],
    },
    {
      id: 17,
      name: "Quỹ Dã Ngoại Khoa",
      type: "group",
      hasTerm: true,
      role: "manage",
      current: 18_000_000,
      target: 40_000_000,
      currency: "VND",
      members: [
        {
          id: 171,
          name: "Trưởng Khoa",
          email: "truongkhoa@example.com",
          role: "owner",
        },
        { id: 172, name: "Bạn", email: "ban@example.com", role: "manage" },
      ],
    },
    {
      id: 18,
      name: "Quỹ Từ Thiện Nhóm",
      type: "group",
      hasTerm: false,
      role: "manage",
      current: 9_500_000,
      target: null,
      currency: "VND",
      members: [
        { id: 181, name: "Leader", email: "leader@example.com", role: "owner" },
        { id: 182, name: "Bạn", email: "ban@example.com", role: "manage" },
        { id: 183, name: "Member", email: "mem@example.com", role: "view" },
      ],
    },
  ]);

  const personalTermFunds = useMemo(
    () =>
      funds.filter(
        (f) => f.type === "personal" && f.hasTerm && f.role === "owner"
      ),
    [funds]
  );
  const personalNoTermFunds = useMemo(
    () =>
      funds.filter(
        (f) => f.type === "personal" && !f.hasTerm && f.role === "owner"
      ),
    [funds]
  );
  const groupTermFunds = useMemo(
    () =>
      funds.filter(
        (f) => f.type === "group" && f.hasTerm && f.role === "owner"
      ),
    [funds]
  );
  const groupNoTermFunds = useMemo(
    () =>
      funds.filter(
        (f) => f.type === "group" && !f.hasTerm && f.role === "owner"
      ),
    [funds]
  );
  const participateViewFunds = useMemo(
    () => funds.filter((f) => f.role === "view"),
    [funds]
  );
  const participateUseFunds = useMemo(
    () => funds.filter((f) => f.role === "manage"),
    [funds]
  );

  const [viewMode, setViewMode] = useState("overview"); // overview | detail | create-personal | create-group | participate
  const [personalTab, setPersonalTab] = useState("term");
  const [groupTab, setGroupTab] = useState("term");
  const [activeFund, setActiveFund] = useState(null);

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

  return (
    <div className="funds-page container py-4">
      {/* HEADER */}
      <div className="funds-header card border-0 shadow-sm mb-3 p-3 p-lg-4">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <h3 className="mb-1">
              <i className="bi bi-piggy-bank me-2" />
              {t("funds.title")}
            </h3>
            <p className="mb-0 text-muted">
              {t("funds.subtitle")}
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
            {viewMode === "overview" ? (
              <>
                <button
                  type="button"
                  className="btn btn-outline-primary funds-btn"
                  onClick={() => setViewMode("create-personal")}
                >
                  <i className="bi bi-plus-circle me-1" />
                  {t("funds.btn.create_personal")}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setViewMode("create-group")}
                >
                  <i className="bi bi-people-fill me-1" />
                  {t("funds.btn.create_group")}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setViewMode("participate")}
                >
                  <i className="bi bi-person-check me-1" />
                  {t("funds.btn.manage_participate")}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setViewMode("overview");
                  setActiveFund(null);
                }}
              >
                <i className="bi bi-arrow-left me-1" />
                {t("funds.btn.back")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      {viewMode === "overview" && (
        <>
          {funds.length === 0 && (
            <div className="card border-0 shadow-sm p-4 mb-3">
              <h5 className="mb-2">{t("funds.empty.title")}</h5>
              <p className="mb-0 text-muted" dangerouslySetInnerHTML={{ __html: t("funds.empty.desc") }} />
            </div>
          )}

          <div className="funds-two-col">
            {(personalTermFunds.length > 0 ||
              personalNoTermFunds.length > 0) && (
              <div className="funds-box">
                <div className="funds-box__header">{t("funds.section.personal")}</div>
                <div className="funds-box__body">
                  <p className="text-muted small mb-3">
                    {t("funds.section.personal_desc")}
                  </p>

                  <FundSection
                    title={t("funds.section.personal_term")}
                    subtitle={t("funds.section.personal_term_desc")}
                    items={personalTermFunds}
                    onSelectFund={handleSelectFund}
                  />

                  <FundSection
                    title={t("funds.section.personal_no_term")}
                    subtitle={t("funds.section.personal_no_term_desc")}
                    items={personalNoTermFunds}
                    onSelectFund={handleSelectFund}
                  />
                </div>
              </div>
            )}

            {(groupTermFunds.length > 0 || groupNoTermFunds.length > 0) && (
              <div className="funds-box">
                <div className="funds-box__header">{t("funds.section.group")}</div>
                <div className="funds-box__body">
                  <p className="text-muted small mb-3">
                    {t("funds.section.group_desc")}
                  </p>

                  <FundSection
                    title={t("funds.section.group_term")}
                    subtitle={t("funds.section.group_term_desc")}
                    items={groupTermFunds}
                    onSelectFund={handleSelectFund}
                  />

                  <FundSection
                    title={t("funds.section.group_no_term")}
                    subtitle={t("funds.section.group_no_term_desc")}
                    items={groupNoTermFunds}
                    onSelectFund={handleSelectFund}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

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

      {viewMode === "create-personal" && (
        <div className="card border-0 shadow-sm p-3 p-lg-4">
          <div className="funds-tabs mb-3">
            <button
              type="button"
              className={
                "funds-tab" +
                (personalTab === "term" ? " funds-tab--active" : "")
              }
              onClick={() => setPersonalTab("term")}
            >
              {t("funds.section.personal_term")}
            </button>
            <button
              type="button"
              className={
                "funds-tab" +
                (personalTab === "no-term" ? " funds-tab--active" : "")
              }
              onClick={() => setPersonalTab("no-term")}
            >
              {t("funds.section.personal_no_term")}
            </button>
          </div>

          {personalTab === "term" ? (
            <PersonalTermForm wallets={personalWallets} />
          ) : (
            <PersonalNoTermForm wallets={personalWallets} />
          )}
        </div>
      )}

      {viewMode === "create-group" && (
        <div className="card border-0 shadow-sm p-3 p-lg-4">
          <div className="funds-tabs mb-3">
            <button
              type="button"
              className={
                "funds-tab" + (groupTab === "term" ? " funds-tab--active" : "")
              }
              onClick={() => setGroupTab("term")}
            >
              {t("funds.section.group_term")}
            </button>
            <button
              type="button"
              className={
                "funds-tab" +
                (groupTab === "no-term" ? " funds-tab--active" : "")
              }
              onClick={() => setGroupTab("no-term")}
            >
              {t("funds.section.group_no_term")}
            </button>
          </div>

          {groupTab === "term" ? (
            <GroupTermForm wallets={groupWallets} />
          ) : (
            <GroupNoTermForm wallets={groupWallets} />
          )}
        </div>
      )}

      {viewMode === "participate" && (
        <div className="card border-0 shadow-sm p-3 p-lg-4">
          <ParticipateManager
            viewFunds={participateViewFunds}
            useFunds={participateUseFunds}
          />
        </div>
      )}
    </div>
  );
}
