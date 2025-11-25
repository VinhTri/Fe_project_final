import React, { useEffect, useState } from "react";
import { toast } from "react-toastify"; // Giả sử bạn dùng react-toastify hoặc component Toast của bạn
import FundSection from "./FundSection";
import * as walletService from "../../services/wallet.service"; // Import service

export default function ParticipateManager() {
  const [accessibleWallets, setAccessibleWallets] = useState([]);
  const [viewFunds, setViewFunds] = useState([]);
  const [useFunds, setUseFunds] = useState([]);

  const [selectedFund, setSelectedFund] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // State cho việc mời thành viên mới
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // 1. Fetch danh sách ví được chia sẻ khi component mount
  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      // Gọi API lấy tất cả ví user tham gia
      const data = await walletService.getAllAccessibleWallets();
      setAccessibleWallets(data);
    } catch (error) {
      console.error("Lỗi tải danh sách ví:", error);
      toast.error("Không thể tải danh sách ví tham gia");
    }
  };

  // 2. Phân loại ví (View vs Use) mỗi khi danh sách thay đổi
  useEffect(() => {
    if (!accessibleWallets.length) return;

    const viewers = [];
    const users = [];

    accessibleWallets.forEach((wallet) => {
      // Map dữ liệu từ Backend DTO sang format của FundSection (nếu cần)
      const item = {
        id: wallet.walletId,
        name: wallet.walletName,
        balance: wallet.balance,
        currency: wallet.currencyCode,
        role: wallet.myRole, // OWNER, ADMIN, EDITOR, VIEWER
        type: wallet.walletType,
        ownerName: wallet.ownerName,
      };

      if (wallet.myRole === "VIEWER") {
        viewers.push(item);
      } else {
        users.push(item);
      }
    });

    setViewFunds(viewers);
    setUseFunds(users);
  }, [accessibleWallets]);

  // 3. Fetch thành viên khi chọn ví
  useEffect(() => {
    if (!selectedFund) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const data = await walletService.getWalletMembers(selectedFund.id);
        setMembers(data);
      } catch (error) {
        console.error(error);
        toast.error("Lỗi tải danh sách thành viên");
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [selectedFund]);

  // --- LOGIC PHÂN QUYỀN UI ---
  // Kiểm tra xem user hiện tại (Actor) có quyền sửa user kia (Target) không
  const canManageMember = (targetRole) => {
    const myRole = selectedFund?.role;

    if (myRole === "OWNER") return true; // Owner quyền lực nhất
    if (myRole === "ADMIN") {
      // Admin chỉ sửa được Editor và Viewer
      return targetRole === "EDITOR" || targetRole === "VIEWER";
    }
    return false;
  };

  // --- ACTIONS ---

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await walletService.updateMemberRole(selectedFund.id, memberId, newRole);
      toast.success("Cập nhật quyền thành công!");

      // Cập nhật state local để UI phản hồi nhanh
      setMembers((prev) =>
        prev.map((m) => (m.memberId === memberId ? { ...m, role: newRole } : m))
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật quyền");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Bạn có chắc muốn mời thành viên này ra khỏi ví?"))
      return;

    try {
      await walletService.removeMember(selectedFund.id, memberId);
      toast.success("Đã xóa thành viên");
      setMembers((prev) => prev.filter((m) => m.memberId !== memberId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi xóa thành viên");
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.warning("Vui lòng nhập email");
      return;
    }

    setIsInviting(true);
    try {
      // API shareWallet trả về thông tin member mới
      const newMember = await walletService.shareWallet(
        selectedFund.id,
        inviteEmail
      );
      toast.success("Đã thêm thành viên mới!");
      setMembers((prev) => [...prev, newMember]);
      setInviteEmail(""); // Clear input
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Không thể mời thành viên (Email không tồn tại hoặc đã tham gia)"
      );
    } finally {
      setIsInviting(false);
    }
  };

  // Helper hiển thị tên Role tiếng Việt
  const getRoleLabel = (role) => {
    switch (role) {
      case "OWNER":
        return "Chủ sở hữu";
      case "ADMIN":
        return "Quản trị viên";
      case "EDITOR":
        return "Thành viên (Sửa)";
      case "VIEWER":
        return "Người xem";
      default:
        return role;
    }
  };

  // --- RENDER ---
  return (
    <div className="row g-3">
      {/* CỘT TRÁI: DANH SÁCH QUỸ */}
      <div className="col-lg-5">
        <FundSection
          title="Quỹ tham gia (Chỉ xem)"
          subtitle="Bạn chỉ có quyền xem số dư và lịch sử giao dịch."
          items={viewFunds}
          onSelectFund={(fund) => setSelectedFund(fund)}
        />

        <FundSection
          title="Quỹ tham gia (Được sử dụng)"
          subtitle="Bạn có quyền thêm giao dịch hoặc quản lý (tùy vai trò)."
          items={useFunds}
          onSelectFund={(fund) => setSelectedFund(fund)}
        />
      </div>

      {/* CỘT PHẢI: CHI TIẾT & QUẢN LÝ */}
      <div className="col-lg-7">
        {!selectedFund ? (
          <div className="card border-0 shadow-sm p-4 text-center">
            <h5 className="text-muted">Chọn một ví để xem chi tiết</h5>
          </div>
        ) : (
          <div className="funds-fieldset">
            <div className="funds-fieldset__legend">
              Quản lý thành viên: {selectedFund.name}
            </div>

            {/* Thông tin ví cơ bản */}
            <div className="funds-field funds-field--inline mb-3">
              <div>
                <label>Vai trò của bạn</label>
                <input
                  type="text"
                  disabled
                  value={getRoleLabel(selectedFund.role)}
                  className="fw-bold text-primary"
                />
              </div>
              <div>
                <label>Số dư hiện tại</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedFund.balance?.toLocaleString()} ${
                    selectedFund.currency
                  }`}
                />
              </div>
            </div>

            {/* Danh sách thành viên */}
            <div className="funds-field">
              <label>Danh sách thành viên ({members.length})</label>

              {loadingMembers ? (
                <div className="text-center py-3">Đang tải thành viên...</div>
              ) : (
                <div className="funds-members">
                  {members.map((m) => {
                    const isMe = false; // TODO: So sánh m.userId với currentUserId nếu cần ẩn nút xóa chính mình
                    const isOwner = m.role === "OWNER";
                    const canEdit = canManageMember(m.role) && !isMe;

                    return (
                      <div
                        key={m.memberId}
                        className="funds-member-row align-items-center mb-2"
                      >
                        {/* Avatar & Info */}
                        <div className="d-flex align-items-center flex-grow-1 gap-2">
                          <img
                            src={m.avatar || "https://via.placeholder.com/32"}
                            alt="avt"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                            }}
                          />
                          <div style={{ overflow: "hidden" }}>
                            <div
                              className="fw-bold text-truncate"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {m.fullName}
                            </div>
                            <div
                              className="text-muted text-truncate"
                              style={{ fontSize: "0.8rem" }}
                            >
                              {m.email}
                            </div>
                          </div>
                        </div>

                        {/* Role Selector */}
                        <div style={{ width: "140px" }}>
                          {canEdit ? (
                            <select
                              className="form-select form-select-sm"
                              value={m.role}
                              onChange={(e) =>
                                handleUpdateRole(m.memberId, e.target.value)
                              }
                            >
                              <option value="ADMIN">Quản trị</option>
                              <option value="EDITOR">Thành viên</option>
                              <option value="VIEWER">Người xem</option>
                            </select>
                          ) : (
                            <span
                              className={`badge ${
                                isOwner
                                  ? "bg-warning text-dark"
                                  : "bg-light text-dark border"
                              }`}
                            >
                              {getRoleLabel(m.role)}
                            </span>
                          )}
                        </div>

                        {/* Delete Button */}
                        <div style={{ width: "30px", textAlign: "right" }}>
                          {canEdit && (
                            <button
                              type="button"
                              className="btn-icon text-danger"
                              onClick={() => handleRemoveMember(m.memberId)}
                              title="Mời ra khỏi ví"
                            >
                              <i className="bi bi-x-circle-fill" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form mời thành viên (Chỉ hiện nếu có quyền mời) */}
            {(selectedFund.role === "OWNER" ||
              selectedFund.role === "ADMIN") && (
              <div className="funds-field mt-3 pt-3 border-top">
                <label>Mời thành viên mới</label>
                <div className="d-flex gap-2">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Nhập email người dùng..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <button
                    className="btn btn-primary text-nowrap"
                    onClick={handleInviteMember}
                    disabled={isInviting}
                  >
                    {isInviting ? "Đang mời..." : "Mời"}
                  </button>
                </div>
                <div className="funds-hint mt-1">
                  Người được mời sẽ mặc định là "Người xem". Bạn có thể cấp
                  quyền sau.
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="funds-actions mt-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedFund(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
