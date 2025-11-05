import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage"; // ✅ thêm mới

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 👉 Khi vào "/" sẽ tự redirect sang "/login" */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Trang đăng nhập */}
        <Route path="/login" element={<LoginPage />} />

        {/* Trang đăng ký */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Trang quên mật khẩu */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* ✅ thêm mới */}

        {/* Trang chủ (demo sau đăng nhập) */}
        <Route
          path="/home"
          element={<div style={{ padding: 40 }}>🏠 Trang chủ (demo)</div>}
        />

        {/* Nếu nhập sai URL → chuyển về /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
