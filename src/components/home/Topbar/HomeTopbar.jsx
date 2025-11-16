import "../../../styles/home/Topbar.css";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import GlobalSearch from "../../common/GlobalSearch";
import { useEffect, useState } from "react";
import { useAuth, ROLES } from "../../../home/store/AuthContext";

export default function HomeTopbar() {
  const [userName, setUserName] = useState("Người dùng");
  const [userAvatar, setUserAvatar] = useState(
    "https://www.gravatar.com/avatar/?d=mp&s=40"
  );

  const { currentUser } = useAuth();

  // Xác định role cho chuông: admin / user
  const bellRole =
    currentUser?.role === ROLES.ADMIN ? "admin" : "user";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const u = JSON.parse(raw) || {};
      setUserName(u.fullName || u.username || u.email || "Người dùng");
      const avatar =
        u.picture ||
        u.avatarUrl ||
        "https://www.gravatar.com/avatar/?d=mp&s=40";
      setUserAvatar(avatar);
    } catch {
      // giữ fallback mặc định
    }
  }, []);

  return (
    <header className="tb__wrap" role="banner">
      {/* Trái: chào người dùng */}
      <div className="tb__left">
        <div className="tb__welcome">Xin chào, {userName}!</div>
      </div>

      {/* Phải: Global Search + actions */}
      <div className="tb__right">
        <GlobalSearch />

        <div className="tb__actions" role="group" aria-label="Tác vụ topbar">
          <div className="tb__divider" aria-hidden="true" />
          {/* 👇 Chuông dùng đúng role theo tài khoản hiện tại */}
          <NotificationBell role={bellRole} />
          <div className="tb__divider" aria-hidden="true" />
          <UserMenu avatarUrl={userAvatar} />
        </div>
      </div>
    </header>
  );
}
