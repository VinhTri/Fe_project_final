/**
 * Transaction Service - Service layer cho các API calls liên quan đến transaction management
 * Base URL: http://localhost:8080/transactions
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:8080/transactions";

// Tạo axios instance với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Interceptor để tự động thêm Authorization header vào mỗi request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("transaction.service: Added Authorization header");
    } else {
      console.warn("transaction.service: No access token found in localStorage");
    }
    console.log("transaction.service: Request config:", {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      hasAuth: !!config.headers.Authorization
    });
    return config;
  },
  (error) => {
    console.error("transaction.service: Request interceptor error:", error);
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

// ========================= CREATE EXPENSE =========================

/**
 * 💸 TẠO GIAO DỊCH CHI TIÊU
 * @param {Object} expenseData - Dữ liệu giao dịch chi tiêu
 * @param {number} expenseData.walletId - ID của ví
 * @param {number} expenseData.categoryId - ID của danh mục
 * @param {number} expenseData.amount - Số tiền chi tiêu
 * @param {string} expenseData.transactionDate - Ngày giao dịch (ISO format: "2024-01-01T10:00:00")
 * @param {string} [expenseData.note] - Ghi chú (optional)
 * @param {string} [expenseData.imageUrl] - URL hình ảnh (optional)
 * @returns {Promise<Object>} - { message: string, transaction: Object } hoặc { error: string }
 */
