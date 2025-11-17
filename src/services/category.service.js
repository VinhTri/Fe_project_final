/**
 * Category Service - Service layer cho các API calls liên quan đến category management
 * Base URL: http://localhost:8080/categories
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:8080/categories";

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

// ========================= CREATE CATEGORY =========================

/**
 * ➕ TẠO DANH MỤC MỚI
 * Theo API_DOCUMENTATION.md (dòng 792-823)
 * @param {Object} categoryData - Dữ liệu danh mục
 * @param {string} categoryData.categoryName - Tên danh mục
 * @param {string} [categoryData.description] - Mô tả danh mục (optional)
 * @param {number} categoryData.transactionTypeId - ID loại giao dịch (1: Chi tiêu, 2: Thu nhập)
 * @returns {Promise<Object>} - { categoryId, categoryName, description, transactionType, isSystem } hoặc { error: string }
 */
export const createCategory = async (categoryData) => {
  try {
    console.log("category.service: Calling POST /categories/create với data:", categoryData);
    const response = await apiClient.post("/create", {
      categoryName: categoryData.categoryName,
      description: categoryData.description || null,
      transactionTypeId: categoryData.transactionTypeId,
    });
    console.log("category.service: POST /categories/create response:", {
      status: response.status,
      data: response.data
    });
    return handleAxiosResponse(response);
  } catch (error) {
    console.error("category.service: POST /categories/create error:", error);
    if (error.response) {
      console.error("category.service: Error response:", {
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
      console.error("category.service: No response received:", error.request);
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi tạo danh mục." },
      };
    } else {
      console.error("category.service: Request setup error:", error.message);
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

// ========================= UPDATE CATEGORY =========================

/**
 * ✏️ CẬP NHẬT DANH MỤC
 * Theo API_DOCUMENTATION.md (dòng 827-852)
 * @param {number} categoryId - ID của danh mục
 * @param {Object} updateData - Dữ liệu cập nhật
 * @param {string} updateData.categoryName - Tên danh mục mới
 * @param {string} [updateData.description] - Mô tả danh mục mới (optional)
 * @returns {Promise<Object>} - { categoryId, categoryName, description, transactionType, isSystem } hoặc { error: string }
 */
export const updateCategory = async (categoryId, updateData) => {
  try {
    console.log("category.service: Calling PUT /categories/" + categoryId + " với data:", updateData);
    const response = await apiClient.put(`/${categoryId}`, {
      categoryName: updateData.categoryName,
      description: updateData.description || null,
    });
    console.log("category.service: PUT /categories/" + categoryId + " response:", {
      status: response.status,
      data: response.data
    });
    return handleAxiosResponse(response);
  } catch (error) {
    console.error("category.service: PUT /categories/" + categoryId + " error:", error);
    if (error.response) {
      console.error("category.service: Error response:", {
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
      console.error("category.service: No response received:", error.request);
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi cập nhật danh mục." },
      };
    } else {
      console.error("category.service: Request setup error:", error.message);
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

// ========================= DELETE CATEGORY =========================

/**
 * 🗑️ XÓA DANH MỤC
 * Theo API_DOCUMENTATION.md (dòng 856-869)
 * @param {number} categoryId - ID của danh mục
 * @returns {Promise<Object>} - { message: string } hoặc { error: string }
 */
export const deleteCategory = async (categoryId) => {
  try {
    console.log("category.service: Calling DELETE /categories/" + categoryId);
    const response = await apiClient.delete(`/${categoryId}`);
    console.log("category.service: DELETE /categories/" + categoryId + " response:", {
      status: response.status,
      data: response.data
    });
    return handleAxiosResponse(response);
  } catch (error) {
    console.error("category.service: DELETE /categories/" + categoryId + " error:", error);
    if (error.response) {
      console.error("category.service: Error response:", {
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
      console.error("category.service: No response received:", error.request);
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi xóa danh mục." },
      };
    } else {
      console.error("category.service: Request setup error:", error.message);
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

// ========================= GET ALL CATEGORIES =========================

/**
 * 📋 LẤY DANH SÁCH DANH MỤC
 * Theo API_DOCUMENTATION.md (dòng 873-892)
 * @returns {Promise<Array>} - Array of categories hoặc { error: string }
 */
export const getAllCategories = async () => {
  try {
    console.log("category.service: Calling GET /categories");
    const response = await apiClient.get("");
    console.log("category.service: GET /categories response:", {
      status: response.status,
      data: response.data,
      categoryCount: Array.isArray(response.data) ? response.data.length : 0
    });
    return handleAxiosResponse(response);
  } catch (error) {
    console.error("category.service: GET /categories error:", error);
    if (error.response) {
      console.error("category.service: Error response:", {
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
      console.error("category.service: No response received:", error.request);
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi lấy danh sách danh mục." },
      };
    } else {
      console.error("category.service: Request setup error:", error.message);
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

