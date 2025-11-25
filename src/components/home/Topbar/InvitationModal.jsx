import React, { useEffect, useState } from "react";
import Modal from "../../common/Modal/Modal";
import walletService from "../../../services/wallet.service";
import { useToast } from "../../common/Toast/ToastContext";
import { useWalletData } from "../../../home/store/WalletDataContext";

// Import CSS
import "../../../styles/home/InvitationModal.css";

export default function InvitationModal({ isOpen, onClose }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);

  const { addToast } = useToast();
  const { fetchWallets } = useWalletData();

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await walletService.getInvitations();
      setInvitations(res.data?.invitations || []);
    } catch (error) {
      console.error("Lỗi tải lời mời:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInvitations();
    }
  }, [isOpen]);

  const handleRespond = async (walletId, isAccepted) => {
    try {
      const res = await walletService.respondToInvitation(walletId, isAccepted);
      addToast(res.message, isAccepted ? "success" : "info");

      if (isAccepted && fetchWallets) {
        fetchWallets();
      }
      fetchInvitations();
    } catch (error) {
      const msg = error.response?.data?.error || "Có lỗi xảy ra";
      addToast(msg, "error");
    }
  };

  return (
    <Modal title="Hộp thư lời mời" isOpen={isOpen} onClose={onClose}>
      <div className="invitation-container">
        {loading && <div className="invitation-loading">Đang tải...</div>}

        {!loading && invitations.length === 0 && (
          <div className="invitation-empty">Không có lời mời nào mới.</div>
        )}

        {!loading && invitations.length > 0 && (
          <ul className="invitation-list">
            {invitations.map((inv) => (
              <li key={inv.walletId} className="invitation-item">
                {/* Phần nội dung bên trái */}
                <div className="inv-content">
                  <div className="inv-text">
                    <span className="inv-highlight">{inv.ownerName}</span> đã
                    mời bạn vào ví{" "}
                    <span className="inv-wallet-name">{inv.walletName}</span>
                  </div>

                  <div className="inv-meta">
                    <span className="inv-role-badge">{inv.myRole}</span>
                    <span>
                      {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Phần nút bấm bên phải (để thẳng hàng hoặc gom nhóm) */}
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
