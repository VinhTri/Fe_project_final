/**
 * Budget Service - Service layer cho các API calls liên quan đến hạn mức chi tiêu
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
 * Tạo hạn mức chi tiêu mới
 * @param {Object} budgetData - Dữ liệu budget
 * @param {number} budgetData.categoryId - ID danh mục chi tiêu (required)
 * @param {number|null} budgetData.walletId - ID ví (null = áp dụng cho tất cả ví) (optional)
 * @param {number} budgetData.amountLimit - Hạn mức chi tiêu (phải ≥ 1.000 VND) (required)
 * @param {string} budgetData.startDate - Ngày bắt đầu (format: YYYY-MM-DD) (required)
 * @param {string} budgetData.endDate - Ngày kết thúc (format: YYYY-MM-DD) (required)
 * @param {number} [budgetData.warningThreshold] - Ngưỡng cảnh báo (%) - từ 0 đến 100, mặc định 80% (optional)
 * @param {string} [budgetData.note] - Ghi chú (tối đa 255 ký tự) (optional)
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function createBudget(budgetData) {
  try {
    const response = await apiClient.post("/budgets/create", budgetData);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Lấy tất cả hạn mức chi tiêu của user
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function getAllBudgets() {
  try {
    const response = await apiClient.get("/budgets");
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Lấy chi tiết một hạn mức chi tiêu
 * @param {number} budgetId - ID của budget
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function getBudgetById(budgetId) {
  try {
    const response = await apiClient.get(`/budgets/${budgetId}`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Cập nhật hạn mức chi tiêu
 * @param {number} budgetId - ID của budget
 * @param {Object} budgetData - Dữ liệu budget cần cập nhật
 * @param {number|null} [budgetData.walletId] - ID ví (null = áp dụng cho tất cả ví) (optional)
 * @param {number} [budgetData.amountLimit] - Hạn mức chi tiêu (phải ≥ 1.000 VND) (optional)
 * @param {string} [budgetData.startDate] - Ngày bắt đầu (format: YYYY-MM-DD) (optional)
 * @param {string} [budgetData.endDate] - Ngày kết thúc (format: YYYY-MM-DD) (optional)
 * @param {number} [budgetData.warningThreshold] - Ngưỡng cảnh báo (%) - từ 0 đến 100, mặc định 80% (optional)
 * @param {string} [budgetData.note] - Ghi chú (tối đa 255 ký tự) (optional)
 * @returns {Promise<{data: Object, response: Object}>}
 * @note Không thể thay đổi categoryId khi cập nhật
 */
export async function updateBudget(budgetId, budgetData) {
  try {
    const response = await apiClient.put(`/budgets/${budgetId}`, budgetData);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Xóa hạn mức chi tiêu
 * @param {number} budgetId - ID của budget
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function deleteBudget(budgetId) {
  try {
    const response = await apiClient.delete(`/budgets/${budgetId}`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

/**
 * Lấy danh sách giao dịch thuộc một hạn mức chi tiêu
 * @param {number} budgetId - ID của budget
 * @returns {Promise<{data: Object, response: Object}>}
 */
export async function getBudgetTransactions(budgetId) {
  try {
    const response = await apiClient.get(`/budgets/${budgetId}/transactions`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleAxiosError(error);
  }
}

// Export default object để dễ import
export default {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetTransactions,
};

