import { useState } from "react";
import { profileService } from "../../../services/profileService";
import "../../../styles/home/Profile.css";

export default function ProfileInfoCard({ user, onUpdate }) {
  const u = user || {
    name: "Trần Vinh Trí",
    email: "admin@example.com",
    phone: "09xx xxx xxx",
    role: "Người dùng",
    joined: "10/2024",
  };

  const [name, setName] = useState(u.name);
  const [nameOk, setNameOk] = useState("");

  // --- đổi mật khẩu ---
  const [pw, setPw] = useState({ old: "", next: "", confirm: "" });
  const [show, setShow] = useState({ old: false, next: false, confirm: false });
  const [hint, setHint] = useState({ old: "", next: "", confirm: "" });
  const [okMsg, setOkMsg] = useState({ old: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const PASS_RULE =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|:;"'<>,.?/~`]).{8,}$/;

  const eye = (k) => (
    <button
      type="button"
      className="input-eye"
      onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))}
      aria-label={show[k] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      title={show[k] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      <i className={`bi ${show[k] ? "bi-eye-slash" : "bi-eye"}`} />
    </button>
  );

  const onChangePw = (e) => {
    const { name, value } = e.target;
    setPw((s) => ({ ...s, [name]: value }));
    setHint((s) => ({ ...s, [name]: "" }));
    setOkMsg((s) => ({ ...s, [name]: "" }));
  };

  const validateStep1 = () => {
    let valid = true;
    const nh = { old: "", next: "", confirm: "" };
    const ok = { old: "", next: "", confirm: "" };

    // Mật khẩu hiện tại
    if (!pw.old) {
      nh.old = "Vui lòng nhập mật khẩu hiện tại.";
      valid = false;
    } else if (!PASS_RULE.test(pw.old)) {
      nh.old = "Mật khẩu hiện tại chưa đạt yêu cầu (HOA, thường, số, ký tự đặc biệt, ≥8).";
      valid = false;
    } else {
      ok.old = "✔ Mật khẩu hiện tại hợp lệ.";
    }

    // Mật khẩu mới
    if (!pw.next) {
      nh.next = "Vui lòng nhập mật khẩu mới.";
      valid = false;
    } else if (!PASS_RULE.test(pw.next)) {
      nh.next = "Mật khẩu mới ≥8 ký tự, gồm HOA, thường, số và ký tự đặc biệt.";
      valid = false;
    } else if (pw.next === pw.old) {
      nh.next = "Mật khẩu mới không được trùng với mật khẩu hiện tại.";
      valid = false;
    } else {
      ok.next = "✔ Mật khẩu mới hợp lệ.";
    }

    // Nhập lại
    if (!pw.confirm) {
      nh.confirm = "Vui lòng nhập lại mật khẩu mới.";
      valid = false;
    } else if (pw.confirm !== pw.next) {
      nh.confirm = "Mật khẩu nhập lại chưa khớp.";
      valid = false;
    } else {
      ok.confirm = "✔ Khớp và hợp lệ.";
    }

    setHint(nh);
    setOkMsg(ok);
    return valid;
  };

  /* =========================
   * ✅ SIMPLE PASSWORD CHANGE (No OTP)
   * API: POST /profile/change-password (Bearer)
   * body: { oldPassword?, newPassword, confirmPassword }
   * ========================= */
  const submitStep1 = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setLoading(true);

    try {
      // ✅ CALL profileService
      await profileService.changePassword({
        oldPassword: pw.old,
        newPassword: pw.next,
        confirmPassword: pw.confirm,
      });

      // Success
      setOkMsg({ 
        old: "", 
        next: "", 
        confirm: "Đổi mật khẩu thành công!" 
      });
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setPw({ old: "", next: "", confirm: "" });
        setHint({ old: "", next: "", confirm: "" });
        setOkMsg({ old: "", next: "", confirm: "" });
      }, 2000);
      
      // Callback to parent to reload profile
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("❌ Error changing password:", error);
      const errorMsg = error.response?.data?.error || "Không thể đổi mật khẩu";
      setHint((h) => ({ ...h, old: errorMsg }));
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    if (!name.trim()) {
      setNameOk("Tên không được để trống.");
      return;
    }
    
    try {
      // ✅ CALL API UPDATE PROFILE
      await profileService.updateProfile({
        fullName: name.trim(),
      });
      
      setNameOk("Đã lưu tên hiển thị.");
      setTimeout(() => setNameOk(""), 3000);
      
      // Callback to parent to reload profile
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("❌ Error updating name:", error);
      setNameOk("Không thể cập nhật tên: " + (error.response?.data?.error || error.message));
      setTimeout(() => setNameOk(""), 3000);
    }
  };

  return (
    <div className="profile__info-card">
      <h5 className="mb-3">Thông tin tài khoản</h5>

      <div className="info-grid">
        <div className="info-item span2">
          <span>Họ tên:</span>
          <div className="name-edit">
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ tên"
            />
            <button type="button" className="btn btn-outline-primary" onClick={saveName}>
              Lưu
            </button>
          </div>
          {!!nameOk && (
            <div className={`form-hint ${nameOk.includes("không") ? "error" : "success"}`}>
              {nameOk}
            </div>
          )}
        </div>

        <div><span>Email:</span><strong>{u.email}</strong></div>
        <div><span>Số điện thoại:</span><strong>{u.phone}</strong></div>
        <div><span>Vai trò:</span><strong>{u.role}</strong></div>
        <div><span>Tham gia từ:</span><strong>{u.joined}</strong></div>
      </div>

      <hr className="my-3" />

      <form onSubmit={submitStep1}>
        <h6 className="mb-2">Thay đổi mật khẩu</h6>

        <label className="form-label">Mật khẩu hiện tại</label>
        <div className="pw-input">
          <input
            type={show.old ? "text" : "password"}
            name="old"
            value={pw.old}
            onChange={onChangePw}
            placeholder="Nhập mật khẩu hiện tại"
            disabled={loading}
          />
          {eye("old")}
        </div>
        {hint.old && <div className="form-hint error">{hint.old}</div>}
        {okMsg.old && <div className="form-hint success">{okMsg.old}</div>}

        <label className="form-label mt-2">Mật khẩu mới</label>
        <div className="pw-input">
          <input
            type={show.next ? "text" : "password"}
            name="next"
            value={pw.next}
            onChange={onChangePw}
            placeholder="Nhập mật khẩu mới"
            disabled={loading}
          />
          {eye("next")}
        </div>
        {hint.next && <div className="form-hint error">{hint.next}</div>}
        {okMsg.next && <div className="form-hint success">{okMsg.next}</div>}

        <label className="form-label mt-2">Nhập lại mật khẩu mới</label>
        <div className="pw-input">
          <input
            type={show.confirm ? "text" : "password"}
            name="confirm"
            value={pw.confirm}
            onChange={onChangePw}
            placeholder="Nhập lại mật khẩu mới"
            disabled={loading}
          />
          {eye("confirm")}
        </div>
        {hint.confirm && <div className="form-hint error">{hint.confirm}</div>}
        {okMsg.confirm && <div className="form-hint success">{okMsg.confirm}</div>}

        <button type="submit" className="btn btn-primary mt-3 w-100" disabled={loading}>
          {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
        </button>
      </form>
    </div>
  );
}
