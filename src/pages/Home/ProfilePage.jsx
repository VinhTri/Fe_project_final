import { useState, useEffect } from "react";
import { profileService } from "../../services/profileService";
import Loading from "../../components/common/Loading";
import ProfileCard from "../../components/home/Profile/ProfileCard";
import ProfileInfoCard from "../../components/home/Profile/ProfileInfoCard";

export default function ProfilePage() {
  // ✅ REPLACE MOCK DATA WITH API STATE
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // ✅ LOAD PROFILE FROM API
  const loadProfile = async () => {
    try {
      setLoading(true);
      setApiError("");
      
      const response = await profileService.getProfile();
      
      // Transform backend data to match frontend format
      setUser({
        name: response.user.fullName || response.user.email,
        email: response.user.email,
        phone: response.user.phone || "Chưa cập nhật",
        role: response.user.provider === "google" ? "Người dùng (Google)" : "Người dùng",
        joined: response.user.createdAt ? new Date(response.user.createdAt).toLocaleDateString("vi-VN") : "N/A",
        avatar: response.user.avatar || "https://www.gravatar.com/avatar/?d=mp&s=150",
        userId: response.user.userId,
        provider: response.user.provider,
        enabled: response.user.enabled,
      });
    } catch (error) {
      console.error("❌ Error loading profile:", error);
      setApiError(error.response?.data?.error || "Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Loading />
      </div>
    );
  }

  // Show error if API failed
  if (apiError) {
    return (
      <div style={{ padding: 24 }}>
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {apiError}
          <button 
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={loadProfile}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // ✅ Đảm bảo user đã load xong
  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <Loading />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 className="mb-3">Hồ sơ cá nhân</h2>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        <ProfileCard user={user} onUpdate={loadProfile} />
        <ProfileInfoCard user={user} onUpdate={loadProfile} />
      </div>
    </div>
  );
}
