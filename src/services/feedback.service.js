/**
 * Feedback Service - Service layer cho các API calls liên quan đến feedback
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
 * @param {Object} axiosResponse - Response object từ axios
 * @returns {Object} - { data, response } với format tương tự fetch để component có thể check response.status
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
 * 📝 GỬI PHẢN HỒI/BÁO LỖI
 * @param {Object} feedbackData - Dữ liệu feedback
 * @param {string} feedbackData.type - Loại phản hồi: "FEEDBACK", "BUG", "FEATURE", "OTHER"
 * @param {string} feedbackData.subject - Tiêu đề phản hồi (tối đa 200 ký tự)
 * @param {string} feedbackData.message - Nội dung phản hồi (tối đa 5000 ký tự)
 * @param {string} [feedbackData.contactEmail] - Email để liên hệ lại (optional)
 * @returns {Promise<Object>} - { message: string, feedback: Object } hoặc { error: string }
 */
export const createFeedback = async (feedbackData) => {
  try {
    const response = await apiClient.post("/feedback", {
      type: feedbackData.type,
      subject: feedbackData.subject,
      message: feedbackData.message,
      contactEmail: feedbackData.contactEmail || null,
    });
    return handleAxiosResponse(response);
  } catch (error) {
    if (error.response) {
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi gửi phản hồi." },
      };
    } else {
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

/**
 * 📋 LẤY DANH SÁCH PHẢN HỒI CỦA USER
 * @returns {Promise<Object>} - { feedbacks: Array, total: number } hoặc { error: string }
 */
export const getUserFeedbacks = async () => {
  try {
    const response = await apiClient.get("/feedback");
    return handleAxiosResponse(response);
  } catch (error) {
    if (error.response) {
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi lấy danh sách phản hồi." },
      };
    } else {
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

/**
 * 🔍 LẤY CHI TIẾT MỘT PHẢN HỒI
 * @param {number} feedbackId - ID của feedback
 * @returns {Promise<Object>} - { feedback: Object } hoặc { error: string }
 */
export const getFeedbackDetails = async (feedbackId) => {
  try {
    const response = await apiClient.get(`/feedback/${feedbackId}`);
    return handleAxiosResponse(response);
  } catch (error) {
    if (error.response) {
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi lấy chi tiết phản hồi." },
      };
    } else {
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

// Export API_BASE_URL để các component khác có thể sử dụng nếu cần
export { API_BASE_URL };

