import "../../../styles/home/Topbar.css";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import GlobalSearch from "../../common/GlobalSearch";
import InvitationModal from "./InvitationModal";
import walletService from "../../../services/wallet.service";
import { useEffect, useState } from "react";

export default function HomeTopbar() {
  const [userName, setUserName] = useState("Người dùng");
  const [userAvatar, setUserAvatar] = useState(
    "https://www.gravatar.com/avatar/?d=mp&s=40"
  );
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);

  // ... (Giữ nguyên phần useEffect loadUser và checkInvites) ...
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const raw = localStorage.getItem("user");
        if (!raw) return;
        const u = JSON.parse(raw) || {};
        setUserName(u.fullName || u.username || "Người dùng");
        setUserAvatar(u.avatar || "https://www.gravatar.com/avatar/?d=mp&s=40");
      } catch (error) {
        console.error("HomeTopbar: Lỗi load user", error);
      }
    };
    loadUserFromStorage();
    window.addEventListener("storageUpdated", loadUserFromStorage);
    return () =>
      window.removeEventListener("storageUpdated", loadUserFromStorage);
  }, []);

  const checkInvites = async () => {
    try {
      const res = await walletService.getInvitations();
      if (res && res.invitations) {
        setInviteCount(res.data?.invitations.length);
      }
    } catch (e) {
      console.warn("Không thể lấy số lượng lời mời:", e);
    }
  };

  useEffect(() => {
    checkInvites();
    const interval = setInterval(checkInvites, 60000);
    return () => clearInterval(interval);
  }, [showInviteModal]);

  return (
    <header className="tb__wrap" role="banner">
      <div className="tb__left">
        <div className="tb__welcome">Xin chào, {userName}!</div>
      </div>

      <div className="tb__right">
        <GlobalSearch />

        {/* Sử dụng flex gap trong CSS để căn đều */}
        <div className="tb__actions" role="group">
          {/* === NÚT LỜI MỜI (Đã sửa gọn gàng) === */}
          <div
            className="tb__icon-btn" // <--- Sử dụng class CSS chung
            onClick={() => setShowInviteModal(true)}
            title="Hộp thư lời mời"
          >
            <i className="fas fa-envelope" style={{ fontSize: "1.2rem" }}></i>

            {inviteCount > 0 && (
              <span className="tb__badge">{inviteCount}</span>
            )}
          </div>
          {/* ===================================== */}

          {/* NotificationBell cũng nên dùng class tương tự bên trong nó để đồng bộ */}
          <NotificationBell />

          <div className="tb__divider" aria-hidden="true" />

          <UserMenu avatarUrl={userAvatar} />
        </div>
      </div>

      <InvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </header>
  );
}
