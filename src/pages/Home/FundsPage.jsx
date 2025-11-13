// src/pages/Home/FundsPage.jsx
import React from "react";

export default function FundsPage() {
  return (
    <div className="page funds-page">
      <header className="page__header">
        <h1>Quỹ</h1>
        <p className="page__subtitle">
          Đây là khu vực quản lý các quỹ tài chính cá nhân (ví dụ: quỹ tiết kiệm, quỹ khẩn cấp...).
        </p>
      </header>

      <section className="page__content">
        <div className="card">
          <h2>Demo nội dung</h2>
          <p>
            Đây là trang <strong>Quỹ</strong>. Bạn có thể:
          </p>
          <ul>
            <li>Thêm quỹ mới (Quỹ tiết kiệm, Quỹ đầu tư, Quỹ khẩn cấp,...)</li>
            <li>Xem số dư từng quỹ</li>
            <li>Chuyển tiền giữa các quỹ và ví</li>
          </ul>
          <p style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
            Hiện tại đây mới là nội dung demo để test routing.
          </p>
        </div>
      </section>
    </div>
  );
}
