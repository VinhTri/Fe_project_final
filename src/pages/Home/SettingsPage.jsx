// src/pages/Home/SettingsPage.jsx

import React, { useState, useEffect, useRef } from "react";
import "../../styles/home/SettingsPage.css";

// ✅ API
import { getMyProfile, updateMyProfile } from "../../services/userApi";
import { changePassword, setFirstPassword } from "../../services/authApi";

export default function SettingsPage() {
  const [activeKey, setActiveKey] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Refs
  const fullNameRef = useRef(null);
  const avatarRef = useRef(null);
  const oldPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // --- PASSWORD STATES ---
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");

  // --- ACCOUNT TYPE ---
  // Tài khoản Google + firstLogin = true -> đặt mật khẩu lần đầu
  const isGoogleFirstPassword =
    user?.googleAccount && user?.firstLogin === true;

  // --- PASSWORD STRENGTH ---
  const evaluatePasswordStrength = (pwd) => {
    if (!pwd) return "";

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return "Yếu";
    if (score === 2) return "Trung bình";
    return "Mạnh";
  };

  const handleNewPasswordInput = (e) => {
    const value = e.target.value;
    setNewPasswordValue(value);
    setPasswordStrength(evaluatePasswordStrength(value));
  };

  // Load profile khi mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getMyProfile();
      setUser(res.data);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Không thể tải thông tin profile";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (key) => {
    setActiveKey((prev) => (prev === key ? null : key));
    setError("");
    setSuccess("");
    if (key !== "profile") {
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setAvatarFile(file);
    setError("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    const fullName = fullNameRef.current?.value?.trim();
    const avatar = avatarFile ? avatarPreview : user?.avatar;

    if (!fullName && !avatarFile && !user?.fullName) {
      setError("Vui lòng nhập tên hoặc chọn ảnh đại diện");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await updateMyProfile({
        fullName: fullName || undefined,
        avatar: avatar || undefined,
      });

      const updatedUser = res.data;
      setUser(updatedUser);

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("storageUpdated"));
      }, 0);

      setAvatarPreview(null);
      setAvatarFile(null);
      if (avatarRef.current) avatarRef.current.value = "";

      setSuccess("Cập nhật profile thành công");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Cập nhật profile thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

const handleChangePassword = async () => {
  const oldPassword = oldPasswordRef.current?.value || "";
  const newPassword = newPasswordRef.current?.value || "";
  const confirmPassword = confirmPasswordRef.current?.value || "";

  setError("");
  setSuccess("");

  if (!newPassword || !confirmPassword) {
    setError("Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu");
    return;
  }

  if (newPassword !== confirmPassword) {
    setError("Mật khẩu mới và xác nhận không khớp");
    return;
  }

  if (!isGoogleFirstPassword && !oldPassword) {
    setError("Vui lòng nhập mật khẩu hiện tại");
    return;
  }

  try {
    setLoading(true);

    if (isGoogleFirstPassword) {
      // 🔐 Tài khoản Google lần đầu → chỉ cần newPassword
      await setFirstPassword({ newPassword });
      setSuccess("Thiết lập mật khẩu lần đầu thành công");

      // 👉 Sau khi đặt xong, cập nhật lại user để isGoogleFirstPassword = false
      setUser((prev) =>
        prev ? { ...prev, firstLogin: false } : prev
      );
    } else {
      // 🔐 Tài khoản thường → cần oldPassword + newPassword
      await changePassword({
        oldPassword,
        newPassword,
      });
      setSuccess("Đổi mật khẩu thành công");
    }

    if (oldPasswordRef.current) oldPasswordRef.current.value = "";
    if (newPasswordRef.current) newPasswordRef.current.value = "";
    if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
    setNewPasswordValue("");
    setPasswordStrength("");

    setTimeout(() => setSuccess(""), 3000);
  } catch (err) {
    console.error(err);
    const msg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      (isGoogleFirstPassword
        ? "Đặt mật khẩu lần đầu thất bại"
        : "Đổi mật khẩu thất bại");
    setError(msg);
  } finally {
    setLoading(false);
  }
};

  const renderDetail = (key) => {
    switch (key) {
      case "profile":
        return (
          <div className="settings-detail__body">
            <h4>Chỉnh sửa hồ sơ cá nhân</h4>
            <p className="settings-detail__desc">
              Cập nhật ảnh đại diện và tên hiển thị của bạn.
            </p>
            <div className="settings-profile-grid">
              <div className="settings-form__group">
                <label>Tên hiển thị</label>
                <input
                  ref={fullNameRef}
                  type="text"
                  defaultValue={user?.fullName || ""}
                  placeholder="Nhập tên muốn hiển thị"
                />
              </div>

              <div className="settings-avatar-upload">
                <img
                  src={
                    avatarPreview ||
                    user?.avatar ||
                    "https://i.pravatar.cc/150?img=12"
                  }
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
                    style={{ display: "none" }}
                  />
                </label>
                {avatarFile && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "5px",
                    }}
                  >
                    Đã chọn: {avatarFile.name}
                  </p>
                )}
              </div>
            </div>
            {error && activeKey === "profile" && (
              <div
                className="settings-error"
                style={{
                  color: "red",
                  marginBottom: "10px",
                  padding: "10px",
                  backgroundColor: "#ffe6e6",
                  borderRadius: "4px",
                }}
              >
                {error}
              </div>
            )}
            {success && activeKey === "profile" && (
              <div
                className="settings-success"
                style={{
                  color: "green",
                  marginBottom: "10px",
                  padding: "10px",
                  backgroundColor: "#e6ffe6",
                  borderRadius: "4px",
                }}
              >
                {success}
              </div>
            )}
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
            <h4>
              {isGoogleFirstPassword ? "Đặt mật khẩu lần đầu" : "Đổi mật khẩu"}
            </h4>
            <p className="settings-detail__desc">
              {isGoogleFirstPassword ? (
                <>
                  Bạn đang đăng nhập bằng tài khoản Google. Hãy thiết lập mật
                  khẩu lần đầu để có thể đăng nhập bằng email + mật khẩu sau
                  này.
                </>
              ) : (
                <>Nên sử dụng mật khẩu mạnh, khó đoán để bảo vệ tài khoản.</>
              )}
            </p>

            <div className="settings-form__grid">
              {/* Mật khẩu hiện tại: chỉ hiện nếu không phải Google lần đầu */}
              {!isGoogleFirstPassword && (
                <div className="settings-form__group">
                  <label>Mật khẩu hiện tại</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      ref={oldPasswordRef}
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu hiện tại"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword((prev) => !prev)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      <i
                        className={
                          showOldPassword ? "bi bi-eye-slash" : "bi bi-eye"
                        }
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Mật khẩu mới */}
              <div className="settings-form__group">
                <label>Mật khẩu mới</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <input
                    ref={newPasswordRef}
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    style={{ flex: 1 }}
                    value={newPasswordValue}
                    onChange={handleNewPasswordInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <i
                      className={
                        showNewPassword ? "bi bi-eye-slash" : "bi bi-eye"
                      }
                    />
                  </button>
                </div>
                {passwordStrength && (
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "12px",
                      color:
                        passwordStrength === "Yếu"
                          ? "#dc2626"
                          : passwordStrength === "Trung bình"
                          ? "#d97706"
                          : "#16a34a",
                    }}
                  >
                    Độ mạnh mật khẩu: <b>{passwordStrength}</b>
                  </div>
                )}
              </div>

              {/* Nhập lại mật khẩu mới */}
              <div className="settings-form__group">
                <label>Nhập lại mật khẩu mới</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <input
                    ref={confirmPasswordRef}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <i
                      className={
                        showConfirmPassword ? "bi bi-eye-slash" : "bi bi-eye"
                      }
                    />
                  </button>
                </div>
              </div>
            </div>

            {error && activeKey === "password" && (
              <div
                className="settings-error"
                style={{
                  color: "red",
                  marginBottom: "10px",
                  padding: "10px",
                  backgroundColor: "#ffe6e6",
                  borderRadius: "4px",
                }}
              >
                {error}
              </div>
            )}

            {success && activeKey === "password" && (
              <div
                className="settings-success"
                style={{
                  color: "green",
                  marginBottom: "10px",
                  padding: "10px",
                  backgroundColor: "#e6ffe6",
                  borderRadius: "4px",
                }}
              >
                {success}
              </div>
            )}

            <button
              className="settings-btn settings-btn--primary"
              onClick={handleChangePassword}
              disabled={loading}
            >
              {loading
                ? isGoogleFirstPassword
                  ? "Đang thiết lập..."
                  : "Đang cập nhật..."
                : isGoogleFirstPassword
                ? "Đặt mật khẩu"
                : "Cập nhật mật khẩu"}
            </button>
          </div>
        );

      // ====== NHÓM BẢO MẬT KHÁC ======
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
                  <tr>
                    <td>Hôm nay, 09:32</td>
                    <td>Chrome • Windows</td>
                    <td>192.168.1.10</td>
                    <td>Thành công</td>
                  </tr>
                  <tr>
                    <td>Hôm qua, 21:15</td>
                    <td>Safari • iOS</td>
                    <td>10.0.0.5</td>
                    <td>Thành công</td>
                  </tr>
                  <tr>
                    <td>2 ngày trước</td>
                    <td>Không xác định</td>
                    <td>203.113.12.45</td>
                    <td>Nghi vấn</td>
                  </tr>
                </tbody>
              </table>
            </div>
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

      // ====== CÀI ĐẶT HỆ THỐNG ======
      case "currency":
        return (
          <div className="settings-detail__body">
            <h4>Chọn đơn vị tiền tệ</h4>
            <p className="settings-detail__desc">
              Đơn vị tiền tệ mặc định dùng để hiển thị số dư và báo cáo.
            </p>
            <div className="settings-form__group">
              <label>Đơn vị tiền tệ mặc định</label>
              <select defaultValue="VND">
                <option value="VND">VND - Việt Nam Đồng</option>
                <option value="USD">USD - Đô la Mỹ</option>
                <option value="EUR">EUR - Euro</option>
                <option value="JPY">JPY - Yên Nhật</option>
              </select>
            </div>
            <button className="settings-btn settings-btn--primary">
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
            <div className="settings-form__actions">
              <button className="settings-btn settings-btn--primary">
                Sao lưu ngay
              </button>
              <button className="settings-btn">
                Bật đồng bộ tự động
              </button>
            </div>
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
    <div className="settings-page">
      <h1 className="settings-title">Cài đặt</h1>
      <p className="settings-subtitle">
        Quản lý bảo mật và cài đặt hệ thống cho tài khoản của bạn.
      </p>

      <div className="settings-profile-header">
        <img
          src={user?.avatar || "https://i.pravatar.cc/150?img=12"}
          alt="avatar"
          className="settings-profile-avatar"
        />
        <div className="settings-profile-info">
          <h3 className="settings-profile-name">
            {user?.fullName || (loading ? "Đang tải..." : "Chưa có tên")}
          </h3>
          <p className="settings-profile-email">{user?.email || ""}</p>
        </div>
      </div>

      <div className="settings-list">
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
                <div className="settings-detail">
                  {renderDetail(item.key)}
                </div>
              )}
            </div>
          ))}
        </div>

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
                <div className="settings-detail">
                  {renderDetail(item.key)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
