// src/pages/Home/SettingsPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { getProfile, updateProfile, changePassword } from "../../services/profile.service";
import { useLanguage } from "../../home/store/LanguageContext";
import { useTheme } from "../../home/store/ThemeContext";
import Toast from "../../components/common/Toast/Toast";
import {
  loadMoneyFormatSettings,
  saveMoneyFormatSettings,
  MONEY_FORMAT_EVENT,
} from "../../utils/moneyFormatSettings";
import {
  loadDateFormatSettings,
  saveDateFormatSettings,
  DATE_FORMAT_EVENT,
  DATE_FORMAT_OPTIONS,
  formatDateValue,
  DATE_FORMAT_STORAGE_KEY,
} from "../../utils/dateFormatSettings";
import "../../styles/home/SettingsPage.css";

const SAMPLE_DATE_PREVIEW = new Date("2025-12-31T13:45:00");

export default function SettingsPage() {

  const { language, setLanguage, translate } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [activeKey, setActiveKey] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const initialMoneyFormat = loadMoneyFormatSettings();
  const [moneyFormatStyle, setMoneyFormatStyle] = useState(initialMoneyFormat.grouping);
  const [moneyFormatDecimals, setMoneyFormatDecimals] = useState(String(initialMoneyFormat.decimalDigits));
  const [defaultCurrency, setDefaultCurrency] = useState(initialMoneyFormat.defaultCurrency || "VND");
  const initialDateFormat = loadDateFormatSettings();
  const [dateFormatPattern, setDateFormatPattern] = useState(initialDateFormat.pattern);
      useEffect(() => {
        const handleFormatChange = (event) => {
          const next = event?.detail || loadMoneyFormatSettings();
          setMoneyFormatStyle(next.grouping);
          setMoneyFormatDecimals(String(next.decimalDigits));
          setDefaultCurrency(next.defaultCurrency || "VND");
        };

        window.addEventListener(MONEY_FORMAT_EVENT, handleFormatChange);
        window.addEventListener("storage", handleFormatChange);

        return () => {
          window.removeEventListener(MONEY_FORMAT_EVENT, handleFormatChange);
          window.removeEventListener("storage", handleFormatChange);
        };
      }, []);
      useEffect(() => {
        const handleDateFormatChange = (event) => {
          const next = event?.detail || loadDateFormatSettings();
          setDateFormatPattern(next.pattern);
        };

        const handleDateStorage = (event) => {
          if (event?.key && event.key !== DATE_FORMAT_STORAGE_KEY) return;
          setDateFormatPattern(loadDateFormatSettings().pattern);
        };

        window.addEventListener(DATE_FORMAT_EVENT, handleDateFormatChange);
        window.addEventListener("storage", handleDateStorage);

        return () => {
          window.removeEventListener(DATE_FORMAT_EVENT, handleDateFormatChange);
          window.removeEventListener("storage", handleDateStorage);
        };
      }, []);

    const showToast = (message, type = "success") => {
      setToast({ open: true, message, type });
    };

    const closeToast = () => {
      setToast((prev) => ({ ...prev, open: false }));
    };

  // Refs cho các input fields
  const fullNameRef = useRef(null);
  const avatarRef = useRef(null);
  const oldPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Load profile khi component mount
  useEffect(() => {
    if (typeof window === "undefined") return () => {};
    loadProfile();
  }, []);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { response, data } = await getProfile();
      if (response.ok && data.user) {
        setUser(data.user);
      } else {
        setError(data.error || translate("Không thể tải thông tin profile", "Unable to load profile information"));
      }
    } catch (err) {
      setError(translate("Lỗi kết nối khi tải thông tin profile", "Network error while loading profile"));
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
      setError(translate("Vui lòng chọn file ảnh hợp lệ", "Please choose a valid image file"));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(translate("Kích thước ảnh không được vượt quá 5MB", "Image size must be under 5MB"));
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
        setError(translate("Vui lòng nhập tên hoặc chọn ảnh đại diện", "Please enter a name or choose an avatar"));
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
        setSuccess(data.message || translate("Cập nhật profile thành công", "Profile updated successfully"));
        setTimeout(() => setSuccess(""), 3000);
        
      } else {
        // Xử lý lỗi từ API
        setError(data.error || translate("Cập nhật profile thất bại", "Unable to update profile"));
      }
    } catch (err) {
      // Xử lý lỗi mạng hoặc lỗi hệ thống
      setError(translate("Lỗi kết nối khi cập nhật profile", "Network error while updating profile"));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSave = () => {
    setLanguage(selectedLanguage);
    setSuccess(
      translate(
        "Đã cập nhật ngôn ngữ. Nếu giao diện chưa thay đổi, vui lòng tải lại trang.",
        "Language preference saved. Reload the page if you don't see the changes."
      )
    );
    setTimeout(() => setSuccess(""), 3000);
    showToast(
      translate("Đã đổi ngôn ngữ thành công", "Language updated successfully"),
      "success"
    );
  };

  const handleChangePassword = async () => {
    const oldPassword = oldPasswordRef.current?.value;
    const newPassword = newPasswordRef.current?.value;
    const confirmPassword = confirmPasswordRef.current?.value;

    if (!newPassword || !confirmPassword) {
      setError(translate("Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu", "Please enter the new password and confirmation"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(translate("Mật khẩu mới và xác nhận không khớp", "New password and confirmation do not match"));
      return;
    }

    // Nếu user đã có password, bắt buộc phải nhập old password
    if (user?.hasPassword && (!oldPassword || oldPassword.trim() === "")) {
      setError(translate("Vui lòng nhập mật khẩu hiện tại", "Please enter your current password"));
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
          setSuccess(data.message || translate("Đổi mật khẩu thành công", "Password changed successfully"));
        // Clear password fields
        if (oldPasswordRef.current) oldPasswordRef.current.value = "";
        if (newPasswordRef.current) newPasswordRef.current.value = "";
        if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
        // Reload profile để cập nhật hasPassword
        await loadProfile();
        setTimeout(() => setSuccess(""), 3000);
      } else {
          setError(data.error || translate("Đổi mật khẩu thất bại", "Unable to change password"));
      }
    } catch (err) {
        setError(translate("Lỗi kết nối khi đổi mật khẩu", "Network error while changing password"));
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSave = () => {
    setTheme(selectedTheme);
    setSuccess(
      translate(
        "Đã cập nhật chế độ nền. Nếu giao diện chưa thay đổi, vui lòng tải lại trang.",
        "Theme preference saved. Reload the page if you don't see the changes."
      )
    );
    setTimeout(() => setSuccess(""), 3000);
    showToast(
      translate("Đã đổi chế độ nền thành công", "Theme updated successfully"),
      "success"
    );
  };

  const handleFormatSave = () => {
    saveMoneyFormatSettings({
      grouping: moneyFormatStyle,
      decimalDigits: Number(moneyFormatDecimals) || 0,
    });
    const message = translate(
      "Đã cập nhật kiểu hiển thị tiền tệ",
      "Number format updated"
    );
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
    showToast(message, "success");
  };

  const handleCurrencySave = () => {
    saveMoneyFormatSettings({ defaultCurrency });
    const message = translate(
      "Đã lưu cài đặt đơn vị tiền tệ",
      "Currency preference saved"
    );
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
    showToast(message, "success");
  };

  const handleDateFormatSave = () => {
    saveDateFormatSettings({ pattern: dateFormatPattern });
    const message = translate(
      "Đã cập nhật định dạng ngày",
      "Date format updated"
    );
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
    showToast(message, "success");
  };

  const renderDetail = (key) => {

    switch (key) {

      // ====== NHÓM BẢO MẬT ======

      case "profile":

        return (
<div className="settings-detail__body">
<h4>{translate("Chỉnh sửa hồ sơ cá nhân", "Edit personal profile")}</h4>
<p className="settings-detail__desc">

              {translate("Cập nhật ảnh đại diện và tên hiển thị của bạn.", "Update your avatar and display name.")}
</p>
<div className="settings-profile-grid">

              {/* CỘT TRÁI: ĐỔI TÊN */}
<div className="settings-form__group">
<label>{translate("Tên hiển thị", "Display name")}</label>
<input

                  ref={fullNameRef}
                  type="text"

                  defaultValue={user?.fullName || ""}

                  placeholder={translate("Nhập tên muốn hiển thị", "Enter the name to show")}

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

                  {translate("Chọn ảnh", "Choose image")}
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
                  {translate("Đã chọn", "Selected")}: {avatarFile.name}
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

              {loading 
                ? translate("Đang lưu...", "Saving...") 
                : translate("Lưu thay đổi", "Save changes")}
</button>
</div>

        );

      case "password":

        return (
<div className="settings-detail__body">
<h4>{translate("Đổi mật khẩu", "Change password")}</h4>
<p className="settings-detail__desc">
              {user?.hasPassword 
                ? translate("Nên sử dụng mật khẩu mạnh, khó đoán để bảo vệ tài khoản.", "Use a strong, unique password to keep your account safe.")
                : translate("Bạn đang đăng nhập bằng Google. Hãy đặt mật khẩu để có thể đăng nhập bằng email và mật khẩu.", "You currently sign in with Google. Set a password to also log in with email and password.")}
</p>
<div className="settings-form__grid">
{/* Chỉ hiển thị field "Mật khẩu hiện tại" nếu user đã có password */}
{user?.hasPassword && (
<div className="settings-form__group">
<label>{translate("Mật khẩu hiện tại", "Current password")}</label>
<input 
                ref={oldPasswordRef}
                type="password" 
                placeholder={translate("Nhập mật khẩu hiện tại", "Enter your current password")} 
                required
              />
</div>
)}
<div className="settings-form__group">
<label>{translate("Mật khẩu mới", "New password")}</label>
<input 
                ref={newPasswordRef}
                type="password" 
                placeholder={translate("Nhập mật khẩu mới", "Enter a new password")} 
                required
              />
</div>
<div className="settings-form__group">
<label>{translate("Nhập lại mật khẩu mới", "Re-enter new password")}</label>
<input

                  ref={confirmPasswordRef}
                  type="password"

                  placeholder={translate("Nhập lại mật khẩu mới", "Confirm the new password")}
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

              {loading
                ? translate("Đang cập nhật...", "Updating...")
                : user?.hasPassword
                  ? translate("Cập nhật mật khẩu", "Update password")
                  : translate("Đặt mật khẩu", "Set password")}
</button>
</div>

        );

      case "2fa":

        return (
<div className="settings-detail__body">
      <h4>{translate("Xác thực 2 lớp (2FA)", "Two-factor authentication (2FA)")}</h4>
      <p className="settings-detail__desc">

              {translate("Thêm một lớp bảo mật bằng mã xác thực khi đăng nhập.", "Add an extra verification code when signing in.")}
      </p>
<div className="settings-toggle-row">
      <span>{translate("Trạng thái 2FA", "2FA status")}</span>
<label className="settings-switch">
<input type="checkbox" />
<span className="settings-switch__slider" />
</label>
</div>
      <p className="settings-detail__hint">

              {translate("Sau khi bật, mỗi lần đăng nhập bạn sẽ cần nhập thêm mã xác thực gửi qua ứng dụng hoặc email.", "After enabling, each sign-in requires an additional code sent via app or email.")}
      </p>
      <button className="settings-btn settings-btn--primary">

              {translate("Cấu hình 2FA", "Configure 2FA")}
      </button>
</div>

        );

      case "login-log":

        return (
<div className="settings-detail__body">
<h4>{translate("Nhật ký đăng nhập", "Login history")}</h4>
<p className="settings-detail__desc">

              {translate("Kiểm tra các lần đăng nhập gần đây để phát hiện hoạt động bất thường.", "Review recent sign-ins to detect unusual activity.")}
</p>
<div className="settings-table__wrap">
<table className="settings-table">
<thead>
<tr>
<th>{translate("Thời gian", "Time")}</th>
<th>{translate("Thiết bị", "Device")}</th>
<th>{translate("Địa chỉ IP", "IP address")}</th>
<th>{translate("Trạng thái", "Status")}</th>
</tr>
</thead>
<tbody>
<tr>
<td>{translate("Hôm nay, 09:32", "Today, 09:32")}</td>
<td>Chrome • Windows</td>
<td>192.168.1.10</td>
<td>{translate("Thành công", "Successful")}</td>
</tr>
<tr>
<td>{translate("Hôm qua, 21:15", "Yesterday, 21:15")}</td>
<td>Safari • iOS</td>
<td>10.0.0.5</td>
<td>{translate("Thành công", "Successful")}</td>
</tr>
<tr>
<td>{translate("2 ngày trước", "2 days ago")}</td>
<td>{translate("Không xác định", "Unknown")}</td>
<td>203.113.12.45</td>
<td>{translate("Nghi vấn", "Suspicious")}</td>
</tr>
</tbody>
</table>
</div>
</div>

        );

      case "logout-all":

        return (
<div className="settings-detail__body">
      <h4>{translate("Đăng xuất tất cả thiết bị", "Sign out of all devices")}</h4>
      <p className="settings-detail__desc">

              {translate("Tính năng này sẽ đăng xuất tài khoản khỏi tất cả thiết bị đang đăng nhập ngoại trừ thiết bị hiện tại.", "Sign out everywhere except this device.")}
      </p>
<ul className="settings-detail__list">
      <li>{translate("Nên sử dụng khi bạn nghi ngờ tài khoản bị lộ.", "Use this if you suspect your account is compromised.")}</li>
      <li>

          {translate("Sau khi đăng xuất, bạn cần đăng nhập lại bằng mật khẩu hiện tại.", "After signing out, you must log back in with your current password.")}
      </li>
</ul>
<button className="settings-btn settings-btn--danger">

              {translate("Đăng xuất tất cả thiết bị", "Sign out of all devices")}
</button>
</div>

        );

      // ====== NHÓM CÀI ĐẶT HỆ THỐNG ======

      case "currency":

        return (
<div className="settings-detail__body">
<h4>{translate("Chọn đơn vị tiền tệ", "Select currency unit")}</h4>
<p className="settings-detail__desc">

              {translate("Đơn vị tiền tệ mặc định dùng để hiển thị số dư và báo cáo.", "Default currency used for balances and reports.")}
</p>
<div className="settings-form__group">
<label>{translate("Đơn vị tiền tệ mặc định", "Default currency")}</label>
<select 
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
              >
<option value="VND">{translate("VND - Việt Nam Đồng", "VND - Vietnamese Dong")}</option>
<option value="USD">{translate("USD - Đô la Mỹ", "USD - US Dollar")}</option>
</select>
</div>
<p className="settings-form__hint">
  {translate(
    "Tỷ giá cố định: 1 USD ≈ 26.380 VND (chỉ dùng để hiển thị)",
    "Fixed rate: 1 USD ≈ 26,380 VND for display purposes"
  )}
</p>
{error && activeKey === "currency" && <div className="settings-error" style={{color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px'}}>{error}</div>}
{success && activeKey === "currency" && <div className="settings-success" style={{color: 'green', marginBottom: '10px', padding: '10px', backgroundColor: '#e6ffe6', borderRadius: '4px'}}>{success}</div>}
<button 
              className="settings-btn settings-btn--primary"
              onClick={handleCurrencySave}
            >

              {translate("Lưu cài đặt", "Save settings")}
</button>
</div>

        );

      case "currency-format":

        return (
<div className="settings-detail__body">
      <h4>{translate("Định dạng tiền tệ", "Currency format")}</h4>
      <p className="settings-detail__desc">

              {translate("Chọn cách hiển thị số tiền trên ứng dụng.", "Choose how amounts are displayed in the app.")}
      </p>
<div className="settings-form__group">
      <label>{translate("Kiểu hiển thị", "Display style")}</label>
    <select value={moneyFormatStyle} onChange={(e) => setMoneyFormatStyle(e.target.value)}>
    <option value="space">

            {translate("1 234 567 (cách nhau bằng khoảng trắng)", "1 234 567 (spaces as separators)")}
</option>
    <option value="dot">{translate("1.234.567 (dấu chấm)", "1.234.567 (dot separator)")}</option>
    <option value="comma">{translate("1,234,567 (dấu phẩy)", "1,234,567 (comma separator)")}</option>
</select>
</div>
<div className="settings-form__group">
      <label>{translate("Số chữ số thập phân", "Decimal places")}</label>
    <select value={moneyFormatDecimals} onChange={(e) => setMoneyFormatDecimals(e.target.value)}>
      <option value="0">{translate("0 (ví dụ: 1.000)", "0 (e.g. 1,000)")}</option>
      <option value="2">{translate("2 (ví dụ: 1.000,50)", "2 (e.g. 1,000.50)")}</option>
</select>
</div>
    <button type="button" className="settings-btn settings-btn--primary" onClick={handleFormatSave}>

              {translate("Lưu định dạng", "Save format")}
</button>
</div>

        );

      case "date-format":

        return (
<div className="settings-detail__body">
      <h4>{translate("Cài đặt định dạng ngày", "Date format settings")}</h4>
      <p className="settings-detail__desc">

              {translate("Chọn cách hiển thị ngày tháng trên toàn hệ thống.", "Choose how dates appear across the system.")}
      </p>
<div className="settings-form__group">
      <label>{translate("Định dạng", "Format")}</label>
    <select value={dateFormatPattern} onChange={(event) => setDateFormatPattern(event.target.value)}>
      {DATE_FORMAT_OPTIONS.map((pattern) => (
        <option key={pattern} value={pattern}>
          {pattern} ({formatDateValue(SAMPLE_DATE_PREVIEW, { pattern })})
        </option>
      ))}
    </select>
</div>
    <p className="settings-form__hint">
      {translate("Ví dụ", "Example")}: {formatDateValue(SAMPLE_DATE_PREVIEW, { pattern: dateFormatPattern })}
    </p>
    <button className="settings-btn settings-btn--primary" onClick={handleDateFormatSave}>

              {translate("Lưu cài đặt ngày", "Save date settings")}
</button>
</div>

        );

      case "language":

        return (
<div className="settings-detail__body">
      <h4>{translate("Chọn ngôn ngữ hệ thống", "Choose application language")}</h4>
      <p className="settings-detail__desc">

              {translate("Ngôn ngữ hiển thị cho toàn bộ giao diện ứng dụng.", "Language used across the entire interface.")}
      </p>
<div className="settings-form__group">
      <label>{translate("Ngôn ngữ", "Language")}</label>
      <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
      <option value="vi">{translate("Tiếng Việt", "Vietnamese")}</option>
      <option value="en">English</option>
</select>
</div>
<button className="settings-btn settings-btn--primary" onClick={handleLanguageSave}>

        {translate("Lưu ngôn ngữ", "Save language")}
</button>
</div>

        );

      case "theme":

        return (
<div className="settings-detail__body">
      <h4>{translate("Chế độ nền", "Theme mode")}</h4>
      <p className="settings-detail__desc">

          {translate("Chọn chế độ hiển thị phù hợp với mắt của bạn.", "Choose the appearance that fits your eyes.")}
      </p>
    <div className="settings-radio-row">
    <label className="settings-radio">
    <input
        type="radio"
        name="theme"
        value="light"
        checked={selectedTheme === "light"}
        onChange={(event) => setSelectedTheme(event.target.value)}
      />
      <span>{translate("Chế độ sáng", "Light mode")}</span>
    </label>
    <label className="settings-radio">
    <input
        type="radio"
        name="theme"
        value="dark"
        checked={selectedTheme === "dark"}
        onChange={(event) => setSelectedTheme(event.target.value)}
      />
      <span>{translate("Chế độ tối", "Dark mode")}</span>
    </label>
    <label className="settings-radio">
    <input
        type="radio"
        name="theme"
        value="system"
        checked={selectedTheme === "system"}
        onChange={(event) => setSelectedTheme(event.target.value)}
      />
      <span>{translate("Tự động theo hệ thống", "Follow system setting")}</span>
    </label>
    </div>
    <button className="settings-btn settings-btn--primary" onClick={handleThemeSave}>

          {translate("Lưu chế độ nền", "Save theme")}
    </button>
</div>

        );

      case "backup":

        return (
<div className="settings-detail__body">
      <h4>{translate("Sao lưu & đồng bộ", "Backup & sync")}</h4>
      <p className="settings-detail__desc">

              {translate("Đảm bảo dữ liệu ví của bạn luôn được an toàn và có thể khôi phục.", "Keep your wallet data safe and recoverable.")}
      </p>
<ul className="settings-detail__list">
      <li>{translate("Sao lưu thủ công dữ liệu hiện tại.", "Manually back up the current data.")}</li>
      <li>{translate("Bật đồng bộ tự động với tài khoản của bạn.", "Enable automatic sync with your account.")}</li>
</ul>
<div className="settings-form__actions">
<button className="settings-btn settings-btn--primary">

          {translate("Sao lưu ngay", "Back up now")}
</button>
<button className="settings-btn">

          {translate("Bật đồng bộ tự động", "Enable auto sync")}
</button>
</div>
</div>

        );

      default:

        return null;

    }

  };

  const securityItems = [

    { key: "profile", label: translate("Chỉnh hồ sơ cá nhân", "Edit personal info") },

    { key: "password", label: translate("Đổi mật khẩu", "Change password") },

    { key: "2fa", label: translate("Xác thực 2 lớp (2FA)", "Two-factor authentication (2FA)") },

    { key: "login-log", label: translate("Nhật ký đăng nhập", "Login history") },

    { key: "logout-all", label: translate("Đăng xuất tất cả thiết bị", "Sign out of all devices") },

  ];

  const systemItems = [

    { key: "currency", label: translate("Chọn đơn vị tiền tệ", "Select currency unit") },

    { key: "currency-format", label: translate("Định dạng tiền tệ", "Currency format") },

    { key: "date-format", label: translate("Cài đặt định dạng ngày", "Date settings") },

    { key: "language", label: translate("Chọn ngôn ngữ hệ thống", "Choose application language") },

    { key: "theme", label: translate("Chế độ nền", "Theme mode") },

    { key: "backup", label: translate("Sao lưu & đồng bộ", "Backup & sync") },

  ];

  return (
<div className="settings-page">
  <h1 className="settings-title">{translate("Cài đặt", "Settings")}</h1>
  <p className="settings-subtitle">

    {translate("Quản lý bảo mật và cài đặt hệ thống cho tài khoản của bạn.", "Manage security and system preferences for your account.")}
  </p>

      {/* ===== PROFILE HEADER NẰM NGOÀI BẢO MẬT ===== */}
<div className="settings-profile-header">
<img

          src={user?.avatar || "https://i.pravatar.cc/150?img=12"}

          alt="avatar"

          className="settings-profile-avatar"

        />
<div className="settings-profile-info">
<h3 className="settings-profile-name">{user?.fullName || translate("Đang tải...", "Loading...")}</h3>
<p className="settings-profile-email">{user?.email || ""}</p>
</div>
</div>
<div className="settings-list">

        {/* NHÓM: BẢO MẬT */}
<div className="settings-group">
<div className="settings-group__header">{translate("Bảo mật", "Security")}</div>

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
      <div className="settings-group__header">{translate("Cài đặt hệ thống", "System settings")}</div>

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
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </div>

  );

}
 