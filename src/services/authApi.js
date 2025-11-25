import apiClient from "./apiClient";

// Đăng nhập email / password
export function login(data) {
  return apiClient.post("/api/auth/login", data);
}

// Đăng ký – Bước 1: gửi OTP
export function registerRequestOtp(data) {
  return apiClient.post("/api/auth/register-request-otp", data);
}

// Đăng ký – Bước 2: xác minh OTP
export function verifyRegisterOtp(data) {
  return apiClient.post("/api/auth/verify-register-otp", data);
}

// Quên mật khẩu – Bước 1: gửi OTP
export function forgotPasswordRequest(email) {
  return apiClient.post("/api/auth/forgot-password", { email });
}

// Quên mật khẩu – Bước 2: xác minh OTP → resetToken
export function verifyForgotOtp(data) {
  return apiClient.post("/api/auth/verify-forgot-otp", data);
}

// Quên mật khẩu – Bước 3: đặt mật khẩu mới bằng resetToken
export function resetPassword(data) {
  return apiClient.post("/api/auth/reset-password", data);
}

// Đổi mật khẩu khi đã đăng nhập
export function changePassword(data) {
  return apiClient.post("/api/auth/change-password", data);
}

// Đăng nhập Google
export function loginWithGoogle(data) {
  return apiClient.post("/api/auth/google-login", data);
}

// Đặt mật khẩu lần đầu cho tài khoản Google
export function setFirstPassword(data) {
  return apiClient.post("/api/auth/set-first-password", data);
}
