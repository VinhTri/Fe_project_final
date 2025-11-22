// src/pages/Auth/LoginPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import LoginSuccessModal from "../../components/common/Modal/LoginSuccessModal";
import AccountExistsModal from "../../components/common/Modal/AccountExistsModal";
import "../../styles/AuthForms.css";

// API
import { login, loginWithGoogle } from "../../services/authApi";
import { getMyProfile } from "../../services/userApi";

// AUTH CONTEXT
import { useAuth } from "../../home/store/AuthContext";

// 🔥 CLIENT_ID phải TRÙNG với BE (mywallet.google.client-id)
const GOOGLE_CLIENT_ID =
  "418846497154-r9s0e5pgls2ucrnulgjeuk3v3uja1a6u.apps.googleusercontent.com";

export default function LoginPage() {
  const { login: authLogin } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [redirectPath, setRedirectPath] = useState("/home");

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  // Lấy token từ API response
  function extractToken(data) {
    return (
      data?.token ||
      data?.accessToken ||
      (typeof data === "string" ? data : null)
    );
  }

  // Sau khi có token (dùng chung login thường & Google)
  async function handleLoginSuccess(token) {
    if (!token) {
      setShowInvalid(true);
      return;
    }

    localStorage.setItem("accessToken", token);

    let targetPath = "/home";

    try {
      const meRes = await getMyProfile();
      const me = meRes.data;

      localStorage.setItem("user", JSON.stringify(me));

      const rawRoles = [];
      if (me.role) rawRoles.push(me.role);
      if (me.roleName) rawRoles.push(me.roleName);
      if (Array.isArray(me.roles)) rawRoles.push(...me.roles);
      if (Array.isArray(me.authorities)) {
        rawRoles.push(
          ...me.authorities.map((a) =>
            typeof a === "string" ? a : a.authority
          )
        );
      }

      const primaryRole =
        me.role ||
        me.roleName ||
        (Array.isArray(me.roles) && me.roles.length > 0
          ? me.roles[0]
          : "USER");

      const isAdmin = rawRoles.some(
        (r) => typeof r === "string" && r.toUpperCase().includes("ADMIN")
      );

      targetPath = isAdmin ? "/admin/users" : "/home";

      // update AuthContext
      authLogin({
        id: me.id,
        fullName: me.fullName || me.name || me.username || "",
        email: me.email,
        role: primaryRole,
        accessToken: token,
      });

      setRedirectPath(targetPath);
    } catch (err) {
      console.error("Lỗi gọi /users/me:", err);
      setRedirectPath("/home");

      authLogin({
        id: null,
        fullName: "",
        email: form.email,
        role: "USER",
        accessToken: token,
      });
    }

    setShowSuccess(true);
  }

  // GOOGLE callback
  async function handleGoogleLogin(response) {
    try {
      setLoading(true);
      setError("");

      const idToken = response.credential;
      if (!idToken) {
        return setError("Không lấy được idToken từ Google.");
      }

      const res = await loginWithGoogle({ idToken });
      const token = extractToken(res.data);

      await handleLoginSuccess(token);
    } catch (err) {
      console.error("Login Google lỗi:", err);
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.msg;

      // TH: user chưa tồn tại
      if (status === 404 || (msg && msg.includes("không tồn tại"))) {
        return setError(
          "Tài khoản chưa được tạo. Vui lòng tạo tài khoản hoặc đăng nhập bằng Google để sử dụng hệ thống."
        );
      }

      if (status === 400 || status === 401) {
        return setShowInvalid(true);
      }

      setError(msg || "Lỗi đăng nhập Google. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  // Load Google Identity Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
        });

        const btn = document.getElementById("googleSignInDiv");
        if (btn) {
          window.google.accounts.id.renderButton(btn, {
            theme: "outline",
            size: "large",
            width: "100%",
          });
        }
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Submit login thường
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return setError("Vui lòng nhập đầy đủ email và mật khẩu!");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return setError("Email không hợp lệ!");
    }

    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>/?~]).{8,}$/;
    if (!strongRegex.test(form.password)) {
      return setError(
        "Mật khẩu phải có ít nhất 8 ký tự, gồm hoa – thường – số – ký tự đặc biệt."
      );
    }

    try {
      setLoading(true);
      setError("");

      const res = await login(form);
      const token = extractToken(res.data);

      await handleLoginSuccess(token);
    } catch (err) {
      console.error("Lỗi login:", err);

      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.msg;

      // ⭐ NEW: tài khoản Google đã tồn tại nhưng chưa đặt mật khẩu lần đầu
      // BE đang trả message kiểu: "Tài khoản Google – hãy đăng nhập Google"
      if (msg && msg.includes("Tài khoản Google")) {
        return setError(
          "Tài khoản đã tồn tại dưới dạng Google nhưng chưa đặt mật khẩu mới. Vui lòng đăng nhập bằng Google để đặt mật khẩu."
        );
      }

      // NEW: user chưa tồn tại
      if (status === 404 || (msg && msg.includes("không tồn tại"))) {
        return setError(
          "Tài khoản chưa được tạo. Vui lòng đăng ký hoặc đăng nhập bằng Google."
        );
      }

      // Sai email hoặc mật khẩu
      if (status === 400 || status === 401) {
        return setShowInvalid(true);
      }

      setError(msg || "Không kết nối được máy chủ (cổng 8080).");
    } finally {
      setLoading(false);
    }
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
            name="email"
            className="form-control"
            placeholder="Nhập email"
            value={form.email}
            onChange={onChange}
            required
          />
        </div>

       <div className="mb-2 input-group">
  <span className="input-group-text">
    <i className="bi bi-lock-fill"></i>
  </span>
  <input
    type={showPassword ? "text" : "password"}
    name="password"
    className="form-control"
    placeholder="Nhập mật khẩu"
    value={form.password}
    onChange={onChange}
    required
  />
  <button
    type="button"
    className="btn btn-outline-secondary"
    onClick={() => setShowPassword((v) => !v)}
  >
    <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
  </button>
</div>


        {error && <div className="auth-error">{error}</div>}

        <div className="d-grid mt-3 mb-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </div>

        <div className="text-center">
          <Link to="/forgot-password" className="me-3">
            Quên mật khẩu?
          </Link>
          <Link to="/register">Chưa có tài khoản?</Link>
        </div>

        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2 text-muted">Hoặc đăng nhập bằng</span>
          <hr className="flex-grow-1" />
        </div>

        <div className="d-grid">
          <div id="googleSignInDiv" />
        </div>
      </form>

      <LoginSuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        seconds={3}
        title="Đăng nhập"
        message="Đăng nhập thành công!"
        redirectUrl={redirectPath}
      />

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
