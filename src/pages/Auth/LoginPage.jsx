// src/pages/Auth/LoginPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import LoginSuccessModal from "../../components/common/Modal/LoginSuccessModal";
import AccountExistsModal from "../../components/common/Modal/AccountExistsModal"; // tái dùng làm modal lỗi đăng nhập
import "../../styles/AuthForms.css";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁 hiện/ẩn mật khẩu
  const [error, setError] = useState("");

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validate email
    if (!form.email || !form.password) {
      return setError("Vui lòng nhập đầy đủ email và mật khẩu!");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return setError("Email không hợp lệ! Vui lòng nhập đúng định dạng.");
    }

    // ✅ Validate password (giống đăng ký): ≥6 ký tự + chữ cái + số + ký tự đặc biệt
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/\-]).{6,}$/;
    if (form.password.length < 6) {
      return setError("Mật khẩu phải có ít nhất 6 ký tự!");
    }
    if (!passwordRegex.test(form.password)) {
      return setError("Mật khẩu phải có chữ cái, số và ký tự đặc biệt!");
    }

    try {
      setLoading(true);

      // TODO: gọi API đăng nhập thật bằng email + password
      // const res = await authService.loginByEmail(form.email, form.password);
      // if (res.status === 200) setShowSuccess(true);
      // else if (res.status === 401) setShowInvalid(true);

      // DEMO: email cố định & password cố định
      setTimeout(() => {
        const ok = form.email === "admin@example.com" && form.password === "Abc@123";
        if (ok) {
          localStorage.setItem("accessToken", "mock.token");
          setShowSuccess(true);
        } else {
          setShowInvalid(true); // sai thông tin đăng nhập
        }
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={onSubmit}>
        <h3 className="text-center mb-4">Đăng nhập</h3>

        {/* Email */}
        <div className="mb-3 input-group">
          <span className="input-group-text"><i className="bi bi-envelope-fill"></i></span>
          <input
            type="email"
            className="form-control"
            name="email"
            placeholder="Nhập email"
            onChange={onChange}
            required
          />
        </div>

        {/* Password có mắt 👁 bên trong */}
        <div className="mb-2 input-group">
          <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
          <input
            type={showPassword ? "text" : "password"}
            className="form-control"
            name="password"
            placeholder="Nhập mật khẩu"
            onChange={onChange}
            required
          />
          <span
            className="input-group-text eye-toggle"
            role="button"
            onClick={() => setShowPassword((v) => !v)}
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
          </span>
        </div>

        {/* Lỗi validate chung */}
        {error && <div className="auth-error">{error}</div>}

        {/* Nút login */}
        <div className="d-grid mb-3 mt-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </div>

        {/* Liên kết */}
        <div className="text-center">
          <Link to="/forgot-password" className="text-decoration-none link-hover me-3">
            Quên mật khẩu?
          </Link>
          <Link to="/register" className="text-decoration-none link-hover">
            Chưa có tài khoản?
          </Link>
        </div>

        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2 text-muted">Hoặc đăng nhập bằng</span>
          <hr className="flex-grow-1" />
        </div>

        {/* Nút đăng nhập mạng xã hội */}
        <div className="d-grid gap-2">
          <button type="button" className="btn btn-outline-danger">
            <i className="bi bi-google me-2"></i> Google
          </button>
        </div>
      </form>

      {/* Modal: Đăng nhập thành công */}
      <LoginSuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        seconds={3}
        title="Đăng nhập"
        message="Đăng nhập thành công!"
        redirectUrl="/home"
      />

      {/* Modal: Sai tài khoản hoặc mật khẩu */}
      <AccountExistsModal
        open={showInvalid}
        onClose={() => setShowInvalid(false)}
        seconds={3}
        title="Đăng nhập"
        message="Sai email hoặc mật khẩu!"
      />
    </AuthLayout>
  );
}
