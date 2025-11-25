/**
 * Backup Service - Service layer cho các API calls liên quan đến sao lưu và đồng bộ
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
 * Kích hoạt backup thủ công
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function triggerBackup() {
  try {
    const response = await apiClient.post("/backups/trigger");
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Lấy lịch sử backup
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function getBackupHistory() {
  try {
    const response = await apiClient.get("/backups/history");
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

// Export default object để dễ import
export default {
  triggerBackup,
  getBackupHistory,
};

