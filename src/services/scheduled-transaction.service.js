/**
 * Scheduled Transaction Service - Service layer cho các API calls liên quan đến giao dịch định kỳ
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
 * Preview ngày thực hiện tiếp theo (Mini Preview)
 * @param {Object} previewData - Dữ liệu để preview
 * @param {number} previewData.walletId - ID ví (required)
 * @param {number} previewData.transactionTypeId - 1 = Chi tiêu, 2 = Thu nhập (required)
 * @param {number} previewData.categoryId - ID danh mục (required)
 * @param {number} previewData.amount - Số tiền (required)
 * @param {string} previewData.note - Ghi chú (optional)
 * @param {string} previewData.scheduleType - ONCE, DAILY, WEEKLY, MONTHLY, YEARLY (required)
 * @param {string} previewData.startDate - Ngày bắt đầu (format: YYYY-MM-DD) (required)
 * @param {string} previewData.executionTime - Giờ thực hiện (format: HH:mm:ss) (required)
 * @param {string|null} previewData.endDate - Ngày kết thúc (optional)
 * @param {number} previewData.dayOfWeek - Thứ trong tuần (1-7, cho WEEKLY) (optional)
 * @param {number} previewData.dayOfMonth - Ngày trong tháng (1-31, cho MONTHLY) (optional)
 * @param {number} previewData.month - Tháng (1-12, cho YEARLY) (optional)
 * @param {number} previewData.day - Ngày (1-31, cho YEARLY) (optional)
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function previewScheduledTransaction(previewData) {
  try {
    const response = await apiClient.post("/scheduled-transactions/preview", previewData);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Tạo giao dịch đặt lịch
 * @param {Object} scheduleData - Dữ liệu scheduled transaction
 * @param {number} scheduleData.walletId - ID ví (required)
 * @param {number} scheduleData.transactionTypeId - 1 = Chi tiêu, 2 = Thu nhập (required)
 * @param {number} scheduleData.categoryId - ID danh mục (required)
 * @param {number} scheduleData.amount - Số tiền (phải > 0) (required)
 * @param {string} scheduleData.note - Ghi chú (tối đa 500 ký tự) (optional)
 * @param {string} scheduleData.scheduleType - ONCE, DAILY, WEEKLY, MONTHLY, YEARLY (required)
 * @param {string} scheduleData.startDate - Ngày bắt đầu (format: YYYY-MM-DD) (required)
 * @param {string} scheduleData.executionTime - Giờ thực hiện (format: HH:mm:ss) (required)
 * @param {string|null} scheduleData.endDate - Ngày kết thúc (null = không giới hạn) (optional)
 * @param {number} scheduleData.dayOfWeek - Thứ trong tuần (1-7, Monday-Sunday) (required cho WEEKLY)
 * @param {number} scheduleData.dayOfMonth - Ngày trong tháng (1-31) (required cho MONTHLY)
 * @param {number} scheduleData.month - Tháng (1-12) (required cho YEARLY)
 * @param {number} scheduleData.day - Ngày (1-31) (required cho YEARLY)
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function createScheduledTransaction(scheduleData) {
  try {
    const response = await apiClient.post("/scheduled-transactions/create", scheduleData);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Lấy tất cả giao dịch đặt lịch của user
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function getAllScheduledTransactions() {
  try {
    const response = await apiClient.get("/scheduled-transactions");
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Lấy chi tiết một giao dịch đặt lịch
 * @param {number} scheduleId - ID của scheduled transaction
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function getScheduledTransactionById(scheduleId) {
  try {
    const response = await apiClient.get(`/scheduled-transactions/${scheduleId}`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Hủy giao dịch đặt lịch (đổi status thành CANCELLED, không xóa)
 * @param {number} scheduleId - ID của scheduled transaction
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function cancelScheduledTransaction(scheduleId) {
  try {
    const response = await apiClient.put(`/scheduled-transactions/${scheduleId}/cancel`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Xóa giao dịch đặt lịch (xóa hoàn toàn khỏi database)
 * @param {number} scheduleId - ID của scheduled transaction
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function deleteScheduledTransaction(scheduleId) {
  try {
    const response = await apiClient.delete(`/scheduled-transactions/${scheduleId}`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

// Export default object để dễ import
export default {
  previewScheduledTransaction,
  createScheduledTransaction,
  getAllScheduledTransactions,
  getScheduledTransactionById,
  cancelScheduledTransaction,
  deleteScheduledTransaction,
};

