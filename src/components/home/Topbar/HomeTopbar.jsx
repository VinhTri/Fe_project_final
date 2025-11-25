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
    // 1. Tạo một hàm riêng để load/reload user từ localStorage
    const loadUserFromStorage = () => {
      console.log("HomeTopbar: Hàm loadUserFromStorage() ĐƯỢC GỌI.");
      try {
        const raw = localStorage.getItem("user");
        if (!raw) return;
        
        const u = JSON.parse(raw) || {};
        const newFullName = u.fullName || u.username || u.email || "Người dùng";
        
        // 2. Đọc 'u.avatar' (đã bao gồm ảnh Google hoặc ảnh Base64)
        const newAvatar =
          u.avatar || // Đọc avatar đã thống nhất
          "https://www.gravatar.com/avatar/?d=mp&s=40"; // Ảnh dự phòng
        
        // Cập nhật state để trigger re-render
        setUserName(newFullName);
        setUserAvatar(newAvatar);
        
        console.log("HomeTopbar: Đã cập nhật avatar mới:", newAvatar?.substring(0, 50) + "...");
      } catch (error) {
        console.error("HomeTopbar: Lỗi khi load user từ localStorage:", error);
        // Giữ fallback mặc định nếu parse JSON lỗi
      }
    };

    // 3. Chạy hàm này lần đầu khi component mount
    loadUserFromStorage();

    // 4.Lắng nghe tín hiệu từ SettingsPage khi profile được cập nhật
    window.addEventListener('storageUpdated', loadUserFromStorage);

    // 5. Dọn dẹp: Xóa listener khi component unmount (rời khỏi trang)
    return () => {
      window.removeEventListener('storageUpdated', loadUserFromStorage);
    };
  }, []); // useEffect này chỉ chạy 1 lần duy nhất khi component mount

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
          {/*Chuông dùng đúng role theo tài khoản hiện tại */}
          <NotificationBell role={bellRole} />
          <div className="tb__divider" aria-hidden="true" />
          {/* Truyền avatarUrl đã được cập nhật vào UserMenu */}
          <UserMenu avatarUrl={userAvatar} />
        </div>
      </div>
    </header>
  );
}