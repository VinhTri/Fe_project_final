// src/components/funds/FundDetailView.jsx
import React, { useEffect, useState } from "react";
import { useLanguage } from "../../home/store/LanguageContext";

const buildFormState = (fund) => ({
  name: fund.name || "",
  hasTerm: !!fund.hasTerm,
  current: fund.current ?? 0,
  target: fund.target ?? "",
  currency: fund.currency || "VND",
  description: fund.description || "",
});

export default function FundDetailView({ fund, onBack, onUpdateFund }) {
  const { t } = useLanguage();
  const isGroup = fund.type === "group";

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => buildFormState(fund));
  const [members, setMembers] = useState(() =>
    Array.isArray(fund.members) ? [...fund.members] : []
  );

  // Khi chọn quỹ khác thì reset form + tắt chế độ sửa
  useEffect(() => {
    setIsEditing(false);
    setForm(buildFormState(fund));
    setMembers(Array.isArray(fund.members) ? [...fund.members] : []);
  }, [fund]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ====== MEMBERS (chỉ cho quỹ nhóm) ======
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm(buildFormState(fund));
    setMembers(Array.isArray(fund.members) ? [...fund.members] : []);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const updated = {
      ...fund,
      name: form.name.trim(),
      hasTerm: !!form.hasTerm,
      current: Number(form.current) || 0,
      target:
        form.target === "" || form.target === null
          ? null
          : Number(form.target),
      currency: form.currency || "VND",
      description: form.description.trim(),
      members: isGroup ? members : fund.members,
    };

    onUpdateFund?.(updated);
    setIsEditing(false);
  };

  const progress =
    fund.target && fund.target > 0
      ? Math.min(100, Math.round((fund.current / fund.target) * 100))
      : null;

  return (
    <div className="fund-detail-layout">
      {/* CỘT TRÁI: THÔNG TIN QUỸ */}
      <div className="fund-detail-card">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h4 className="fund-detail-title mb-1">{fund.name}</h4>
            <div className="fund-detail-chip">
              {fund.type === "personal" ? t("funds.detail.personal_fund") : t("funds.detail.group_fund")}
              <span className="mx-1">•</span>
              {fund.hasTerm ? t("funds.detail.term") : t("funds.detail.no_term")}
            </div>
          </div>

          {onBack && (
            <button
              type="button"
              className="btn btn-link p-0 small"
              onClick={onBack}
            >
              ← {t("funds.btn.back")}
            </button>
          )}
        </div>

        <div className="mt-3">
          <div className="fund-detail-label">{t("funds.detail.current_balance")}</div>
          <div className="fund-detail-amount">
            {fund.current.toLocaleString("vi-VN")}{" "}
            <span className="fund-detail-currency">
              {fund.currency || "VND"}
            </span>
          </div>

          <div className="mt-2 fund-detail-label">{t("funds.detail.target")}</div>
          <div className="fund-detail-text">
            {fund.target
              ? `${fund.target.toLocaleString("vi-VN")} ${fund.currency || "VND"}`
              : t("funds.detail.no_target")}
          </div>

          {progress !== null && (
            <div className="mt-2">
              <div className="fund-card__progress">
                <div className="fund-card__progress-bar">
                  <span style={{ width: `${progress}%` }} />
                </div>
                <div className="fund-card__progress-text">
                  {progress}% {t("funds.detail.completed_target")}
                </div>
              </div>
            </div>
          )}

          {fund.description && (
            <>
              <div className="mt-3 fund-detail-label">{t("funds.detail.note")}</div>
              <div className="fund-detail-text">{fund.description}</div>
            </>
          )}

          {/* QUỸ NHÓM: HIỂN THỊ THÀNH VIÊN THAM GIA */}
          {isGroup && (
            <div className="mt-3">
              <div className="fund-detail-label mb-1">{t("funds.detail.members")}</div>
              {members.length === 0 ? (
                <div className="fund-detail-text">
                  {t("funds.detail.no_members")}
                </div>
              ) : (
                <ul className="fund-detail-members list-unstyled mb-0">
                  {members.map((m) => (
                    <li key={m.id}>
                      <strong>{m.name || "Chưa đặt tên"}</strong>{" "}
                      <span className="text-muted">
                        {m.email ? `(${m.email})` : ""}
                      </span>{" "}
                      •{" "}
                      <span className="text-muted">
                        {m.role === "owner"
                          ? t("funds.detail.role.owner")
                          : m.role === "use"
                          ? t("funds.detail.role.use")
                          : m.role === "manage"
                          ? t("funds.detail.role.manage")
                          : t("funds.detail.role.view")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-3">
            {!isEditing && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                <i className="bi bi-pencil-square me-1" />
                {t("funds.detail.btn.edit")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: FORM CHỈNH SỬA */}
      <div className="fund-detail-form">
        <h5 className="mb-2">{t("funds.detail.edit_title")}</h5>
        {!isEditing && (
          <p className="text-muted small mb-0" dangerouslySetInnerHTML={{ __html: t("funds.detail.edit_hint") }} />
        )}

        {isEditing && (
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="funds-field">
              <label>{t("funds.form.name")}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="funds-field funds-field--inline">
              <div>
                <label>{t("funds.form.type")}</label>
                <input
                  type="text"
                  disabled
                  value={isGroup ? t("funds.detail.group_fund") : t("funds.detail.personal_fund")}
                />
              </div>
              <div>
                <label>{t("funds.form.term")}</label>
                <select
                  value={form.hasTerm ? "yes" : "no"}
                  onChange={(e) =>
                    handleChange("hasTerm", e.target.value === "yes")
                  }
                >
                  <option value="yes">{t("funds.form.term.yes")}</option>
                  <option value="no">{t("funds.form.term.no")}</option>
                </select>
              </div>
            </div>

            <div className="funds-field funds-field--inline">
              <div>
                <label>{t("funds.form.current")}</label>
                <input
                  type="number"
                  min="0"
                  value={form.current}
                  onChange={(e) => handleChange("current", e.target.value)}
                />
              </div>
              <div>
                <label>{t("funds.form.target")}</label>
                <input
                  type="number"
                  min="0"
                  value={form.target}
                  onChange={(e) => handleChange("target", e.target.value)}
                />
              </div>
            </div>

            <div className="funds-field funds-field--inline">
              <div>
                <label>{t("funds.form.currency")}</label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                />
              </div>
              <div>
                <label>{t("funds.form.note")}</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder={t("funds.form.note_placeholder")}
                />
              </div>
            </div>

            {/* Nếu là quỹ nhóm thì cho phép sửa danh sách thành viên */}
            {isGroup && (
              <div className="funds-field mt-2">
                <label>{t("funds.form.members")}</label>
                <div className="funds-hint mb-1">
                  {t("funds.form.members_hint")}
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
                        <option value="manage">{t("funds.detail.role.manage")}</option>
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
              </div>
            )}

            <div className="funds-actions mt-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
              >
                {t("funds.form.cancel")}
              </button>
              <button type="submit" className="btn-primary">
                {t("funds.form.save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
