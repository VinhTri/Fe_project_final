import React, { useEffect, useState } from "react";
import Modal from "../common/Modal/Modal"; // Import Modal có sẵn của bạn
import walletService from "../../services/wallet.service";
import { useToast } from "../common/Toast/ToastContext";
import { useWalletData } from "../../home/store/WalletDataContext";
import "../../styles/home/InvitationModal.css";

export default function InvitationModal({ isOpen, onClose }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);

  const { addToast } = useToast();
  const { fetchWallets } = useWalletData(); // Lấy hàm refresh ví từ Context

  // Hàm load dữ liệu
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await walletService.getInvitations();
      setInvitations(res.invitations || []);
    } catch (error) {
      console.error("Lỗi tải lời mời:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load lại mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      fetchInvitations();
    }
  }, [isOpen]);

  // Xử lý nút Đồng ý / Từ chối
  const handleRespond = async (walletId, isAccepted) => {
    try {
      const res = await walletService.respondToInvitation(walletId, isAccepted);

      addToast(res.message, "success");

      // Nếu đồng ý, cần refresh danh sách ví ở màn hình chính
      if (isAccepted) {
        fetchWallets();
      }

      // Load lại danh sách lời mời (để loại bỏ cái vừa xử lý)
      fetchInvitations();
    } catch (error) {
      const msg = error.response?.data?.error || "Có lỗi xảy ra";
      addToast(msg, "error");
    }
  };

  return (
    <Modal title="Lời mời tham gia ví" isOpen={isOpen} onClose={onClose}>
      <div className="invitation-container">
        {loading && <div className="invitation-loading">Đang tải...</div>}

        {!loading && invitations.length === 0 && (
          <div className="invitation-empty">Bạn không có lời mời nào.</div>
        )}

        {!loading && invitations.length > 0 && (
          <ul className="invitation-list">
            {invitations.map((inv) => (
              <li key={inv.walletId} className="invitation-item">
                <div className="inv-info">
                  <div className="inv-text">
                    <strong>{inv.ownerName}</strong> mời bạn tham gia ví{" "}
                    <span className="inv-wallet-name">{inv.walletName}</span>
                  </div>
                  <div className="inv-meta">
                    Vai trò: {inv.myRole} •{" "}
                    {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className="inv-actions">
                  <button
                    className="btn-inv btn-accept"
                    onClick={() => handleRespond(inv.walletId, true)}
                  >
                    Đồng ý
                  </button>
                  <button
                    className="btn-inv btn-decline"
                    onClick={() => handleRespond(inv.walletId, false)}
                  >
                    Từ chối
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
