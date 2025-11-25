// src/services/transactionApi.js
import { apiClient, handleAxiosResponse, handleAxiosError } from "./apiClient";

const BASE = "/transactions";

// Lấy tất cả giao dịch
export const getAllTransactions = async () => {
  try {
    const res = await apiClient.get(BASE);
    return handleAxiosResponse(res); // { data: {transactions, total}, response: {status,...} }
  } catch (error) {
    return handleAxiosError(error);
  }
};

// Thêm chi tiêu
export const addExpense = async (payload) => {
  try {
    const res = await apiClient.post(`${BASE}/expense`, payload);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

// Thêm thu nhập
export const addIncome = async (payload) => {
  try {
    const res = await apiClient.post(`${BASE}/income`, payload);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

// Cập nhật giao dịch
export const updateTransaction = async (id, payload) => {
  try {
    const res = await apiClient.put(`${BASE}/${id}`, payload);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

// Xóa giao dịch
export const deleteTransaction = async (id) => {
  try {
    const res = await apiClient.delete(`${BASE}/${id}`);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};
