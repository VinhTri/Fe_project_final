/**
 * Fund Service - Service layer cho các API calls liên quan đến quỹ tiết kiệm
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
 * 📝 TẠO QUỸ MỚI
 * @param {Object} fundData - Dữ liệu quỹ
 * @returns {Promise<Object>} - { message: string, fund: Object } hoặc { error: string }
 */
export const createFund = async (fundData) => {
  try {
    const response = await apiClient.post("/funds", fundData);
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
        data: { error: "Lỗi kết nối đến máy chủ khi tạo quỹ." },
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
 * 📋 LẤY TẤT CẢ QUỸ CỦA USER
 * @returns {Promise<Object>} - { funds: Array, total: number } hoặc { error: string }
 */
export const getAllFunds = async () => {
  try {
    const response = await apiClient.get("/funds");
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
        data: { error: "Lỗi kết nối đến máy chủ khi lấy danh sách quỹ." },
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
 * 📋 LẤY QUỸ CÁ NHÂN
 * @param {boolean|null} hasDeadline - true = có kỳ hạn, false = không kỳ hạn, null = tất cả
 * @returns {Promise<Object>} - { funds: Array, total: number } hoặc { error: string }
 */
export const getPersonalFunds = async (hasDeadline = null) => {
  try {
    const params = hasDeadline !== null ? `?hasDeadline=${hasDeadline}` : "";
    const response = await apiClient.get(`/funds/personal${params}`);
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
        data: { error: "Lỗi kết nối đến máy chủ khi lấy quỹ cá nhân." },
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
 * 📋 LẤY QUỸ NHÓM
 * @param {boolean|null} hasDeadline - true = có kỳ hạn, false = không kỳ hạn, null = tất cả
 * @returns {Promise<Object>} - { funds: Array, total: number } hoặc { error: string }
 */
export const getGroupFunds = async (hasDeadline = null) => {
  try {
    const params = hasDeadline !== null ? `?hasDeadline=${hasDeadline}` : "";
    const response = await apiClient.get(`/funds/group${params}`);
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
        data: { error: "Lỗi kết nối đến máy chủ khi lấy quỹ nhóm." },
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
 * 📋 LẤY QUỸ THAM GIA (KHÔNG PHẢI CHỦ QUỸ)
 * @returns {Promise<Object>} - { funds: Array, total: number } hoặc { error: string }
 */
export const getParticipatedFunds = async () => {
  try {
    const response = await apiClient.get("/funds/participated");
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
        data: { error: "Lỗi kết nối đến máy chủ khi lấy quỹ tham gia." },
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
 * 🔍 LẤY CHI TIẾT MỘT QUỸ
 * @param {number} fundId - ID của quỹ
 * @returns {Promise<Object>} - { fund: Object } hoặc { error: string }
 */
export const getFundDetails = async (fundId) => {
  try {
    const response = await apiClient.get(`/funds/${fundId}`);
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
        data: { error: "Lỗi kết nối đến máy chủ khi lấy chi tiết quỹ." },
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
 * ✏️ CẬP NHẬT QUỸ
 * @param {number} fundId - ID của quỹ
 * @param {Object} fundData - Dữ liệu cập nhật
 * @returns {Promise<Object>} - { message: string, fund: Object } hoặc { error: string }
 */
export const updateFund = async (fundId, fundData) => {
  try {
    const response = await apiClient.put(`/funds/${fundId}`, fundData);
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
        data: { error: "Lỗi kết nối đến máy chủ khi cập nhật quỹ." },
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
 * 🗑️ XÓA QUỸ
 * @param {number} fundId - ID của quỹ
 * @returns {Promise<Object>} - { message: string } hoặc { error: string }
 */
export const deleteFund = async (fundId) => {
  try {
    const response = await apiClient.delete(`/funds/${fundId}`);
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
        data: { error: "Lỗi kết nối đến máy chủ khi xóa quỹ." },
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
 * 🔒 ĐÓNG QUỸ
 * @param {number} fundId - ID của quỹ
 * @returns {Promise<Object>} - { message: string } hoặc { error: string }
 */
export const closeFund = async (fundId) => {
  try {
    const response = await apiClient.put(`/funds/${fundId}/close`);
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
        data: { error: "Lỗi kết nối đến máy chủ khi đóng quỹ." },
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
 * 💰 NẠP TIỀN VÀO QUỸ
 * @param {number} fundId - ID của quỹ
 * @param {number} amount - Số tiền nạp
 * @returns {Promise<Object>} - { message: string, fund: Object } hoặc { error: string }
 */
export const depositToFund = async (fundId, amount) => {
  try {
    const response = await apiClient.post(`/funds/${fundId}/deposit`, { amount });
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
        data: { error: "Lỗi kết nối đến máy chủ khi nạp tiền vào quỹ." },
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
 * 💸 RÚT TIỀN TỪ QUỸ (CHỈ CHO QUỸ KHÔNG KỲ HẠN)
 * @param {number} fundId - ID của quỹ
 * @param {number} amount - Số tiền rút
 * @returns {Promise<Object>} - { message: string, fund: Object } hoặc { error: string }
 */
export const withdrawFromFund = async (fundId, amount) => {
  try {
    const response = await apiClient.post(`/funds/${fundId}/withdraw`, { amount });
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
        data: { error: "Lỗi kết nối đến máy chủ khi rút tiền từ quỹ." },
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
 * 🔍 KIỂM TRA VÍ CÓ ĐANG ĐƯỢC SỬ DỤNG
 * @param {number} walletId - ID của ví
 * @returns {Promise<Object>} - { isUsed: boolean } hoặc { error: string }
 */
export const checkWalletUsed = async (walletId) => {
  try {
    const response = await apiClient.get(`/funds/check-wallet/${walletId}`);
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
        data: { error: "Lỗi kết nối đến máy chủ khi kiểm tra ví." },
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

