// src/components/funds/ParticipateManager.jsx
import React, { useEffect, useState } from "react";
import FundSection from "./FundSection";
import { useLanguage } from "../../home/store/LanguageContext";

export default function ParticipateManager({ viewFunds, useFunds }) {
  const { t } = useLanguage();
  const [selectedFund, setSelectedFund] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!selectedFund) {
      setMembers([]);
      return;
    }

    if (Array.isArray(selectedFund.members) && selectedFund.members.length > 0) {
      setMembers(selectedFund.members);
    } else {
      setMembers([
        { id: 1, name: "Bạn A", email: "a@example.com", role: "owner" },
        { id: 2, name: "Bạn B", email: "b@example.com", role: "use" },
        { id: 3, name: "Bạn C", email: "c@example.com", role: "view" },
      ]);
    }
  }, [selectedFund]);

  const handleAddMember = () => {
    setMembers((prev) => [
      ...prev,
      { id: Date.now(), name: "", email: "", role: "view" },
    ]);
  };

  const handleChangeMember = (id, field, value) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleRemoveMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSaveMembers = () => {
    if (!selectedFund) return;
    console.log("Lưu cập nhật thành viên quỹ tham gia", {
      fundId: selectedFund.id,
      members,
    });
    alert("Đã lưu thay đổi thành viên (demo trên FE).");
  };

  return (
    <div className="row g-3">
      {/* CỘT TRÁI: DANH SÁCH QUỸ ĐƯỢC THAM GIA */}
      <div className="col-lg-5">
        <FundSection
          title={t("funds.participate.view_title")}
          subtitle={t("funds.participate.view_desc")}
          items={viewFunds}
          onSelectFund={() => {
            // quỹ xem: không cho chỉnh
          }}
        />

        <FundSection
          title={t("funds.participate.use_title")}
          subtitle={t("funds.participate.use_desc")}
          items={useFunds}
          onSelectFund={(fund) => setSelectedFund(fund)}
        />
      </div>

      {/* CỘT PHẢI: CHI TIẾT QUỸ ĐƯỢC CHỌN */}
      <div className="col-lg-7">
        {!selectedFund ? (
          <div className="card border-0 shadow-sm p-3 p-lg-4">
            <h5 className="mb-2">{t("funds.participate.select_hint_title")}</h5>
            <p className="mb-0 text-muted" dangerouslySetInnerHTML={{ __html: t("funds.participate.select_hint_desc") }} />
          </div>
        ) : (
          <div className="funds-fieldset">
            <div className="funds-fieldset__legend">
              {t("funds.participate.manage_title")}
            </div>

            <div className="funds-field">
              <label>{t("funds.form.name")}</label>
              <input
                type="text"
                value={selectedFund.name}
                onChange={(e) =>
                  setSelectedFund((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <div className="funds-hint">
                {t("funds.participate.name_hint")}
              </div>
            </div>

            <div className="funds-field funds-field--inline">
              <div>
                <label>{t("funds.form.type")}</label>
                <input
                  type="text"
                  disabled
                  value={
                    selectedFund.type === "group"
                      ? t("funds.detail.group_fund")
                      : t("funds.detail.personal_fund")
                  }
                />
              </div>
              <div>
                <label>{t("funds.participate.role")}</label>
                <input
                  type="text"
                  disabled
                  value={
                    selectedFund.role === "manage"
                      ? t("funds.detail.role.manage")
                      : t("funds.detail.role.view")
                  }
                />
              </div>
            </div>

            <div className="funds-field funds-field--inline">
              <div>
                <label>{t("funds.form.current")}</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedFund.current.toLocaleString("vi-VN")} ${
                    selectedFund.currency || ""
                  }`}
                />
              </div>
              <div>
                <label>{t("funds.form.target")}</label>
                <input
                  type="text"
                  disabled
                  value={
                    selectedFund.target
                      ? `${selectedFund.target.toLocaleString("vi-VN")} ${
                          selectedFund.currency || ""
                        }`
                      : t("funds.detail.no_target")
                  }
                />
              </div>
            </div>

            <div className="funds-field mt-2">
              <label>{t("funds.form.members")}</label>

              {selectedFund.role !== "manage" ? (
                <div className="funds-hint">
                  {t("funds.participate.role_hint")}
                </div>
              ) : (
                <>
                  <div className="funds-hint">
                    {t("funds.participate.role_manage_hint")}
                  </div>

                  <div className="funds-members">
                    {members.map((m) => (
                      <div key={m.id} className="funds-member-row">
                        <input
                          type="text"
                          placeholder={t("funds.form.member_name_placeholder")}
                          value={m.name}
                          onChange={(e) =>
                            handleChangeMember(m.id, "name", e.target.value)
                          }
                        />
                        <input
                          type="email"
                          placeholder={t("funds.form.member_email_placeholder")}
                          value={m.email}
                          onChange={(e) =>
                            handleChangeMember(m.id, "email", e.target.value)
                          }
                        />
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleChangeMember(m.id, "role", e.target.value)
                          }
                        >
                          <option value="owner">{t("funds.detail.role.owner")}</option>
                          <option value="use">{t("funds.detail.role.use")}</option>
                          <option value="view">{t("funds.detail.role.view")}</option>
                        </select>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleRemoveMember(m.id)}
                        >
                          <i className="bi bi-x" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn-link"
                      onClick={handleAddMember}
                    >
                      <i className="bi bi-person-plus me-1" />
                      {t("funds.form.add_member")}
                    </button>
                  </div>

                  <div className="funds-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedFund(null)}
                    >
                      {t("funds.participate.close")}
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSaveMembers}
                    >
                      {t("funds.form.save")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
