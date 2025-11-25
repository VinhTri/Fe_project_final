import "../../../styles/home/Topbar.css";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import GlobalSearch from "../../common/GlobalSearch";
import InvitationModal from "../../wallets/InvitationModal"; // Import Modal Lời mời
import walletService from "../../../services/wallet.service"; // Import Service
import { useEffect, useState } from "react";

export default function HomeTopbar() {
  // === EXISTING STATE ===
  const [userName, setUserName] = useState("Người dùng");
  const [userAvatar, setUserAvatar] = useState(
    "https://www.gravatar.com/avatar/?d=mp&s=40"
  );

  // === NEW STATE FOR INVITATIONS ===
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);

  // 1. Logic load User Profile (Giữ nguyên code cũ của bạn)
  useEffect(() => {
    const loadUserFromStorage = () => {
      // console.log("HomeTopbar: Hàm loadUserFromStorage() ĐƯỢC GỌI.");
      try {
        const raw = localStorage.getItem("user");
        if (!raw) return;

        const u = JSON.parse(raw) || {};
        const newFullName = u.fullName || u.username || u.email || "Người dùng";

        const newAvatar =
          u.avatar || "https://www.gravatar.com/avatar/?d=mp&s=40";

        setUserName(newFullName);
        setUserAvatar(newAvatar);
      } catch (error) {
        console.error("HomeTopbar: Lỗi khi load user từ localStorage:", error);
      }
    };

    loadUserFromStorage();
    window.addEventListener("storageUpdated", loadUserFromStorage);
    return () => {
      window.removeEventListener("storageUpdated", loadUserFromStorage);
    };
  }, []);

  // 2. Logic Kiểm tra lời mời (New Feature)
  const checkInvites = async () => {
    try {
      const res = await walletService.getInvitations();
      if (res.invitations) {
        setInviteCount(res.invitations.length);
      }
    } catch (e) {
      // Silent error: Không làm phiền user nếu chỉ lỗi lấy badge
      console.warn("Failed to fetch invitation count", e);
    }
  };

  // Gọi checkInvites khi mount và mỗi khi đóng modal (để update lại số lượng nếu đã accept/decline)
  useEffect(() => {
    checkInvites();
  }, [showInviteModal]);

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
          {/* === BUTTON LỜI MỜI (NEW) === */}
          <div
            className="tb__icon-btn"
            onClick={() => setShowInviteModal(true)}
            title="Lời mời tham gia ví"
            style={{
              cursor: "pointer",
              position: "relative",
              marginRight: "15px",
              fontSize: "1.2rem",
              color: "#555",
            }}
          >
            <i className="fa-solid fa-envelope"></i>

            {/* Badge đỏ đếm số lượng */}
            {inviteCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  border: "2px solid white",
                }}
              >
                {inviteCount}
              </span>
            )}
          </div>
          {/* ============================ */}

          <div className="tb__divider" aria-hidden="true" />

          <NotificationBell />

          <div className="tb__divider" aria-hidden="true" />

          <UserMenu avatarUrl={userAvatar} />
        </div>
      </div>

      {/* === MODAL LỜI MỜI === */}
      <InvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </header>
  );
}
