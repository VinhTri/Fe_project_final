// src/pages/Auth/OAuthCallback.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ✅ DÙNG API MỚI: userApi
import { getMyProfile } from "../../services/userApi";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("Đang xác thực...");

  useEffect(() => {
    const processLogin = async () => {
      try {
        // 1. Lấy token (và error nếu có) từ URL
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        const error = params.get("error");

        if (error) {
          throw new Error("Đăng nhập Google thất bại. Vui lòng thử lại.");
        }

        if (!token) {
          throw new Error("Không tìm thấy token xác thực.");
        }

        // 2. Lưu token vào localStorage
        localStorage.setItem("accessToken", token);

        // 3. Gọi API lấy profile mới: /api/users/me qua getMyProfile()
        const res = await getMyProfile();
        const user = res.data;

        if (!user) {
          // Không lấy được user → xoá token
          localStorage.removeItem("accessToken");
          throw new Error("Không thể lấy thông tin tài khoản.");
        }

        // 4. Lưu user vào localStorage cho topbar/sidebar đọc
        localStorage.setItem("user", JSON.stringify(user));

        // 5. Bắn event cho các component khác (nếu bạn có lắng nghe)
        window.dispatchEvent(new CustomEvent("storageUpdated"));

        // 6. Chuyển hướng
        setMessage("Đăng nhập Google thành công! Đang chuyển hướng...");
        setTimeout(() => navigate("/home", { replace: true }), 800);
      } catch (e) {
        console.error(e);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setMessage(e.message || "Có lỗi khi xác thực. Vui lòng thử lại.");
        setTimeout(() => navigate("/login", { replace: true }), 1500);
      }
    };

    processLogin();
  }, [navigate, location]);

  return (
    <div className="container py-5 text-center">
      <div className="spinner-border" role="status" />
      <p className="mt-3">{message}</p>
    </div>
  );
}
