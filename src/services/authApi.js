// src/services/authApi.js
import apiClient from "./apiClient";

/**
 * ================== ĐĂNG NHẬP (email / password) ==================
 */
export function login(data) {
  // data = { email, password }
  return apiClient.post("/auth/login", data);
}

/**
 * ================== ĐĂNG KÝ (FLOW MỚI – OTP) ==================
 *
 * Step 1: registerRequestOtp
 *   FE gửi: { fullName, email, password }
 *   BE:
 *     - validate
 *     - lưu tạm (pending) + tạo OTP
 *     - gửi mail OTP
 *
 * Step 2: verifyRegisterOtp
 *   FE gửi: { email, otp, password, fullName }
 *   BE:
 *     - check OTP
 *     - tạo user thật + gán ROLE_USER
 *     - trả về thông tin user / token (tuỳ thiết kế)
 */

// Bước 1 — Gửi OTP đăng ký
export function registerRequestOtp(data) {
  // data = { fullName, email, password }
  return apiClient.post("/auth/register-request-otp", data);
}

// Bước 2 — Xác minh OTP + tạo tài khoản
export function verifyRegisterOtp(data) {
  // data = { email, otp, password, fullName }
  return apiClient.post("/auth/verify-register-otp", data);
}

/**
 * Nếu cần gửi lại OTP đăng ký:
 *  - FE chỉ cần gọi lại registerRequestOtp(form) với form đang nhập
 *  => Không cần hàm resendRegisterOtp riêng.
 */

/**
 * ================== QUÊN MẬT KHẨU (OTP) ==================
 *
 * Flow:
 * 1. forgotPasswordRequest(email)
 *    - Gửi OTP về email nếu user tồn tại
 *
 * 2. verifyForgotOtp({ email, otp })
 *    - Nếu đúng OTP → BE trả về resetToken
 *
 * 3. resetPassword({ resetToken, newPassword })
 *    - BE dùng resetToken xác định user và set mật khẩu mới
 */

// Bước 1 — gửi OTP quên mật khẩu
export function forgotPasswordRequest(email) {
  // email: string
  return apiClient.post("/auth/forgot-password", { email });
}

// Bước 2 — xác nhận OTP, nhận resetToken
export function verifyForgotOtp(data) {
  // data = { email, otp }
  return apiClient.post("/auth/verify-forgot-otp", data);
}

// Bước 3 — đổi mật khẩu bằng resetToken
export function resetPassword(data) {
  // data = { resetToken, newPassword }
  return apiClient.post("/auth/reset-password", data);
}

/**
 * ================== ĐỔI MẬT KHẨU KHI ĐÃ ĐĂNG NHẬP ==================
 *
 * Áp dụng cho tài khoản đã có mật khẩu (local / google đã set password).
 * - FE gửi: { oldPassword, newPassword }
 * - BE:
 *    + check oldPassword (BCrypt)
 *    + set newPassword
 */
export function changePassword(data) {
  // data = { oldPassword, newPassword }
  return apiClient.post("/auth/change-password", data);
}

/**
 * ================== ĐĂNG NHẬP GOOGLE ==================
 *
 * FE đã lấy được idToken (Google) → gửi lên BE.
 * BE:
 *  - verify idToken với Google
 *  - tạo / update user trong DB
 *  - trả về JWT + userInfo
 */
export function loginWithGoogle(data) {
  // data = { idToken }
  return apiClient.post("/auth/google-login", data);
}

/**
 * ================== ĐẶT MẬT KHẨU LẦN ĐẦU (TÀI KHOẢN GOOGLE) ==================
 *
 * Dùng cho user đăng nhập bằng Google lần đầu, chưa có mật khẩu local:
 *   - FE hiển thị form "Đặt mật khẩu lần đầu" (không hỏi oldPassword)
 *   - FE gửi: { newPassword } kèm JWT trên header
 *   - BE:
 *       + kiểm tra user là GOOGLE và passwordInitialized=false
 *       + set mật khẩu (BCrypt)
 *       + gán passwordInitialized=true
 */
export function setFirstPassword(data) {
  // data = { newPassword }
  return apiClient.post("/auth/set-first-password", data);
}
