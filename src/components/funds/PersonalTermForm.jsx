// src/components/funds/PersonalTermForm.jsx
import React from "react";

export default function PersonalTermForm({ form, onChange }) {
  return (
    <div className="fund-form">
      <h3>Quỹ cá nhân có kỳ hạn</h3>
      <div className="fund-form__grid">
        <div className="fund-form__field">
          <label>Tên quỹ</label>
          <input
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="fund-form__field">
          <label>Số dư hiện tại</label>
          <input
            type="number"
            value={form.current}
            onChange={(e) =>
              onChange({ current: Number(e.target.value) || 0 })
            }
          />
        </div>
        <div className="fund-form__field">
          <label>Mục tiêu</label>
          <input
            type="number"
            value={form.target}
            onChange={(e) =>
              onChange({ target: Number(e.target.value) || 0 })
            }
          />
        </div>
        <div className="fund-form__field">
          <label>Đơn vị tiền tệ</label>
          <input
            value={form.currency}
            onChange={(e) => onChange({ currency: e.target.value })}
          />
        </div>
        <div className="fund-form__field">
          <label>Ngày bắt đầu</label>
          <input
            type="date"
            value={form.startDate || ""}
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
        </div>
        <div className="fund-form__field">
          <label>Ngày kết thúc</label>
          <input
            type="date"
            value={form.endDate || ""}
            onChange={(e) => onChange({ endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="fund-form__field">
        <label>Mô tả</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
    </div>
  );
}
