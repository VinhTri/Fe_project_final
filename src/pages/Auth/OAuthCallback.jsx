import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileService } from "../../services/profileService";

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang xác thực...");

  useEffect(() => {
    (async () => {
      try {
        // ✅ Backend trả token qua URL: ?token=xxx
        const token = getQueryParam("token");
        const error = getQueryParam("error");

        if (error) {
          setMessage("Đăng nhập Google thất bại. Vui lòng thử lại.");
          setTimeout(() => navigate("/login", { replace: true }), 1500);
          return;
        }

        if (token) {
          // ✅ Lưu token
          localStorage.setItem("accessToken", token);

          // ✅ Lấy thông tin user từ backend
          try {
            const profileData = await profileService.getProfile();
            // profileService đã tự động lưu user vào localStorage
            console.log("✅ Google OAuth success:", profileData);
          } catch (err) {
            console.warn("⚠️ Couldn't fetch profile, but token is valid");
          }

          setMessage("Đăng nhập Google thành công! Đang chuyển hướng...");
          setTimeout(() => navigate("/home", { replace: true }), 800);
          return;
        }

        // ⚠️ Không có token trong URL
        setMessage("Không tìm thấy token. Vui lòng thử lại.");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      } catch (e) {
        console.error("❌ OAuth callback error:", e);
        setMessage("Có lỗi khi xác thực. Vui lòng thử lại.");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      }
    })();
  }, [navigate]);

  return (
    <div className="container py-5 text-center">
      <div className="spinner-border" role="status" />
      <p className="mt-3">{message}</p>
    </div>
  );
}
