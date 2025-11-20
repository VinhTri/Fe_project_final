// src/pages/Admin/AdminUsersPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../../styles/admin/AdminUsersPage.css";
import { ROLES, useAuth } from "../../home/store/AuthContext";
import { useToast } from "../../components/common/Toast/ToastContext";
import { useLanguage } from "../../home/store/LanguageContext";

// Mock data demo
const MOCK_USERS = [
  {
    id: 1,
    fullName: "Nguyễn Văn A",
    email: "a@example.com",
    role: ROLES.ADMIN,
    status: "ACTIVE",
    lastLogin: "2025-11-10 09:23",
    createdAt: "2023-05-12 10:20",
  },
  {
    id: 2,
    fullName: "Trần Thị B",
    email: "b@example.com",
    role: ROLES.USER,
    status: "ACTIVE",
    lastLogin: "2025-11-11 21:03",
    createdAt: "2024-01-03 14:55",
  },
  {
    id: 3,
    fullName: "Phạm Văn C",
    email: "c@example.com",
    role: ROLES.VIEWER,
    status: "LOCKED",
    lastLogin: "2025-11-09 14:47",
    createdAt: "2024-08-22 09:12",
  },
];

const MOCK_LOGS = {
  1: [
    {
      id: 101,
      time: "2025-11-12 08:10",
      action: "LOGIN",
      detail: "Đăng nhập thành công",
    },
    {
      id: 102,
      time: "2025-11-12 08:15",
      action: "CREATE",
      detail: "Tạo ví 'Ví tiền mặt'",
    },
  ],
  2: [
    {
      id: 201,
      time: "2025-11-11 20:00",
      action: "LOGIN",
      detail: "Đăng nhập thành công",
    },
    {
      id: 202,
      time: "2025-11-11 20:05",
      action: "UPDATE",
      detail: "Sửa ngân sách 'Chi tiêu tháng 11'",
    },
  ],
  3: [
    {
      id: 301,
      time: "2025-11-09 14:00",
      action: "LOGIN_FAIL",
      detail: "Sai mật khẩu 3 lần",
    },
  ],
};

// format thời gian dạng "YYYY-MM-DD HH:mm"
function formatNow() {
  const d = new Date();
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
}

