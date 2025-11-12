// ========================================
// 📋 CATEGORY SERVICE
// ========================================
import api from '../api/axiosConfig';

export const categoryService = {
  /**
   * Lấy tất cả danh mục (expense + income)
   * @returns {Promise<Object>} - {categories: CategoryDTO[], total}
   */
  getAllCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  /**
   * Lấy danh mục theo loại (expense hoặc income)
   * @param {string} type - "expense" hoặc "income"
   * @returns {Promise<Object>} - {categories: CategoryDTO[], total}
   */
  getCategoriesByType: async (type) => {
    const response = await api.get(`/categories/${type}`);
    return response.data;
  },

  /**
   * Lấy chi tiết 1 danh mục
   * @param {number} categoryId
   * @returns {Promise<Object>} - {category: CategoryDTO}
   */
  getCategoryDetails: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}`);
    return response.data;
  },

  /**
   * Tạo danh mục mới
   * @param {Object} data - {name, type: "expense"|"income", description?, icon?, color?}
   * @returns {Promise<Object>} - {message, category: CategoryDTO}
   */
  createCategory: async (data) => {
    const response = await api.post('/categories/create', data);
    return response.data;
  },

  /**
   * Cập nhật danh mục
   * @param {number} categoryId
   * @param {Object} data - {name?, description?, icon?, color?}
   * @returns {Promise<Object>} - {message, category: CategoryDTO}
   */
  updateCategory: async (categoryId, data) => {
    const response = await api.put(`/categories/${categoryId}`, data);
    return response.data;
  },

  /**
   * Xóa danh mục
   * @param {number} categoryId
   * @returns {Promise<Object>} - {message}
   */
  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data;
  },
};

