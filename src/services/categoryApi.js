// src/services/categoryApi.js
import { apiClient } from "./apiClient";

export const categoryAPI = {
  /** Lấy danh mục của user */
  async getCategories() {
    const res = await apiClient.get("/categories");
    return res.data; // Backend trả trực tiếp List<Category>
  },

  /** Tạo danh mục */
  async createCategory(categoryName, description, transactionTypeId) {
    const body = {
      categoryName,
      description: description || null,
      transactionTypeId,
    };
    const res = await apiClient.post("/categories/create", body);
    return res.data; // Category entity
  },

  /** Cập nhật danh mục */
  async updateCategory(id, categoryName, description) {
    const body = {
      categoryName,
      description: description || null,
    };
    const res = await apiClient.put(`/categories/${id}`, body);
    return res.data; // Category entity
  },

  /** Xóa danh mục */
  async deleteCategory(id) {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data; // { message: "Danh mục đã được xóa thành công" }
  },
};

export default categoryAPI;
