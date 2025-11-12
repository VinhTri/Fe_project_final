import "../../../styles/home/Topbar.css";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import { useEffect, useState } from "react";

export default function HomeTopbar() {
  const [userName, setUserName] = useState("Người dùng");
  const [userAvatar, setUserAvatar] = useState("https://www.gravatar.com/avatar/?d=mp&s=40");
  const [q, setQ] = useState("");

  // ✅ LOAD USER FROM LOCALSTORAGE
  const loadUser = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const u = JSON.parse(raw) || {};
      setUserName(u.fullName || u.username || u.email || "Người dùng");
      const avatar =
        u.avatar ||
        u.picture ||
        u.avatarUrl ||
        "https://www.gravatar.com/avatar/?d=mp&s=40";
      setUserAvatar(avatar);
      
      console.log("🔄 Topbar user updated:", { fullName: u.fullName, avatar });
    } catch (error) {
      console.error("❌ Error loading user from localStorage:", error);
      // giữ fallback mặc định
    }
  };

  // ✅ LOAD ON MOUNT
  useEffect(() => {
    loadUser();
  }, []);

  // ✅ LISTEN TO LOCALSTORAGE CHANGES (from ProfilePage)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Listen to custom event dispatched after profile update
      if (e.key === "user" || e.type === "userProfileUpdated") {
        console.log("🔔 Storage change detected, reloading user...");
        loadUser();
      }
    };

    // Listen to storage event (cross-tab)
    window.addEventListener("storage", handleStorageChange);
    
    // Listen to custom event (same tab)
    window.addEventListener("userProfileUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userProfileUpdated", handleStorageChange);
    };
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    // TODO: gọi navigate hoặc dispatch sự kiện tìm kiếm ở đây
    // console.log("search:", query);
  };

  return (
    <header className="tb__wrap" role="banner">
      {/* Trái: chào người dùng */}
      <div className="tb__left">
        <div className="tb__welcome">Xin chào, {userName}!</div>
      </div>

      {/* Phải: search kề sát actions */}
      <div className="tb__right">
        <form className="tb__search tb__search--pill" onSubmit={onSearch} role="search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm..."
            aria-label="Tìm kiếm"
          />
          <button className="tb__search-btn" aria-label="Thực hiện tìm kiếm" type="submit">
            <i className="bi bi-search" aria-hidden="true"></i>
          </button>
        </form>

        <div className="tb__actions" role="group" aria-label="Tác vụ topbar">
          <div className="tb__divider" aria-hidden="true" />
          <NotificationBell />
          <div className="tb__divider" aria-hidden="true" />
          <UserMenu avatarUrl={userAvatar} />
        </div>
      </div>
    </header>
  );
}