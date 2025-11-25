import "../../../styles/home/Topbar.css";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import GlobalSearch from "../../common/GlobalSearch";
import InvitationModal from "./InvitationModal";
import walletService from "../../../services/wallet.service";
import { useEffect, useState, useRef } from "react";
import useOnClickOutside from "../../../hooks/useOnClickOutside"; // Import hook

export default function HomeTopbar() {
  const [userName, setUserName] = useState("Người dùng");
  const [userAvatar, setUserAvatar] = useState(
    "https://www.gravatar.com/avatar/?d=mp&s=40"
  );
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);

  // Ref để phát hiện click ra ngoài
  const inviteRef = useRef(null);
  useOnClickOutside(inviteRef, () => setShowInviteModal(false));

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
      if (res && res.data && res.data.invitations) {
        setInviteCount(res.data.invitations.length);
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

        <div className="tb__actions" role="group">
          {/* === KHỐI NÚT LỜI MỜI === */}
          {/* Thêm class tb__dd và ref để xử lý dropdown */}
          <div className="tb__dd" ref={inviteRef}>
            <div
              className="tb__icon-btn"
              onClick={() => setShowInviteModal(!showInviteModal)} // Toggle thay vì set true
              title="Hộp thư lời mời"
            >
              <i className="fas fa-envelope" style={{ fontSize: "1.2rem" }}></i>
              {inviteCount > 0 && (
                <span className="tb__badge">{inviteCount}</span>
              )}
            </div>

            {/* Hiển thị Dropdown ngay bên dưới nút */}
            {showInviteModal && <InvitationModal />}
          </div>
          {/* ======================== */}

          <NotificationBell />
          <div className="tb__divider" aria-hidden="true" />
          <UserMenu avatarUrl={userAvatar} />
        </div>
      </div>
    </header>
  );
}
