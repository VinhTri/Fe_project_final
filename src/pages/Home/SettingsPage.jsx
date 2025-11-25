// src/pages/Home/SettingsPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { getProfile, updateProfile, changePassword } from "../../services/profile.service";
import { loginLogAPI } from "../../services/api-client";
import { triggerBackup, getBackupHistory } from "../../services/backup.service";
import Toast from "../../components/common/Toast/Toast";
import "../../styles/home/SettingsPage.css";

export default function SettingsPage() {

  const [activeKey, setActiveKey] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [defaultCurrency, setDefaultCurrency] = useState(() => {
    // Lấy từ localStorage hoặc mặc định là VND
    return localStorage.getItem("defaultCurrency") || "VND";
  });
  const [loginLogs, setLoginLogs] = useState([]);
  const [loginLogsLoading, setLoginLogsLoading] = useState(false);
  const [loginLogsError, setLoginLogsError] = useState("");
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  const [backupHistoryLoading, setBackupHistoryLoading] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  // Refs cho các input fields
  const fullNameRef = useRef(null);
  const avatarRef = useRef(null);
  const oldPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const currencyRef = useRef(null);

  // Load profile khi component mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Load login logs khi mở tab login-log
  useEffect(() => {
    if (activeKey === "login-log" && loginLogs.length === 0 && !loginLogsLoading) {
      loadLoginLogs();
    }
  }, [activeKey]);

  // Load backup history khi mở tab backup
  useEffect(() => {
    if (activeKey === "backup" && backupHistory.length === 0 && !backupHistoryLoading) {
      loadBackupHistory();
    }
  }, [activeKey]);

  const loadBackupHistory = async () => {
    try {
      setBackupHistoryLoading(true);
      const { response, data } = await getBackupHistory();
      if (response?.ok && data?.backups) {
        setBackupHistory(data.backups || []);
      } else {
        // Nếu lỗi liên quan đến cloud config, không hiển thị lỗi (chỉ để trống)
        const errorMsg = data?.error || "";
        if (errorMsg.includes("cloud") || errorMsg.includes("aws") || errorMsg.includes("cấu hình")) {
          setBackupHistory([]);
        } else {
          console.error("Error loading backup history:", errorMsg);
          setBackupHistory([]);
        }
      }
    } catch (error) {
      console.error("Error loading backup history:", error);
      setBackupHistory([]);
    } finally {
      setBackupHistoryLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      setBackupLoading(true);
      const { response, data } = await triggerBackup();
      if (response?.ok) {
        setToast({
          open: true,
          message: data.message || "Sao lưu thành công!",
          type: "success",
        });
        // Reload backup history sau khi backup thành công
        await loadBackupHistory();
      } else {
        // Xử lý lỗi từ backend
        const errorMsg = data?.error || "Sao lưu thất bại. Vui lòng thử lại.";
        let displayMessage = errorMsg;
        
        // Kiểm tra nếu lỗi liên quan đến cloud configuration
        if (errorMsg.includes("cloud") || errorMsg.includes("aws") || errorMsg.includes("cấu hình")) {
          displayMessage = "Chức năng sao lưu cloud chưa được cấu hình. Vui lòng liên hệ quản trị viên để được hỗ trợ.";
        }
        
        setToast({
          open: true,
          message: displayMessage,
          type: "error",
        });
      }
    } catch (error) {
      setToast({
        open: true,
        message: "Có lỗi xảy ra khi sao lưu. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleToggleAutoSync = async () => {
    // TODO: Implement API call to enable/disable auto sync when backend supports it
    setAutoSyncEnabled((prev) => !prev);
    setToast({
      open: true,
      message: autoSyncEnabled
        ? "Đã tắt đồng bộ tự động"
        : "Đã bật đồng bộ tự động",
      type: "success",
    });
  };

  const loadLoginLogs = async () => {
    try {
      setLoginLogsLoading(true);
      setLoginLogsError("");
      const response = await loginLogAPI.getMyLoginLogs();
      if (response && Array.isArray(response)) {
        setLoginLogs(response);
      } else if (response && response.logs && Array.isArray(response.logs)) {
        setLoginLogs(response.logs);
      } else {
        setLoginLogs([]);
      }
    } catch (error) {
      console.error("Error loading login logs:", error);
      setLoginLogsError("Không thể tải nhật ký đăng nhập. Vui lòng thử lại sau.");
      setLoginLogs([]);
    } finally {
      setLoginLogsLoading(false);
    }
  };

  const formatLoginLogDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return "Hôm qua";
      if (diffDays < 7) return `${diffDays} ngày trước`;

      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { response, data } = await getProfile();
      if (response.ok && data.user) {
        setUser(data.user);
      } else {
        setError(data.error || "Không thể tải thông tin profile");
      }
    } catch (err) {
      setError("Lỗi kết nối khi tải thông tin profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (key) => {
    setActiveKey((prev) => (prev === key ? null : key));
    setError("");
    setSuccess("");
    // Reset avatar preview khi đóng form
    if (key !== "profile") {
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setAvatarFile(file);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  // Sửa trong file SettingsPage.jsx

  const handleUpdateProfile = async () => {
    const fullName = fullNameRef.current?.value?.trim();
    
    // Logic xác định avatar:
    // 1. Ưu tiên file mới (avatarPreview là base64 của file)
    // 2. Nếu không có file mới, giữ nguyên avatar cũ từ state (user.avatar)
    const avatar = avatarFile 
      ? avatarPreview // Base64 data URL từ file đã chọn
      : user?.avatar; // Giữ nguyên avatar cũ nếu không chọn file mới

    if (!fullName && !avatarFile) {
      if (!fullName && !user?.fullName) {
        setError("Vui lòng nhập tên hoặc chọn ảnh đại diện");
        return;
      }
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const { response, data } = await updateProfile({ 
        fullName: fullName || undefined, 
        avatar: avatar || undefined 
      });

      if (response.ok && data.user) {
        // 1. Cập nhật state cục bộ (như cũ)
        setUser(data.user);

        // 2. ✅ Cập nhật localStorage với user mới nhất từ API
        localStorage.setItem("user", JSON.stringify(data.user));

        // 3. ✅ Bắn tín hiệu "storageUpdated" để HomeTopbar cập nhật avatar
        // Sử dụng setTimeout nhỏ để đảm bảo localStorage đã được cập nhật
        setTimeout(() => {
          console.log("SettingsPage: Đã cập nhật localStorage và bắn tín hiệu 'storageUpdated'");
          window.dispatchEvent(new CustomEvent('storageUpdated'));
        }, 0);

        // 4. Dọn dẹp form
        setAvatarPreview(null);
        setAvatarFile(null);
        if (avatarRef.current) avatarRef.current.value = "";
        
        // 5. Hiển thị thông báo thành công
        setSuccess(data.message || "Cập nhật profile thành công");
        setTimeout(() => setSuccess(""), 3000);
        
      } else {
        // Xử lý lỗi từ API
        setError(data.error || "Cập nhật profile thất bại");
      }
    } catch (err) {
      // Xử lý lỗi mạng hoặc lỗi hệ thống
      setError("Lỗi kết nối khi cập nhật profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const oldPassword = oldPasswordRef.current?.value;
    const newPassword = newPasswordRef.current?.value;
    const confirmPassword = confirmPasswordRef.current?.value;

    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận không khớp");
      return;
    }

    // Nếu user đã có password, bắt buộc phải nhập old password
    if (user?.hasPassword && (!oldPassword || oldPassword.trim() === "")) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const { response, data } = await changePassword({
        oldPassword: user?.hasPassword ? oldPassword : undefined, // Chỉ gửi oldPassword nếu user đã có password
        newPassword,
        confirmPassword,
      });
      if (response.ok && data.message) {
        setSuccess(data.message);
        // Clear password fields
        if (oldPasswordRef.current) oldPasswordRef.current.value = "";
        if (newPasswordRef.current) newPasswordRef.current.value = "";
        if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
        // Reload profile để cập nhật hasPassword
        await loadProfile();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Đổi mật khẩu thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối khi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  const renderDetail = (key) => {

    switch (key) {

      // ====== NHÓM BẢO MẬT ======

      case "profile":

        return (
<div className="settings-detail__body">
<h4>Chỉnh sửa hồ sơ cá nhân</h4>
<p className="settings-detail__desc">

              Cập nhật ảnh đại diện và tên hiển thị của bạn.
</p>
<div className="settings-profile-grid">

              {/* CỘT TRÁI: ĐỔI TÊN */}
<div className="settings-form__group">
<label>Tên hiển thị</label>
<input

                  ref={fullNameRef}
                  type="text"

                  defaultValue={user?.fullName || ""}

                  placeholder="Nhập tên muốn hiển thị"

                />
</div>

              {/* CỘT PHẢI: ẢNH ĐẠI DIỆN */}
<div className="settings-avatar-upload">
<img

                  src={avatarPreview || user?.avatar || "https://i.pravatar.cc/150?img=12"}

                  alt="avatar"

                  className="settings-avatar-preview"

                />
<label className="settings-btn settings-btn--primary settings-avatar-btn">

                  Chọn ảnh
<input

                    ref={avatarRef}
                    type="file"

                    accept="image/*"

                    onChange={handleAvatarChange}

                    style={{ display: 'none' }}

                  />
</label>
{avatarFile && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Đã chọn: {avatarFile.name}
                </p>
              )}
</div>
</div>
{error && activeKey === "profile" && <div className="settings-error" style={{color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px'}}>{error}</div>}
{success && activeKey === "profile" && <div className="settings-success" style={{color: 'green', marginBottom: '10px', padding: '10px', backgroundColor: '#e6ffe6', borderRadius: '4px'}}>{success}</div>}
<button 
              className="settings-btn settings-btn--primary"
              onClick={handleUpdateProfile}
              disabled={loading}
            >

              {loading ? "Đang lưu..." : "Lưu thay đổi"}
</button>
</div>

        );

      case "password":

        return (
<div className="settings-detail__body">
<h4>Đổi mật khẩu</h4>
<p className="settings-detail__desc">
              {user?.hasPassword 
                ? "Nên sử dụng mật khẩu mạnh, khó đoán để bảo vệ tài khoản."
                : "Bạn đang đăng nhập bằng Google. Hãy đặt mật khẩu để có thể đăng nhập bằng email và mật khẩu."}
</p>
<div className="settings-form__grid">
{/* Chỉ hiển thị field "Mật khẩu hiện tại" nếu user đã có password */}
{user?.hasPassword && (
<div className="settings-form__group">
<label>Mật khẩu hiện tại</label>
<input 
                ref={oldPasswordRef}
                type="password" 
                placeholder="Nhập mật khẩu hiện tại" 
                required
              />
</div>
)}
<div className="settings-form__group">
<label>Mật khẩu mới</label>
<input 
                ref={newPasswordRef}
                type="password" 
                placeholder="Nhập mật khẩu mới" 
                required
              />
</div>
<div className="settings-form__group">
<label>Nhập lại mật khẩu mới</label>
<input

                  ref={confirmPasswordRef}
                  type="password"

                  placeholder="Nhập lại mật khẩu mới"
                  required

                />
</div>
</div>
{error && activeKey === "password" && <div className="settings-error" style={{color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px'}}>{error}</div>}
{success && activeKey === "password" && <div className="settings-success" style={{color: 'green', marginBottom: '10px', padding: '10px', backgroundColor: '#e6ffe6', borderRadius: '4px'}}>{success}</div>}
<button 
              className="settings-btn settings-btn--primary"
              onClick={handleChangePassword}
              disabled={loading}
            >

              {loading ? "Đang cập nhật..." : user?.hasPassword ? "Cập nhật mật khẩu" : "Đặt mật khẩu"}
</button>
</div>

        );

      case "2fa":

        return (
<div className="settings-detail__body">
<h4>Xác thực 2 lớp (2FA)</h4>
<p className="settings-detail__desc">

              Thêm một lớp bảo mật bằng mã xác thực khi đăng nhập.
</p>
<div className="settings-toggle-row">
<span>Trạng thái 2FA</span>
<label className="settings-switch">
<input type="checkbox" />
<span className="settings-switch__slider" />
</label>
</div>
<p className="settings-detail__hint">

              Sau khi bật, mỗi lần đăng nhập bạn sẽ cần nhập thêm mã xác thực

              gửi qua ứng dụng hoặc email.
</p>
<button className="settings-btn settings-btn--primary">

              Cấu hình 2FA
</button>
</div>

        );

      case "login-log":

        return (
<div className="settings-detail__body">
<h4>Nhật ký đăng nhập</h4>
<p className="settings-detail__desc">

              Kiểm tra các lần đăng nhập gần đây để phát hiện hoạt động bất

              thường.
</p>
{loginLogsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 text-muted">Đang tải nhật ký đăng nhập...</p>
              </div>
            ) : loginLogsError ? (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2" />
                {loginLogsError}
              </div>
            ) : loginLogs.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-2" />
                <p>Chưa có nhật ký đăng nhập</p>
              </div>
            ) : (
              <div className="settings-table__wrap">
                <table className="settings-table">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Thiết bị</th>
                      <th>Địa chỉ IP</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginLogs.map((log) => (
                      <tr key={log.logId || log.id}>
                        <td>{formatLoginLogDate(log.loginTime || log.createdAt)}</td>
                        <td>{log.device || log.userAgent || "Không xác định"}</td>
                        <td>{log.ipAddress || log.ip || "N/A"}</td>
                        <td>
                          <span className={`badge ${log.status === "SUCCESS" || log.success ? "bg-success" : "bg-danger"}`}>
                            {log.status === "SUCCESS" || log.success ? "Thành công" : "Thất bại"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
</div>

        );

      case "logout-all":

        return (
<div className="settings-detail__body">
<h4>Đăng xuất tất cả thiết bị</h4>
<p className="settings-detail__desc">

              Tính năng này sẽ đăng xuất tài khoản khỏi tất cả thiết bị đang

              đăng nhập ngoại trừ thiết bị hiện tại.
</p>
<ul className="settings-detail__list">
<li>Nên sử dụng khi bạn nghi ngờ tài khoản bị lộ.</li>
<li>

                Sau khi đăng xuất, bạn cần đăng nhập lại bằng mật khẩu hiện tại.
</li>
</ul>
<button className="settings-btn settings-btn--danger">

              Đăng xuất tất cả thiết bị
</button>
</div>

        );

      // ====== NHÓM CÀI ĐẶT HỆ THỐNG ======

      case "currency":

        return (
<div className="settings-detail__body">
<h4>Chọn đơn vị tiền tệ</h4>
<p className="settings-detail__desc">

              Đơn vị tiền tệ mặc định dùng để hiển thị số dư và báo cáo.
</p>
<div className="settings-form__group">
<label>Đơn vị tiền tệ mặc định</label>
<select 
                ref={currencyRef}
                defaultValue={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
              >
<option value="VND">VND - Việt Nam Đồng</option>
<option value="USD">USD - Đô la Mỹ</option>
</select>
</div>
{error && activeKey === "currency" && <div className="settings-error" style={{color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px'}}>{error}</div>}
{success && activeKey === "currency" && <div className="settings-success" style={{color: 'green', marginBottom: '10px', padding: '10px', backgroundColor: '#e6ffe6', borderRadius: '4px'}}>{success}</div>}
<button 
              className="settings-btn settings-btn--primary"
              onClick={() => {
                const selectedCurrency = currencyRef.current?.value || "VND";
                localStorage.setItem("defaultCurrency", selectedCurrency);
                setDefaultCurrency(selectedCurrency);
                setSuccess("Đã lưu cài đặt đơn vị tiền tệ");
                setTimeout(() => setSuccess(""), 3000);
                // Bắn event để các component khác cập nhật
                window.dispatchEvent(new CustomEvent('currencySettingChanged', { detail: { currency: selectedCurrency } }));
              }}
            >

              Lưu cài đặt
</button>
</div>

        );

      case "currency-format":

        return (
<div className="settings-detail__body">
<h4>Định dạng tiền tệ</h4>
<p className="settings-detail__desc">

              Chọn cách hiển thị số tiền trên ứng dụng.
</p>
<div className="settings-form__group">
<label>Kiểu hiển thị</label>
<select defaultValue="space">
<option value="space">

                  1 234 567 (cách nhau bằng khoảng trắng)
</option>
<option value="dot">1.234.567 (dấu chấm)</option>
<option value="comma">1,234,567 (dấu phẩy)</option>
</select>
</div>
<div className="settings-form__group">
<label>Số chữ số thập phân</label>
<select defaultValue="0">
<option value="0">0 (ví dụ: 1.000)</option>
<option value="2">2 (ví dụ: 1.000,50)</option>
</select>
</div>
<button className="settings-btn settings-btn--primary">

              Lưu định dạng
</button>
</div>

        );

      case "date-format":

        return (
<div className="settings-detail__body">
<h4>Cài đặt định dạng ngày</h4>
<p className="settings-detail__desc">

              Chọn cách hiển thị ngày tháng trên toàn hệ thống.
</p>
<div className="settings-form__group">
<label>Định dạng</label>
<select defaultValue="dd/MM/yyyy">
<option value="dd/MM/yyyy">dd/MM/yyyy (31/12/2025)</option>
<option value="MM/dd/yyyy">MM/dd/yyyy (12/31/2025)</option>
<option value="yyyy-MM-dd">yyyy-MM-dd (2025-12-31)</option>
</select>
</div>
<button className="settings-btn settings-btn--primary">

              Lưu cài đặt ngày
</button>
</div>

        );

      case "language":

        return (
<div className="settings-detail__body">
<h4>Chọn ngôn ngữ hệ thống</h4>
<p className="settings-detail__desc">

              Ngôn ngữ hiển thị cho toàn bộ giao diện ứng dụng.
</p>
<div className="settings-form__group">
<label>Ngôn ngữ</label>
<select defaultValue="vi">
<option value="vi">Tiếng Việt</option>
<option value="en">English</option>
</select>
</div>
<button className="settings-btn settings-btn--primary">

              Lưu ngôn ngữ
</button>
</div>

        );

      case "theme":

        return (
<div className="settings-detail__body">
<h4>Chế độ nền</h4>
<p className="settings-detail__desc">

              Chọn chế độ hiển thị phù hợp với mắt của bạn.
</p>
<div className="settings-radio-row">
<label className="settings-radio">
<input type="radio" name="theme" defaultChecked />
<span>Chế độ sáng</span>
</label>
<label className="settings-radio">
<input type="radio" name="theme" />
<span>Chế độ tối</span>
</label>
<label className="settings-radio">
<input type="radio" name="theme" />
<span>Tự động theo hệ thống</span>
</label>
</div>
<button className="settings-btn settings-btn--primary">

              Lưu chế độ nền
</button>
</div>

        );

      case "backup":
        return (
          <div className="settings-detail__body">
            <h4>Sao lưu & đồng bộ</h4>
            <p className="settings-detail__desc">
              Đảm bảo dữ liệu ví của bạn luôn được an toàn và có thể khôi phục.
            </p>
            <ul className="settings-detail__list">
              <li>Sao lưu thủ công dữ liệu hiện tại.</li>
              <li>Bật đồng bộ tự động với tài khoản của bạn.</li>
            </ul>
            <div
              className="alert alert-info"
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                backgroundColor: "#e7f3ff",
                border: "1px solid #b3d9ff",
                color: "#004085",
                fontSize: "0.875rem",
              }}
            >
              <strong>Lưu ý:</strong> Tính năng sao lưu cloud cần được cấu hình bởi quản trị viên hệ thống. 
              Nếu gặp lỗi khi sao lưu, vui lòng liên hệ hỗ trợ.
            </div>
            <div className="settings-form__actions">
              <button
                className="settings-btn settings-btn--primary"
                onClick={handleTriggerBackup}
                disabled={backupLoading}
              >
                {backupLoading ? "Đang sao lưu..." : "Sao lưu ngay"}
              </button>
              <button
                className={`settings-btn ${autoSyncEnabled ? "settings-btn--primary" : ""}`}
                onClick={handleToggleAutoSync}
              >
                {autoSyncEnabled ? "Tắt đồng bộ tự động" : "Bật đồng bộ tự động"}
              </button>
            </div>

            {/* Lịch sử backup */}
            {backupHistory.length > 0 && (
              <div className="settings-backup-history" style={{ marginTop: "2rem" }}>
                <h5 style={{ marginBottom: "1rem" }}>Lịch sử sao lưu</h5>
                <div className="settings-backup-list">
                  {backupHistory.map((backup) => (
                    <div
                      key={backup.backupId || backup.id}
                      className="settings-backup-item"
                      style={{
                        padding: "0.75rem",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        marginBottom: "0.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "500" }}>
                          {backup.status === "SUCCESS"
                            ? "✅ Sao lưu thành công"
                            : backup.status === "PENDING"
                            ? "⏳ Đang xử lý"
                            : "❌ Sao lưu thất bại"}
                        </div>
                        <small style={{ color: "#666" }}>
                          {backup.createdAt
                            ? formatDateTime(backup.createdAt)
                            : "Không rõ thời gian"}
                        </small>
                      </div>
                      <div>
                        {backup.fileSize && (
                          <span style={{ fontSize: "0.875rem", color: "#666" }}>
                            {(backup.fileSize / 1024).toFixed(2)} KB
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {backupHistoryLoading && (
              <div style={{ textAlign: "center", padding: "1rem", color: "#666" }}>
                Đang tải lịch sử sao lưu...
              </div>
            )}

            {!backupHistoryLoading && backupHistory.length === 0 && (
              <div style={{ textAlign: "center", padding: "1rem", color: "#666" }}>
                Chưa có lịch sử sao lưu
              </div>
            )}
          </div>
        );

      default:

        return null;

    }

  };

  const securityItems = [

    { key: "profile", label: "Chỉnh hồ sơ cá nhân" },

    { key: "password", label: "Đổi mật khẩu" },

    { key: "2fa", label: "Xác thực 2 lớp (2FA)" },

    { key: "login-log", label: "Nhật ký đăng nhập" },

    { key: "logout-all", label: "Đăng xuất tất cả thiết bị" },

  ];

  const systemItems = [

    { key: "currency", label: "Chọn đơn vị tiền tệ" },

    { key: "currency-format", label: "Định dạng tiền tệ" },

    { key: "date-format", label: "Cài đặt định dạng ngày" },

    { key: "language", label: "Chọn ngôn ngữ hệ thống" },

    { key: "theme", label: "Chế độ nền" },

    { key: "backup", label: "Sao lưu & đồng bộ" },

  ];

  return (
    <>
      <div className="settings-page">
        <h1 className="settings-title">Cài đặt</h1>
        <p className="settings-subtitle">
          Quản lý bảo mật và cài đặt hệ thống cho tài khoản của bạn.
        </p>

      {/* ===== PROFILE HEADER NẰM NGOÀI BẢO MẬT ===== */}
<div className="settings-profile-header">
<img

          src={user?.avatar || "https://i.pravatar.cc/150?img=12"}

          alt="avatar"

          className="settings-profile-avatar"

        />
<div className="settings-profile-info">
<h3 className="settings-profile-name">{user?.fullName || "Đang tải..."}</h3>
<p className="settings-profile-email">{user?.email || ""}</p>
</div>
</div>
<div className="settings-list">

        {/* NHÓM: BẢO MẬT */}
<div className="settings-group">
<div className="settings-group__header">Bảo mật</div>

          {securityItems.map((item) => (
<div key={item.key} className="settings-item">
<button

                className={`settings-item__btn ${

                  activeKey === item.key ? "is-active" : ""

                }`}

                onClick={() => toggleItem(item.key)}
>
<span className="settings-item__label">{item.label}</span>
<span className="settings-item__arrow">

                  {activeKey === item.key ? "▲" : "▼"}
</span>
</button>

              {activeKey === item.key && (
<div className="settings-detail">{renderDetail(item.key)}</div>

              )}
</div>

          ))}
</div>

        {/* NHÓM: CÀI ĐẶT HỆ THỐNG */}
<div className="settings-group">
<div className="settings-group__header">Cài đặt hệ thống</div>

          {systemItems.map((item) => (
<div key={item.key} className="settings-item">
<button

                className={`settings-item__btn ${

                  activeKey === item.key ? "is-active" : ""

                }`}

                onClick={() => toggleItem(item.key)}
>
<span className="settings-item__label">{item.label}</span>
<span className="settings-item__arrow">

                  {activeKey === item.key ? "▲" : "▼"}
</span>
</button>

              {activeKey === item.key && (
<div className="settings-detail">{renderDetail(item.key)}</div>

              )}
</div>

          ))}
        </div>
      </div>
      </div>
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </>
  );

}
 