export default function AdminUsersPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [logs, setLogs] = useState([]); // nhật ký đăng nhập (mock)
  const [editHistory, setEditHistory] = useState({}); // lịch sử chỉnh sửa tài khoản

  const [filterRole, setFilterRole] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // panel bên phải: "info" | "logs" | "manage" | "history"
  const [activePanel, setActivePanel] = useState("info");

  // helper thêm lịch sử chỉnh sửa
  const addHistoryEntry = (userId, action, detail) => {
    setEditHistory((prev) => {
      const list = prev[userId] || [];
      const newEntry = {
        id: Date.now() + Math.random(),
        time: formatNow(),
        action,
        detail,
      };
      return {
        ...prev,
        [userId]: [...list, newEntry],
      };
    });
  };

  // =============== Fake API ===============
  const fetchUsers = async () => {
    setLoadingUsers(true);
    await new Promise((res) => setTimeout(res, 300)); // giả delay
    setUsers(MOCK_USERS);
    setLoadingUsers(false);
  };

  const fetchUserLogs = async (userId) => {
    setLoadingLogs(true);
    await new Promise((res) => setTimeout(res, 200));
    setLogs(MOCK_LOGS[userId] || []);
    setLoadingLogs(false);
  };

  const updateUserRole = async (userId, newRole) => {
    // Lấy user hiện tại để lưu lịch sử
    const target = users.find((u) => u.id === userId);
    const oldRole = target?.role;

    // TODO: gọi API PUT /admin/users/:id/role
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    if (target) {
      addHistoryEntry(
        userId,
        t("admin.users.history.role_change"),
        t("admin.users.history.role_change_detail")
          .replace("{old}", oldRole)
          .replace("{new}", newRole)
      );
      showToast(
        t("admin.users.toast.role_updated")
          .replace("{name}", target.fullName)
          .replace("{role}", newRole)
      );
    } else {
      showToast(t("admin.users.toast.role_updated_generic"));
    }
  };

  const toggleUserStatus = async (userId) => {
    const target = users.find((u) => u.id === userId);
    const oldStatus = target?.status;

    // TODO: gọi API PATCH /admin/users/:id/status
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "ACTIVE" ? "LOCKED" : "ACTIVE" }
          : u
      )
    );

    if (target) {
      const newStatus = oldStatus === "ACTIVE" ? "LOCKED" : "ACTIVE";
      addHistoryEntry(
        userId,
        t("admin.users.history.status_change"),
        t("admin.users.history.status_change_detail")
          .replace("{old}", oldStatus)
          .replace("{new}", newStatus)
      );
      showToast(
        oldStatus === "ACTIVE"
          ? t("admin.users.toast.status_locked").replace("{name}", target.fullName)
          : t("admin.users.toast.status_unlocked").replace("{name}", target.fullName)
      );
    } else {
      showToast(t("admin.users.toast.status_updated_generic"));
    }
  };

  const deleteUser = async (userId) => {
    const target = users.find((u) => u.id === userId);

    if (target) {
      // lưu lịch sử trước khi xóa
      addHistoryEntry(
        userId,
        t("admin.users.history.delete"),
        t("admin.users.history.delete_detail").replace("{name}", target.fullName)
      );
    }

    if (selectedUserId === userId) {
      setSelectedUserId(null);
      setLogs([]);
    }

    // TODO: gọi API DELETE /admin/users/:id
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast(t("admin.users.toast.deleted").replace("{name}", target?.fullName || ""));
  };

  // =============== Effects ===============
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId != null) {
      fetchUserLogs(selectedUserId);
    } else {
      setLogs([]);
    }
  }, [selectedUserId]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole !== "ALL" && u.role !== filterRole) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, filterRole, search]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [users, selectedUserId]
  );

  const accountHistory = useMemo(
    () => (selectedUserId ? editHistory[selectedUserId] || [] : []),
    [editHistory, selectedUserId]
  );

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    setActivePanel("info");
  };

  const getStatusLabel = (status) => {
    if (status === "ACTIVE") return t("admin.users.status.active");
    if (status === "LOCKED") return t("admin.users.status.locked");
    return t("admin.users.status.unknown");
  };

  // =============== Render ===============
  return (
    <div className="admin-users-page">
      <div className="admin-users__header">
        <div>
          <h1 className="admin-users__title">{t("admin.users.title")}</h1>
          <p className="admin-users__subtitle">
            {t("admin.users.subtitle").replace("{name}", currentUser?.fullName || "Admin")}
          </p>
        </div>
      </div>

      <div className="admin-users__layout">
        {/* Cột trái: danh sách user */}
        <div className="admin-users__left">
          <div className="admin-card">
            <div className="admin-card__header">
              <h2>{t("admin.users.list_title")}</h2>
              <div className="admin-filters">
                <input
                  type="text"
                  placeholder={t("admin.users.search_placeholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="ALL">{t("admin.users.filter_role_all")}</option>
                  <option value={ROLES.ADMIN}>Admin</option>
                  <option value={ROLES.USER}>User</option>
                  <option value={ROLES.VIEWER}>Viewer</option>
                </select>
              </div>
            </div>

            {loadingUsers ? (
              <div className="admin-empty">{t("admin.users.loading")}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="admin-empty">{t("admin.users.empty")}</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("admin.users.table.name")}</th>
                    <th>{t("admin.users.table.email")}</th>
                    <th>{t("admin.users.table.role")}</th>
                    <th>{t("admin.users.table.status")}</th>
                    <th>{t("admin.users.table.created_at")}</th>
                    <th>{t("admin.users.table.last_login")}</th>
                    <th>{t("admin.users.table.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={
                        u.id === selectedUserId ? "admin-row--active" : ""
                      }
                      onClick={() => handleSelectUser(u.id)}
                    >
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateUserRole(u.id, e.target.value);
                          }}
                        >
                          <option value={ROLES.ADMIN}>Admin</option>
                          <option value={ROLES.USER}>User</option>
                          <option value={ROLES.VIEWER}>Viewer</option>
                        </select>
                      </td>
                      <td>
                        <span
                          className={
                            u.status === "ACTIVE"
                              ? "badge badge--active"
                              : "badge badge--locked"
                          }
                        >
                          {getStatusLabel(u.status)}
                        </span>
                      </td>
                      <td>{u.createdAt}</td>
                      <td>{u.lastLogin}</td>
                      <td className="admin-actions-cell">
                        <button
                          className="btn-chip btn-chip--ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUserStatus(u.id);
                          }}
                        >
                          {u.status === "ACTIVE" ? t("admin.users.btn.lock") : t("admin.users.btn.unlock")}
                        </button>
                        <button
                          className="btn-chip btn-chip--danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUser(u.id);
                          }}
                        >
                          {t("admin.users.btn.delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Cột phải: chi tiết + các panel chức năng ẩn/hiện */}
        <div className="admin-users__right">
          {!selectedUser ? (
            <div className="admin-empty admin-empty--border">
              {t("admin.users.select_hint")}
            </div>
          ) : (
            <>
              {/* Tabs chức năng */}
              <div className="admin-panel-tabs">
                <button
                  className={
                    activePanel === "info"
                      ? "admin-tab admin-tab--active"
                      : "admin-tab"
                  }
                  onClick={() => setActivePanel("info")}
                >
                  {t("admin.users.tab.info")}
                </button>
                <button
                  className={
                    activePanel === "logs"
                      ? "admin-tab admin-tab--active"
                      : "admin-tab"
                  }
                  onClick={() => setActivePanel("logs")}
                >
                  {t("admin.users.tab.logs")}
                </button>
                <button
                  className={
                    activePanel === "history"
                      ? "admin-tab admin-tab--active"
                      : "admin-tab"
                  }
                  onClick={() => setActivePanel("history")}
                >
                  {t("admin.users.tab.history")}
                </button>
                <button
                  className={
                    activePanel === "manage"
                      ? "admin-tab admin-tab--active"
                      : "admin-tab"
                  }
                  onClick={() => setActivePanel("manage")}
                >
                  {t("admin.users.tab.manage")}
                </button>
              </div>

              {/* Panel: Thông tin */}
              {activePanel === "info" && (
                <div className="admin-card admin-panel">
                  <h2>{t("admin.users.info.title")}</h2>
                  <div className="admin-detail">
                    <div>
                      <div className="admin-detail__label">{t("admin.users.info.name")}</div>
                      <div className="admin-detail__value">
                        {selectedUser.fullName}
                      </div>
                    </div>
                    <div>
                      <div className="admin-detail__label">{t("admin.users.info.email")}</div>
                      <div className="admin-detail__value">
                        {selectedUser.email}
                      </div>
                    </div>
                    <div>
                      <div className="admin-detail__label">{t("admin.users.info.role")}</div>
                      <div className="admin-detail__value">
                        {selectedUser.role}
                      </div>
                    </div>
                    <div>
                      <div className="admin-detail__label">{t("admin.users.info.status")}</div>
                      <div className="admin-detail__value">
                        {getStatusLabel(selectedUser.status)}
                      </div>
                    </div>
                    <div>
                      <div className="admin-detail__label">
                        {t("admin.users.info.last_login")}
                      </div>
                      <div className="admin-detail__value">
                        {selectedUser.lastLogin || t("admin.users.info.no_data")}
                      </div>
                    </div>
                    <div>
                      <div className="admin-detail__label">{t("admin.users.info.created_at")}</div>
                      <div className="admin-detail__value">
                        {selectedUser.createdAt || t("admin.users.info.no_data")}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel: Nhật ký đăng nhập */}
              {activePanel === "logs" && (
                <div className="admin-card admin-panel">
                  <div className="admin-card__header">
                    <h2>{t("admin.users.logs.title")}</h2>
                  </div>
                  {loadingLogs ? (
                    <div className="admin-empty">{t("admin.users.logs.loading")}</div>
                  ) : logs.length === 0 ? (
                    <div className="admin-empty">
                      {t("admin.users.logs.empty")}
                    </div>
                  ) : (
                    <ul className="admin-log-list">
                      {logs.map((log) => (
                        <li key={log.id} className="admin-log-item">
                          <div className="admin-log__time">{log.time}</div>
                          <div className="admin-log__action">
                            {log.action}
                          </div>
                          <div className="admin-log__detail">
                            {log.detail}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Panel: Lịch sử chỉnh sửa tài khoản */}
              {activePanel === "history" && (
                <div className="admin-card admin-panel">
                  <div className="admin-card__header">
                    <h2>{t("admin.users.history.title")}</h2>
                  </div>
                  {accountHistory.length === 0 ? (
                    <div className="admin-empty">
                      {t("admin.users.history.empty")}
                    </div>
                  ) : (
                    <ul className="admin-log-list">
                      {accountHistory.map((h) => (
                        <li key={h.id} className="admin-log-item">
                          <div className="admin-log__time">{h.time}</div>
                          <div className="admin-log__action">{h.action}</div>
                          <div className="admin-log__detail">{h.detail}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Panel: Quản lý tài khoản */}
              {activePanel === "manage" && (
                <div className="admin-card admin-panel">
                  <h2>{t("admin.users.manage.title")}</h2>
                  <p className="admin-panel__desc">
                    {t("admin.users.manage.desc")}
                  </p>

                  <div className="admin-manage-grid">
                    <div className="admin-manage-block">
                      <h3>{t("admin.users.manage.role_title")}</h3>
                      <p>{t("admin.users.manage.role_desc")}</p>
                      <select
                        value={selectedUser.role}
                        onChange={(e) =>
                          updateUserRole(selectedUser.id, e.target.value)
                        }
                      >
                        <option value={ROLES.ADMIN}>Admin</option>
                        <option value={ROLES.USER}>User</option>
                        <option value={ROLES.VIEWER}>Viewer</option>
                      </select>
                    </div>

                    <div className="admin-manage-block">
                      <h3>{t("admin.users.manage.status_title")}</h3>
                      <p>{t("admin.users.manage.status_desc")}</p>
                      <button
                        className="btn-primary"
                        onClick={() => toggleUserStatus(selectedUser.id)}
                      >
                        {selectedUser.status === "ACTIVE"
                          ? t("admin.users.manage.btn_lock")
                          : t("admin.users.manage.btn_unlock")}
                      </button>
                    </div>

                    <div className="admin-manage-block">
                      <h3>{t("admin.users.manage.delete_title")}</h3>
                      <p>
                        {t("admin.users.manage.delete_desc")}
                      </p>
                      <button
                        className="btn-primary btn-primary--outline"
                        onClick={() => deleteUser(selectedUser.id)}
                      >
                        {t("admin.users.manage.btn_delete")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
