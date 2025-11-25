import React, { useEffect, useState } from "react";
import walletService from "../../../services/wallet.service";
import { useToast } from "../../common/Toast/ToastContext";
import { useWalletData } from "../../../home/store/WalletDataContext";

// Import CSS
import "../../../styles/home/InvitationModal.css";

export default function InvitationModal() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();
  const { fetchWallets } = useWalletData();

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await walletService.getInvitations();
      // Lấy dữ liệu từ res.data.invitations
      setInvitations(res.data?.invitations || []);
    } catch (error) {
      console.error("Lỗi tải lời mời:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleRespond = async (walletId, isAccepted) => {
    try {
      const res = await walletService.respondToInvitation(walletId, isAccepted);

      // --- SỬA LỖI Ở ĐÂY ---
      // 1. Lấy thông báo từ res.data.message (thay vì res.message)
      const serverMessage = res.data?.message || "Thao tác thành công";

      // 2. Nếu Từ chối (isAccepted = false) -> dùng type 'error' để hiện màu đỏ
      const toastType = isAccepted ? "success" : "error";

      showToast(serverMessage, toastType);
      // --------------------

      if (isAccepted && fetchWallets) {
        fetchWallets();
      }
      // Load lại danh sách để loại bỏ lời mời vừa xử lý
      fetchInvitations();
    } catch (error) {
      const msg = error.response?.data?.error || "Có lỗi xảy ra";
      showToast(msg, "error");
    }
  };

  return (
    <div className="invitation-dropdown">
      <div className="invitation-header">
        <h4>Hộp thư lời mời</h4>
      </div>

      {/* Class invitation-body đã được CSS max-height + overflow-y:auto để cuộn */}
      <div className="invitation-body">
        {loading && <div className="invitation-loading">Đang tải...</div>}

        {!loading && invitations.length === 0 && (
          <div className="invitation-empty">Không có lời mời nào mới.</div>
        )}

        {!loading && invitations.length > 0 && (
          <ul className="invitation-list">
            {invitations.map((inv) => (
              <li key={inv.walletId} className="invitation-item">
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
                <div className="inv-actions">
                  <button
                    className="btn-inv btn-accept"
                    onClick={() => handleRespond(inv.walletId, true)}
                    title="Đồng ý"
                  >
                    <i className="fas fa-check"></i>
                  </button>
                  <button
                    className="btn-inv btn-decline"
                    onClick={() => handleRespond(inv.walletId, false)}
                    title="Từ chối"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