export const createExpense = async (expenseData) => {
  try {
    console.log("transaction.service: Calling POST /transactions/expense với data:", expenseData);
    const response = await apiClient.post("/expense", {
      walletId: expenseData.walletId,
      categoryId: expenseData.categoryId,
      amount: expenseData.amount,
      transactionDate: expenseData.transactionDate,
      note: expenseData.note || "",
      imageUrl: expenseData.imageUrl || null,
    });
    console.log("transaction.service: POST /transactions/expense response:", {
      status: response.status,
      data: response.data
    });
    return handleAxiosResponse(response);
  } catch (error) {
    console.error("transaction.service: POST /transactions/expense error:", error);
    console.error("transaction.service: Error details:", {
      message: error.message,
      code: error.code,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
        data: error.config.data
      } : null
    });
    
    if (error.response) {
      console.error("transaction.service: Error response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      console.error("transaction.service: No response received - Network error");
      console.error("transaction.service: Request details:", {
        url: error.config?.url,
        fullURL: error.config?.baseURL + error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        headers: error.config?.headers
      });
      console.error("transaction.service: Request object:", error.request);
      
      // Kiểm tra xem có phải là timeout không
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          response: { ok: false, status: 0 },
          data: { error: "Kết nối quá thời gian chờ. Vui lòng thử lại." },
        };
      }
      
      // Kiểm tra xem có phải là CORS error không
      if (error.message?.includes('CORS') || error.message?.includes('Network Error')) {
        return {
          response: { ok: false, status: 0 },
          data: { error: "Lỗi CORS hoặc mạng. Vui lòng kiểm tra cấu hình backend và đảm bảo backend đang chạy tại http://localhost:8080" },
        };
      }
      
      return {
        response: { ok: false, status: 0 },
        data: { error: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra:\n1. Backend đang chạy tại http://localhost:8080\n2. Kết nối mạng\n3. Cấu hình CORS trên backend" },
      };
    } else {
      console.error("transaction.service: Request setup error:", error.message);
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

// ========================= CREATE INCOME =========================

/**
 * 💰 TẠO GIAO DỊCH THU NHẬP
 * @param {Object} incomeData - Dữ liệu giao dịch thu nhập
 * @param {number} incomeData.walletId - ID của ví
 * @param {number} incomeData.categoryId - ID của danh mục
 * @param {number} incomeData.amount - Số tiền thu nhập
 * @param {string} incomeData.transactionDate - Ngày giao dịch (ISO format: "2024-01-01T10:00:00")
 * @param {string} [incomeData.note] - Ghi chú (optional)
 * @param {string} [incomeData.imageUrl] - URL hình ảnh (optional)
 * @returns {Promise<Object>} - { message: string, transaction: Object } hoặc { error: string }
 */
export const createIncome = async (incomeData) => {
  try {
    console.log("transaction.service: Calling POST /transactions/income với data:", incomeData);
    const response = await apiClient.post("/income", {
      walletId: incomeData.walletId,
      categoryId: incomeData.categoryId,
      amount: incomeData.amount,
      transactionDate: incomeData.transactionDate,
      note: incomeData.note || "",
      imageUrl: incomeData.imageUrl || null,
    });
    console.log("transaction.service: POST /transactions/income response:", {
      status: response.status,
      data: response.data
    });
    return handleAxiosResponse(response);
  } catch (error) {
    console.error("transaction.service: POST /transactions/income error:", error);
    console.error("transaction.service: Error details:", {
      message: error.message,
      code: error.code,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
        data: error.config.data
      } : null
    });
    
    if (error.response) {
      console.error("transaction.service: Error response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      console.error("transaction.service: No response received - Network error");
      console.error("transaction.service: Request details:", {
        url: error.config?.url,
        fullURL: error.config?.baseURL + error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        headers: error.config?.headers
      });
      console.error("transaction.service: Request object:", error.request);
      
      // Kiểm tra xem có phải là timeout không
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          response: { ok: false, status: 0 },
          data: { error: "Kết nối quá thời gian chờ. Vui lòng thử lại." },
        };
      }
      
      // Kiểm tra xem có phải là CORS error không
      if (error.message?.includes('CORS') || error.message?.includes('Network Error')) {
        return {
          response: { ok: false, status: 0 },
          data: { error: "Lỗi CORS hoặc mạng. Vui lòng kiểm tra cấu hình backend và đảm bảo backend đang chạy tại http://localhost:8080" },
        };
      }
      
      return {
        response: { ok: false, status: 0 },
        data: { error: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra:\n1. Backend đang chạy tại http://localhost:8080\n2. Kết nối mạng\n3. Cấu hình CORS trên backend" },
      };
    } else {
      console.error("transaction.service: Request setup error:", error.message);
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

// ========================= GET ALL TRANSACTIONS =========================

/**
 * 📋 LẤY TẤT CẢ GIAO DỊCH
 * @param {Object} [filterData] - Dữ liệu filter (tất cả đều optional)
 * @param {number} [filterData.walletId] - Lọc theo ví cụ thể
 * @param {number} [filterData.typeId] - Lọc theo loại giao dịch (1: Chi tiêu, 2: Thu nhập)
 * @param {string} [filterData.startDate] - Ngày bắt đầu (ISO format: "2024-01-01T00:00:00")
 * @param {string} [filterData.endDate] - Ngày kết thúc (ISO format: "2024-01-31T23:59:59")
 * @returns {Promise<Object>} - { transactions: Array, total: number } hoặc { error: string }
 */
export   const getAllTransactions = async (filterData = {}) => {
  try {
    const params = new URLSearchParams();
    if (filterData.walletId !== undefined && filterData.walletId !== null) {
      params.append('walletId', filterData.walletId);
    }
    if (filterData.typeId !== undefined && filterData.typeId !== null) {
      params.append('typeId', filterData.typeId);
    }
    if (filterData.startDate) {
      params.append('startDate', filterData.startDate);
    }
    if (filterData.endDate) {
      params.append('endDate', filterData.endDate);
    }
    
    const queryString = params.toString();
    const url = queryString ? `?${queryString}` : '';
    
    console.log("transaction.service: Calling GET /transactions" + url, {
      filterData,
      fullUrl: `${API_BASE_URL}${url}`
    });
    const response = await apiClient.get(url);
    console.log("transaction.service: GET /transactions response:", {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      transactionCount: response.data?.transactions?.length || 0,
      total: response.data?.total || 0
    });
    return handleAxiosResponse(response);
  } catch (error) {
    console.error("transaction.service: GET /transactions error:", error);
    if (error.response) {
      console.error("transaction.service: Error response:", {
        status: error.response.status,
        data: error.response.data
      });
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      console.error("transaction.service: No response received:", error.request);
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi lấy danh sách giao dịch." },
      };
    } else {
      console.error("transaction.service: Request setup error:", error.message);
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

// ========================= GET TRANSACTION BY ID =========================

/**
 * 🔍 LẤY CHI TIẾT GIAO DỊCH
 * @param {number} transactionId - ID của giao dịch
 * @returns {Promise<Object>} - { transaction: Object } hoặc { error: string }
 */
export const getTransactionById = async (transactionId) => {
  try {
    console.log("transaction.service: Calling GET /transactions/" + transactionId);
    const response = await apiClient.get(`/${transactionId}`);
    console.log("transaction.service: GET /transactions/" + transactionId + " response:", {
      status: response.status,
      data: response.data
    });
    return handleAxiosResponse(response);
  } catch (error) {
    console.error("transaction.service: GET /transactions/" + transactionId + " error:", error);
    if (error.response) {
      console.error("transaction.service: Error response:", {
        status: error.response.status,
        data: error.response.data
      });
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      console.error("transaction.service: No response received:", error.request);
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi lấy chi tiết giao dịch." },
      };
    } else {
      console.error("transaction.service: Request setup error:", error.message);
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

// ========================= UPDATE TRANSACTION =========================

/**
 * ✏️ CẬP NHẬT GIAO DỊCH
 * @param {number} transactionId - ID của giao dịch
 * @param {Object} updateData - Dữ liệu cập nhật
 * @param {number} [updateData.walletId] - ID của ví (optional)
 * @param {number} [updateData.categoryId] - ID của danh mục (optional)
 * @param {number} [updateData.amount] - Số tiền (optional)
 * @param {string} [updateData.transactionDate] - Ngày giao dịch (ISO format) (optional)
 * @param {string} [updateData.note] - Ghi chú (optional)
 * @param {string} [updateData.imageUrl] - URL hình ảnh (optional)
 * @returns {Promise<Object>} - { message: string, transaction: Object } hoặc { error: string }
 */
export const updateTransaction = async (transactionId, updateData) => {
  try {
    console.log("transaction.service: Calling PUT /transactions/" + transactionId + " với data:", updateData);
    const response = await apiClient.put(`/${transactionId}`, updateData);
    console.log("transaction.service: PUT /transactions/" + transactionId + " response:", {
      status: response.status,
      data: response.data
    });
    return handleAxiosResponse(response);
  } catch (error) {
    console.error("transaction.service: PUT /transactions/" + transactionId + " error:", error);
    if (error.response) {
      console.error("transaction.service: Error response:", {
        status: error.response.status,
        data: error.response.data
      });
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      console.error("transaction.service: No response received:", error.request);
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi cập nhật giao dịch." },
      };
    } else {
      console.error("transaction.service: Request setup error:", error.message);
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

// ========================= DELETE TRANSACTION =========================

/**
 * 🗑️ XÓA GIAO DỊCH
 * @param {number} transactionId - ID của giao dịch
 * @returns {Promise<Object>} - { message: string } hoặc { error: string }
 */
export const deleteTransaction = async (transactionId) => {
  try {
    console.log("transaction.service: Calling DELETE /transactions/" + transactionId);
    const response = await apiClient.delete(`/${transactionId}`);
    console.log("transaction.service: DELETE /transactions/" + transactionId + " response:", {
      status: response.status,
      data: response.data
    });
    return handleAxiosResponse(response);
  } catch (error) {
    console.error("transaction.service: DELETE /transactions/" + transactionId + " error:", error);
    if (error.response) {
      console.error("transaction.service: Error response:", {
        status: error.response.status,
        data: error.response.data
      });
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      console.error("transaction.service: No response received:", error.request);
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi xóa giao dịch." },
      };
    } else {
      console.error("transaction.service: Request setup error:", error.message);
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

// ========================= GET TRANSACTIONS BY WALLET =========================

/**
 * 📋 LẤY GIAO DỊCH THEO VÍ
 * @param {number} walletId - ID của ví
 * @returns {Promise<Object>} - { transactions: Array, total: number, walletId: number } hoặc { error: string }
 */
export const getTransactionsByWallet = async (walletId) => {
  try {
    console.log("transaction.service: Calling GET /transactions/wallet/" + walletId);
    const response = await apiClient.get(`/wallet/${walletId}`);
    console.log("transaction.service: GET /transactions/wallet/" + walletId + " response:", {
      status: response.status,
      data: response.data
    });
    return handleAxiosResponse(response);
  } catch (error) {
    console.error("transaction.service: GET /transactions/wallet/" + walletId + " error:", error);
    if (error.response) {
      console.error("transaction.service: Error response:", {
        status: error.response.status,
        data: error.response.data
      });
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      console.error("transaction.service: No response received:", error.request);
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi lấy giao dịch theo ví." },
      };
    } else {
      console.error("transaction.service: Request setup error:", error.message);
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

