// src/services/adminUserApi.js
import apiClient from "./apiClient";

/**
 * Lấy danh sách tất cả user (Admin)
 * GET /api/admin/users
 */
export function getAdminUsers() {
  return apiClient.get("/admin/users");
}

/**
 * Lấy chi tiết 1 user (nếu cần xài sau)
 * GET /api/admin/users/{id}/detail
 */
export function getUserDetail(id) {
  return apiClient.get(`/admin/users/${id}/detail`);
}

/**
 * Đổi role USER <-> ADMIN
 * POST /api/admin/users/{id}/role
 * body: { role: "USER" | "ADMIN" }
 */
export function changeUserRole(id, role) {
  return apiClient.post(`/admin/users/${id}/role`, { role });
}

/**
 * Khóa tài khoản
 * POST /api/admin/users/{id}/lock
 */
export function lockUser(id) {
  return apiClient.post(`/admin/users/${id}/lock`);
}

/**
 * Mở khóa tài khoản
 * POST /api/admin/users/{id}/unlock
 */
export function unlockUser(id) {
  return apiClient.post(`/admin/users/${id}/unlock`);
}

/**
 * Xoá tài khoản
 * DELETE /api/admin/users/{id}
 */
export function deleteUserApi(id) {
  return apiClient.delete(`/admin/users/${id}`);
}

/**
 * Lấy login logs của 1 user
 * GET /api/admin/users/{id}/login-logs
 */
export function getUserLoginLogs(id) {
  return apiClient.get(`/admin/users/${id}/login-logs`);
}
