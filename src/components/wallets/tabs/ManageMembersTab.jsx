import React from "react";

export default function ManageMembersTab({
  wallet,
  sharedMembers = [],
  sharedMembersLoading = false,
  sharedMembersError = "",
  onRemoveSharedMember,
  removingMemberId,
}) {
  const ownerBadge = (role = "") => {
    const upper = role.toUpperCase();
    if (upper === "OWNER" || upper === "MASTER" || upper === "ADMIN") {
      return "Chủ ví";
    }
    if (upper === "USE" || upper === "USER") return "Được sử dụng";
    if (upper === "VIEW" || upper === "VIEWER") return "Chỉ xem";
    return role;
  };

  const safeMembers = Array.isArray(sharedMembers) ? sharedMembers : [];

  return (
    <div className="wallets-section wallets-section--manage">
      <div className="wallets-section__header">
        <h3>Quản lý người dùng</h3>
        <span>Kiểm soát danh sách người được chia sẻ ví "{wallet?.name}".</span>
      </div>

      <div className="wallets-manage-list">
        {sharedMembersLoading && (
          <div className="wallets-manage__state">Đang tải danh sách...</div>
        )}
        {!sharedMembersLoading && sharedMembersError && (
          <div className="wallets-manage__state wallets-manage__state--error">
            {sharedMembersError}
          </div>
        )}
        {!sharedMembersLoading && !sharedMembersError && safeMembers.length === 0 && (
          <div className="wallets-manage__state">
            Chưa có người dùng nào được chia sẻ.
          </div>
        )}

        {!sharedMembersLoading && !sharedMembersError && safeMembers.length > 0 && (
          <ul>
            {safeMembers.map((member) => {
              const memberId = member.userId ?? member.memberUserId ?? member.memberId;
              const role = member.role || "";
              const isOwner = ["OWNER", "MASTER", "ADMIN"].includes(role.toUpperCase());
              return (
                <li key={memberId || member.email || role}>
                  <div>
                    <div className="wallets-manage__name">{member.fullName || member.name || member.email}</div>
                    <div className="wallets-manage__meta">
                      {member.email && <span>{member.email}</span>}
                      {role && <span>{ownerBadge(role)}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveSharedMember?.(member)}
                    disabled={isOwner || removingMemberId === memberId}
                  >
                    {removingMemberId === memberId ? "Đang xóa..." : "Xóa"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

