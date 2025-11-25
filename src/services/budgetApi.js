// src/services/budgetApi.js
import { apiClient } from "./apiClient";

export const budgetAPI = {
  /** Tạo ngân sách mới */
  async createBudget(categoryId, walletId, amountLimit, startDate, endDate, note = "") {
    const body = {
      categoryId,
      walletId: walletId || null, // BE cho phép null = áp dụng tất cả ví
      amountLimit,
      startDate,
      endDate,
      note,
    };

    const res = await apiClient.post("/budgets/create", body);
    return res.data;
  },

  /** (Nếu BE có) Lấy tất cả ngân sách của user */
  async getMyBudgets() {
    const res = await apiClient.get("/budgets");
    return res.data;
  },

  /** (Nếu BE có) Xóa ngân sách */
  async deleteBudget(budgetId) {
    const res = await apiClient.delete(`/budgets/${budgetId}`);
    return res.data;
  },

  /** (Nếu BE có) Cập nhật ngân sách */
  async updateBudget(budgetId, payload) {
    const res = await apiClient.put(`/budgets/${budgetId}`, payload);
    return res.data;
  },
};

export default budgetAPI;
