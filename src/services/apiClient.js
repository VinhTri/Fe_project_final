// =========================================================
// src/services/apiClient.js — FULL VERSION
// =========================================================
import axios from "axios";

// ================== BASE URL ==================
const API_BASE_URL = "http://localhost:8080";   // 🚀 SỬA LẠI CHO CHUẨN

// ================== CORE CLIENT ==================
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper
export const handleAxiosResponse = (axiosResponse) => ({
  data: axiosResponse.data,
  response: {
    status: axiosResponse.status,
    statusText: axiosResponse.statusText,
  },
});

export const handleAxiosError = (error) => {
  if (error.response) {
    return Promise.reject({
      data: error.response.data,
      response: {
        status: error.response.status,
        statusText: error.response.statusText,
      },
    });
  }
  return Promise.reject({
    data: { message: "Network error" },
    response: { status: 0, statusText: "NETWORK_ERROR" },
  });
};

//////////////////////////////////////////////////////////////
// TRANSACTION API
//////////////////////////////////////////////////////////////

export const transactionAPI = {
  async getAllTransactions() {
    const res = await apiClient.get("/transactions");
    return res.data;
  },

  async addExpense(amount, transactionDate, walletId, categoryId, note = "", imageUrl = null) {
    const res = await apiClient.post("/transactions/expense", {
      amount,
      transactionDate,
      walletId,
      categoryId,
      note,
      imageUrl,
    });
    return res.data;
  },

  async addIncome(amount, transactionDate, walletId, categoryId, note = "", imageUrl = null) {
    const res = await apiClient.post("/transactions/income", {
      amount,
      transactionDate,
      walletId,
      categoryId,
      note,
      imageUrl,
    });
    return res.data;
  },

  async updateTransaction(id, categoryId, note = "", imageUrl = null) {
    const res = await apiClient.put(`/transactions/${id}`, {
      categoryId,
      note,
      imageUrl,
    });
    return res.data;
  },

  async deleteTransaction(id) {
    const res = await apiClient.delete(`/transactions/${id}`);
    return res.data;
  },
};

//////////////////////////////////////////////////////////////
// WALLET TRANSFER API
//////////////////////////////////////////////////////////////

export const walletAPI = {
  async getAllTransfers() {
    const res = await apiClient.get("/wallets/transfers");
    return res.data;
  },

  async transferMoney(fromWalletId, toWalletId, amount, note = "") {
    const res = await apiClient.post("/wallets/transfer", {
      fromWalletId,
      toWalletId,
      amount,
      note,
    });
    return res.data;
  },

  async updateTransfer(id, note = "") {
    const res = await apiClient.put(`/wallets/transfers/${id}`, { note });
    return res.data;
  },

  async deleteTransfer(id) {
    const res = await apiClient.delete(`/wallets/transfers/${id}`);
    return res.data;
  },
};

//////////////////////////////////////////////////////////////
// CATEGORY API
//////////////////////////////////////////////////////////////

export const categoryAPI = {
  async getMyCategories() {
    const res = await apiClient.get("/categories");
    return res.data;
  },

  async createCategory(categoryName, description, transactionTypeId) {
    const res = await apiClient.post("/categories/create", {
      categoryName,
      description,
      transactionTypeId,
    });
    return res.data;
  },

  async updateCategory(id, categoryName, description) {
    const res = await apiClient.put(`/categories/${id}`, {
      categoryName,
      description,
    });
    return res.data;
  },

  async deleteCategory(id) {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data;
  },
};

//////////////////////////////////////////////////////////////
// BUDGET API
//////////////////////////////////////////////////////////////

export const budgetAPI = {
  async createBudget(payload) {
    const res = await apiClient.post("/budgets/create", payload);
    return res.data;
  },

  async getBudgets() {
    const res = await apiClient.get("/budgets");
    return res.data;
  },

  async updateBudget(id, payload) {
    const res = await apiClient.put(`/budgets/${id}`, payload);
    return res.data;
  },

  async deleteBudget(id) {
    const res = await apiClient.delete(`/budgets/${id}`);
    return res.data;
  },
};

export default apiClient;
