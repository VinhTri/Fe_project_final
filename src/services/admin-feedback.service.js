/**
 * Admin Feedback Service - Service layer cho các API calls liên quan đến quản lý feedback (Admin only)
 * Base URL: http://localhost:8080
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

// Tạo axios instance với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để tự động thêm Authorization header vào mỗi request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Helper function để xử lý response từ axios
 */
const handleAxiosResponse = (axiosResponse) => {
  return {
    data: axiosResponse.data,
    response: {
      ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
    },
  };
};

/**
 * Helper function để xử lý error từ axios
 */
const handleAxiosError = (error) => {
  if (error.response) {
    // Server trả về response với status code lỗi
    return {
      data: error.response.data || { error: error.message },
      response: {
        ok: false,
        status: error.response.status,
        statusText: error.response.statusText,
      },
    };
  } else if (error.request) {
    // Request đã được gửi nhưng không nhận được response
    throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
  } else {
    // Có lỗi khi setup request
    throw new Error(error.message || "Có lỗi xảy ra khi gửi yêu cầu.");
  }
};

/**
 * Admin - Lấy tất cả feedback
 * @param {string|null} status - Lọc theo trạng thái: PENDING, REVIEWED, RESOLVED, CLOSED (optional)
 * @param {string|null} type - Lọc theo loại: FEEDBACK, BUG, FEATURE, OTHER (optional)
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function getAllFeedbacks(status = null, type = null) {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (type) params.append("type", type);
    
    const url = `/admin/feedbacks${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiClient.get(url);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Admin - Lấy chi tiết một feedback
 * @param {number} feedbackId - ID của feedback
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function getFeedbackById(feedbackId) {
  try {
    const response = await apiClient.get(`/admin/feedbacks/${feedbackId}`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Admin - Cập nhật trạng thái feedback
 * @param {number} feedbackId - ID của feedback
 * @param {string} status - Trạng thái mới: PENDING, REVIEWED, RESOLVED, CLOSED
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function updateFeedbackStatus(feedbackId, status) {
  try {
    const response = await apiClient.put(`/admin/feedbacks/${feedbackId}/status`, { status });
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Admin - Thêm phản hồi cho user
 * @param {number} feedbackId - ID của feedback
 * @param {string} adminResponse - Nội dung phản hồi của admin
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function addAdminResponse(feedbackId, adminResponse) {
  try {
    const response = await apiClient.put(`/admin/feedbacks/${feedbackId}/response`, { adminResponse });
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Admin - Lấy thống kê feedback
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function getFeedbackStats() {
  try {
    const response = await apiClient.get("/admin/feedbacks/stats");
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

// Export default object để dễ import
export default {
  getAllFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
  addAdminResponse,
  getFeedbackStats,
};

