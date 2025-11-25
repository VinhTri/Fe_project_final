import apiClient from "./apiClient";

// Lấy profile user hiện tại
export function getMyProfile() {
  return apiClient.get("/api/users/me");
}

// Cập nhật profile (tên + avatar)
export function updateMyProfile(data) {
  return apiClient.put("/api/users/me", data);
}
