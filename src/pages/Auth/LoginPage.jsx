import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import LoginSuccessModal from "../../components/common/Modal/LoginSuccessModal";
import AccountExistsModal from "../../components/common/Modal/AccountExistsModal";
import { authService } from "../../services/authService";
import "../../styles/AuthForms.css";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return setError("Vui lòng nhập đầy đủ email và mật khẩu!");
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return setError("Email không hợp lệ! Vui lòng nhập đúng định dạng.");
    }

    if (form.password.length < 8) {
      return setError("Mật khẩu phải có ít nhất 8 ký tự!");
    }

    try {
      setLoading(true);
      
      // ✅ GỌI API BACKEND THẬT
      const response = await authService.login({
        email: form.email,
        password: form.password
      });

      // authService đã tự động lưu tokens và user vào localStorage
      console.log("✅ Đăng nhập thành công:", response);
      setShowSuccess(true);
      
    } catch (err) {
      console.error("❌ Login error:", err);
      
      // Xử lý các lỗi từ backend
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.message || 
                      "Đăng nhập thất bại. Vui lòng thử lại.";
      
      // Nếu là lỗi sai email/password, hiển thị modal
      if (err.response?.status === 400 || err.response?.status === 401) {
        setShowInvalid(true);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect đến Google OAuth endpoint của backend
    window.location.href = "http://localhost:8080/auth/oauth2/authorization/google";
  };

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={onSubmit}>
        <h3 className="text-center mb-4">Đăng nhập</h3>

        <div className="mb-3 input-group">
          <span className="input-group-text">
            <i className="bi bi-envelope-fill"></i>
          </span>
          <input
            type="email"
            className="form-control"
            name="email"
            placeholder="Nhập email"
            onChange={onChange}
            value={form.email}
            required
          />
        </div>

        <div className="mb-2 input-group">
          <span className="input-group-text">
            <i className="bi bi-lock-fill"></i>
          </span>
          <input
            type={showPassword ? "text" : "password"}
            className="form-control"
            name="password"
            placeholder="Nhập mật khẩu"
            onChange={onChange}
            value={form.password}
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

        {error && <div className="auth-error">{error}</div>}

        <div className="d-grid mb-3 mt-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </div>

        <div className="text-center">
          <Link to="/forgot-password" className="text-decoration-none link-hover me-3">
            Quên mật khẩu?
          </Link>
          <Link to="/register" className="text-decoration-none link-hover">
            Đăng ký tài khoản
          </Link>
        </div>

        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2 text-muted">Hoặc đăng nhập bằng</span>
          <hr className="flex-grow-1" />
        </div>

        <div className="d-grid gap-2">
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleGoogleLogin}
          >
            <i className="bi bi-google me-2"></i> Google
          </button>
        </div>
      </form>

      <LoginSuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        seconds={3}
        title="Đăng nhập"
        message="Đăng nhập thành công!"
        redirectUrl="/home"
      />

      <AccountExistsModal
        open={showInvalid}
        onClose={() => setShowInvalid(false)}
        seconds={3}
        title="Đăng nhập thất bại"
        message="Email hoặc mật khẩu không chính xác!"
      />
    </AuthLayout>
  );
}
