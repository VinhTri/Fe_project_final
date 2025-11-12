// ========================================
// 💰 WALLET SERVICE
// ========================================
import api from '../api/axiosConfig';

export const walletService = {
  /**
   * Tạo ví mới
   * @param {Object} data - {walletName, currencyCode, initialBalance, description, setAsDefault}
   * @returns {Promise<Object>} - {message, wallet}
   */
  createWallet: async (data) => {
    const response = await api.post('/wallets/create', data);
    return response.data;
  },

  /**
   * Lấy danh sách tất cả ví (owned + shared)
   * @returns {Promise<Object>} - {wallets: SharedWalletDTO[], total}
   */
  getWallets: async () => {
    const response = await api.get('/wallets');
    return response.data;
  },

  /**
   * Lấy chi tiết 1 ví
   * @param {number} walletId
   * @returns {Promise<Object>} - {wallet}
   */
  getWalletDetails: async (walletId) => {
    const response = await api.get(`/wallets/${walletId}`);
    return response.data;
  },

  /**
   * Cập nhật ví (tên, mô tả, balance nếu chưa có transaction)
   * @param {number} walletId
   * @param {Object} data - {walletName?, description?, balance?}
   * @returns {Promise<Object>} - {message, wallet}
   */
  updateWallet: async (walletId, data) => {
    const response = await api.put(`/wallets/${walletId}`, data);
    return response.data;
  },

  /**
   * Xóa ví
   * @param {number} walletId
   * @returns {Promise<Object>} - {message, deletedWallet}
   */
  deleteWallet: async (walletId) => {
    const response = await api.delete(`/wallets/${walletId}`);
    return response.data;
  },

  /**
   * Đặt ví làm mặc định
   * @param {number} walletId
   * @returns {Promise<Object>} - {message}
   */
  setDefaultWallet: async (walletId) => {
    const response = await api.patch(`/wallets/${walletId}/set-default`);
    return response.data;
  },

  /**
   * Chia sẻ ví với người khác qua email
   * @param {number} walletId
   * @param {string} email
   * @returns {Promise<Object>} - {message, member}
   */
  shareWallet: async (walletId, email) => {
    const response = await api.post(`/wallets/${walletId}/share`, { email });
    return response.data;
  },

  /**
   * Lấy danh sách thành viên của ví
   * @param {number} walletId
   * @returns {Promise<Object>} - {members: WalletMemberDTO[], total}
   */
  getWalletMembers: async (walletId) => {
    const response = await api.get(`/wallets/${walletId}/members`);
    return response.data;
  },

  /**
   * Xóa thành viên khỏi ví (chỉ OWNER)
   * @param {number} walletId
   * @param {number} memberUserId
   * @returns {Promise<Object>} - {message}
   */
  removeMember: async (walletId, memberUserId) => {
    const response = await api.delete(`/wallets/${walletId}/members/${memberUserId}`);
    return response.data;
  },

  /**
   * Rời khỏi ví (MEMBER tự rời)
   * @param {number} walletId
   * @returns {Promise<Object>} - {message}
   */
  leaveWallet: async (walletId) => {
    const response = await api.post(`/wallets/${walletId}/leave`);
    return response.data;
  },

  /**
   * Kiểm tra quyền truy cập ví
   * @param {number} walletId
   * @returns {Promise<Object>} - {hasAccess, isOwner, role}
   */
  checkAccess: async (walletId) => {
    const response = await api.get(`/wallets/${walletId}/access`);
    return response.data;
  },

  // ========================================
  // 🔀 MERGE WALLET APIS
  // ========================================

  /**
   * Lấy danh sách ví có thể gộp
   * @param {number} sourceWalletId - ID ví nguồn (sẽ bị xóa sau merge)
   * @returns {Promise<Object>} - {candidateWallets, ineligibleWallets, total}
   */
  getMergeCandidates: async (sourceWalletId) => {
    const response = await api.get(`/wallets/${sourceWalletId}/merge-candidates`);
    return response.data;
  },

  /**
   * Xem preview trước khi gộp ví (hỗ trợ currency conversion)
   * @param {number} targetWalletId - ID ví đích (sẽ giữ lại)
   * @param {number} sourceWalletId - ID ví nguồn (sẽ bị xóa)
   * @param {string} targetCurrency - Loại tiền sau merge (VND, USD, EUR, etc.)
   * @returns {Promise<Object>} - {preview: MergeWalletPreviewResponse}
   */
  previewMerge: async (targetWalletId, sourceWalletId, targetCurrency) => {
    const response = await api.get(
      `/wallets/${targetWalletId}/merge-preview`,
      {
        params: {
          sourceWalletId,
          targetCurrency
        }
      }
    );
    return response.data;
  },

  /**
   * Thực hiện gộp ví (hỗ trợ currency conversion)
   * @param {number} targetWalletId - ID ví đích
   * @param {number} sourceWalletId - ID ví nguồn
   * @param {string} targetCurrency - Loại tiền sau merge (REQUIRED)
   * @returns {Promise<Object>} - {success, message, result: MergeWalletResponse}
   */
  mergeWallets: async (targetWalletId, sourceWalletId, targetCurrency) => {
    const response = await api.post(`/wallets/${targetWalletId}/merge`, {
      sourceWalletId,
      targetCurrency
    });
    return response.data;
  },

  /**
   * Chuyển tiền giữa 2 ví (cùng loại tiền tệ)
   * @param {Object} data - {fromWalletId, toWalletId, amount, categoryId, note?}
   * @returns {Promise<Object>} - {message, transfer}
   */
  transferMoney: async (data) => {
    const response = await api.post('/wallets/transfer', data);
    return response.data;
  },

  /**
   * Lấy lịch sử gộp ví
   * @returns {Promise<Object>} - {history, total, message}
   */
  getMergeHistory: async () => {
    const response = await api.get('/wallets/merge-history');
    return response.data;
  },
};

