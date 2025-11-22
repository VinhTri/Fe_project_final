// src/services/userApi.js
import apiClient from "./apiClient";

/**
 * ================== GET PROFILE ==================
 * Lấy profile người dùng hiện tại (dựa trên JWT)
 * BE trả về UserResponse
 */
export function getMyProfile() {
  return apiClient.get("/users/me");
}

/**
 * ================== UPDATE PROFILE ==================
 * Cập nhật tên & avatar (base64 hoặc URL)
 * data: { fullName?, avatar? }
 */
export function updateMyProfile(data) {
  return apiClient.put("/users/me", data);
}

/**
 * ================== SET PASSWORD FIRST TIME (GOOGLE) ==================
 *
 * Dành cho tài khoản Google chưa từng đặt mật khẩu local.
 * FE gửi: { newPassword }
 *
 * ⚠ Không cần confirmPassword BE đã kiểm tra tại FE.
 * ⚠ Không nên gửi confirmPassword vì:
 *      - BE không dùng
 *      - FE logic confirm đã xử lý trước
 * 
 * Đường dẫn chuẩn BE đã dùng trong các chat trước:
 *    POST /auth/set-first-password
 *
 * Nhưng bạn đang để:
 *    POST /users/me/set-password-first-time
 * 
 * 👉 Bạn phải chọn 1 trong 2:
 *    - Nếu BE theo "/auth/set-first-password" → sửa lại FE
 *    - Nếu BE theo "/users/me/set-password-first-time" → giữ nguyên
 *
 * Tôi chỉnh theo code bạn gửi hiện tại:
 */
export function setInitialPassword(data) {
  // data = { newPassword }
  return apiClient.post("/users/me/set-password-first-time", data);
}
