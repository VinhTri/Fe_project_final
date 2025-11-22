// src/services/adminUserApi.js
import apiClient from "./apiClient";

/**
 * Lấy danh sách tất cả user (chỉ ADMIN)
 */
export function getAllUsers() {
  return apiClient.get("/admin/users");
}

/**
 * Khóa user
 */
export function lockUser(userId) {
  return apiClient.post(`/admin/users/${userId}/lock`);
}

/**
 * Mở khóa user
 */
export function unlockUser(userId) {
  return apiClient.post(`/admin/users/${userId}/unlock`);
}

/**
 * Đổi role USER <-> ADMIN
 * data: { role: "USER" | "ADMIN" }
 */
export function changeUserRole(userId, data) {
  return apiClient.post(`/admin/users/${userId}/role`, data);
}

/**
 * Lấy log thao tác admin
 */
export function getAdminLogs() {
  return apiClient.get("/admin/users/logs");
}
