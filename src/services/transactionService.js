// ========================================
// 💸 TRANSACTION SERVICE
// ========================================
import api from '../api/axiosConfig';

export const transactionService = {
  /**
   * Tạo giao dịch chi tiêu
   * @param {Object} data - {amount, transactionDate, walletId, categoryId, note?, imageUrl?}
   * @returns {Promise<Object>} - {message, transaction}
   */
  createExpense: async (data) => {
    const response = await api.post('/transactions/expense', data);
    return response.data;
  },

  /**
   * Tạo giao dịch thu nhập
   * @param {Object} data - {amount, transactionDate, walletId, categoryId, note?, imageUrl?}
   * @returns {Promise<Object>} - {message, transaction}
   */
  createIncome: async (data) => {
    const response = await api.post('/transactions/income', data);
    return response.data;
  },

  /**
   * Lấy danh sách giao dịch (có filter)
   * @param {Object} params - {walletId?, type?, categoryId?, fromDate?, toDate?, page?, size?}
   * @returns {Promise<Object>} - {transactions: TransactionDTO[], total, page, size}
   */
  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  /**
   * Lấy chi tiết 1 giao dịch
   * @param {number} transactionId
   * @returns {Promise<Object>} - {transaction: TransactionDTO}
   */
  getTransactionDetails: async (transactionId) => {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  },

  /**
   * Cập nhật giao dịch
   * @param {number} transactionId
   * @param {Object} data - {amount?, transactionDate?, categoryId?, note?, imageUrl?}
   * @returns {Promise<Object>} - {message, transaction}
   */
  updateTransaction: async (transactionId, data) => {
    const response = await api.put(`/transactions/${transactionId}`, data);
    return response.data;
  },

  /**
   * Xóa giao dịch
   * @param {number} transactionId
   * @returns {Promise<Object>} - {message}
   */
  deleteTransaction: async (transactionId) => {
    const response = await api.delete(`/transactions/${transactionId}`);
    return response.data;
  },

  /**
   * Lấy thống kê giao dịch
   * @param {Object} params - {walletId?, fromDate?, toDate?, period?}
   * @returns {Promise<Object>} - {statistics: {...}}
   */
  getStatistics: async (params = {}) => {
    const response = await api.get('/transactions/statistics', { params });
    return response.data;
  },
};

