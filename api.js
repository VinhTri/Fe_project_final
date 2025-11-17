/**
 * API Client cho Personal Finance App
 * Sử dụng trong React project
 */

const API_BASE_URL = 'http://localhost:8080';

/**
 * Helper function để gọi API
 */
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('accessToken');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Có lỗi xảy ra');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ==================== AUTHENTICATION APIs ====================

export const authAPI = {
  /**
   * Đăng ký tài khoản mới
   */
  register: async (fullName, email, password, confirmPassword, recaptchaToken) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName,
        email,
        password,
        confirmPassword,
        recaptchaToken,
      }),
    });
  },

  /**
   * Xác minh email với mã OTP
   */
  verify: async (email, code) => {
    return apiCall('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  /**
   * Đăng nhập
   */
  login: async (email, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Làm mới access token
   */
  refreshToken: async (refreshToken) => {
    return apiCall('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  /**
   * Quên mật khẩu - Gửi OTP
   */
  forgotPassword: async (email) => {
    return apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Xác thực OTP
   */
  verifyOtp: async (email, otp) => {
    return apiCall('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email,
        'Mã xác thực': otp,
      }),
    });
  },

  /**
   * Đặt lại mật khẩu
   */
  resetPassword: async (email, otp, newPassword, confirmPassword) => {
    return apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        'Mã xác thực': otp,
        newPassword,
        confirmPassword,
      }),
    });
  },

  /**
   * Đăng nhập Google OAuth2
   */
  googleLogin: () => {
    window.location.href = `${API_BASE_URL}/auth/oauth2/authorization/google`;
  },
};

// ==================== PROFILE APIs ====================

export const profileAPI = {
  /**
   * Lấy thông tin profile
   */
  getProfile: async () => {
    return apiCall('/profile');
  },

  /**
   * Cập nhật profile
   */
  updateProfile: async (fullName, avatar) => {
    return apiCall('/profile/update', {
      method: 'POST',
      body: JSON.stringify({ fullName, avatar }),
    });
  },

  /**
   * Đổi mật khẩu
   */
  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    return apiCall('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword,
        newPassword,
        confirmPassword,
      }),
    });
  },
};

// ==================== WALLET APIs ====================

export const walletAPI = {
  /**
   * Tạo ví mới
   * @param {string} walletName - Tên ví
   * @param {string} currencyCode - Mã tiền tệ (VD: "VND", "USD")
   * @param {string} description - Mô tả ví
   * @param {boolean} setAsDefault - Đặt làm ví mặc định
   * @param {string} walletType - Loại ví: "PERSONAL" hoặc "GROUP" (mặc định: "PERSONAL")
   * @returns {Promise<{message: string, wallet: object}>}
   * @note initialBalance đã bị deprecated và bị ignore. Số dư ban đầu luôn là 0.0
   */
  createWallet: async (walletName, currencyCode, description, setAsDefault, walletType) => {
    return apiCall('/wallets/create', {
      method: 'POST',
      body: JSON.stringify({
        walletName,
        currencyCode,
        initialBalance: 0.0, // Deprecated - bị ignore trong backend
        description,
        setAsDefault,
        walletType: walletType || 'PERSONAL',
      }),
    });
  },

  /**
   * Lấy danh sách tất cả ví
   */
  getAllWallets: async () => {
    return apiCall('/wallets');
  },

  /**
   * Lấy chi tiết ví
   */
  getWalletDetails: async (walletId) => {
    return apiCall(`/wallets/${walletId}`);
  },

  /**
   * Cập nhật ví
   * Có thể cập nhật: tên, mô tả, số dư (nếu chưa có giao dịch), loại ví (PERSONAL/GROUP), trạng thái ví mặc định
   * @param {number} walletId - ID của ví
   * @param {string} walletName - Tên ví mới
   * @param {string} description - Mô tả ví
   * @param {string} currencyCode - Mã tiền tệ (chỉ để kiểm tra, không thể sửa)
   * @param {number} balance - Số dư (chỉ có thể sửa nếu ví chưa có giao dịch)
   * @param {boolean|null} setAsDefault - Đặt làm ví mặc định: true = đặt làm mặc định, false = bỏ ví mặc định, null = không thay đổi
   * @param {string} walletType - Loại ví: "PERSONAL" hoặc "GROUP" (có thể chuyển PERSONAL -> GROUP, không thể GROUP -> PERSONAL)
   * @returns {Promise<{message: string, wallet: object}>}
   */
  updateWallet: async (walletId, walletName, description, currencyCode, balance, setAsDefault, walletType) => {
    return apiCall(`/wallets/${walletId}`, {
      method: 'PUT',
      body: JSON.stringify({
        walletName,
        description,
        currencyCode,
        balance,
        setAsDefault,
        walletType,
      }),
    });
  },

  /**
   * Chuyển đổi ví cá nhân sang ví nhóm
   * @param {number} walletId - ID của ví cần chuyển đổi
   * @returns {Promise<{message: string, wallet: object}>}
   */
  convertToGroupWallet: async (walletId) => {
    return apiCall(`/wallets/${walletId}`, {
      method: 'PUT',
      body: JSON.stringify({
        walletType: 'GROUP',
      }),
    });
  },

  /**
   * Chuyển đổi ví nhóm về ví cá nhân
   * ⚠️ LƯU Ý: Không thể chuyển từ GROUP về PERSONAL. Sẽ báo lỗi.
   * @param {number} walletId - ID của ví cần chuyển đổi
   * @returns {Promise<{message: string, wallet: object}>}
   * @throws {Error} Nếu cố gắng chuyển GROUP -> PERSONAL
   */
  convertToPersonalWallet: async (walletId) => {
    return apiCall(`/wallets/${walletId}`, {
      method: 'PUT',
      body: JSON.stringify({
        walletType: 'PERSONAL',
      }),
    });
  },

  /**
   * Xóa ví
   * ⚠️ LƯU Ý: Không thể xóa ví có giao dịch hoặc ví mặc định
   * @param {number} walletId - ID của ví cần xóa
   * @returns {Promise<{message: string, deletedWallet: {deletedWalletId: number, deletedWalletName: string, balance: number, currencyCode: string, wasDefault: boolean, membersRemoved: number, transactionsDeleted: number}}>}
   * @throws {Error} Nếu ví có giao dịch hoặc là ví mặc định
   */
  deleteWallet: async (walletId) => {
    return apiCall(`/wallets/${walletId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Đặt ví mặc định
   * Tự động bỏ ví mặc định cũ và đặt ví này làm ví mặc định
   * @param {number} walletId - ID của ví cần đặt làm mặc định
   * @returns {Promise<{message: string}>}
   */
  setDefaultWallet: async (walletId) => {
    return apiCall(`/wallets/${walletId}/set-default`, {
      method: 'PATCH',
    });
  },

  /**
   * Bỏ ví mặc định
   * Sử dụng updateWallet với setAsDefault = false để bỏ ví mặc định
   * @param {number} walletId - ID của ví cần bỏ mặc định
   * @returns {Promise<{message: string, wallet: object}>}
   */
  unsetDefaultWallet: async (walletId) => {
    return apiCall(`/wallets/${walletId}`, {
      method: 'PUT',
      body: JSON.stringify({
        setAsDefault: false,
      }),
    });
  },

  /**
   * Chia sẻ ví
   */
  shareWallet: async (walletId, email) => {
    return apiCall(`/wallets/${walletId}/share`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Lấy danh sách thành viên ví
   */
  getWalletMembers: async (walletId) => {
    return apiCall(`/wallets/${walletId}/members`);
  },

  /**
   * Xóa thành viên khỏi ví
   */
  removeMember: async (walletId, memberUserId) => {
    return apiCall(`/wallets/${walletId}/members/${memberUserId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Rời khỏi ví
   */
  leaveWallet: async (walletId) => {
    return apiCall(`/wallets/${walletId}/leave`, {
      method: 'POST',
    });
  },

  /**
   * Kiểm tra quyền truy cập ví
   */
  checkAccess: async (walletId) => {
    return apiCall(`/wallets/${walletId}/access`);
  },

  /**
   * Chuyển tiền giữa các ví
   * @param {number} fromWalletId - ID ví nguồn
   * @param {number} toWalletId - ID ví đích
   * @param {number} amount - Số tiền chuyển
   * @param {string} note - Ghi chú (tùy chọn)
   * @param {string} imageUrl - URL ảnh hóa đơn (tùy chọn)
   * @returns {Promise<{message: string, transfer: object}>}
   */
  transferMoney: async (fromWalletId, toWalletId, amount, note, imageUrl) => {
    return apiCall('/wallets/transfer', {
      method: 'POST',
      body: JSON.stringify({
        fromWalletId,
        toWalletId,
        amount,
        note: note || null,
        imageUrl: imageUrl || null,
      }),
    });
  },

  /**
   * Lấy danh sách ví đích để chuyển tiền
   */
  getTransferTargets: async (walletId) => {
    return apiCall(`/wallets/${walletId}/transfer-targets`);
  },

  /**
   * Lấy danh sách ví có thể gộp
   * Chỉ trả về các ví mà user là OWNER
   * @param {number} sourceWalletId - ID của ví nguồn
   * @returns {Promise<{candidateWallets: Array, ineligibleWallets: Array, total: number}>}
   */
  getMergeCandidates: async (sourceWalletId) => {
    return apiCall(`/wallets/${sourceWalletId}/merge-candidates`);
  },

  /**
   * Xem trước kết quả gộp ví
   * Hiển thị số dư, số giao dịch, và các cảnh báo trước khi gộp
   * @param {number} targetWalletId - ID của ví đích (ví sẽ giữ lại)
   * @param {number} sourceWalletId - ID của ví nguồn (ví sẽ bị xóa)
   * @param {string} targetCurrency - Loại tiền tệ sau khi gộp (VD: "VND", "USD")
   * @returns {Promise<{preview: object}>}
   */
  previewMerge: async (targetWalletId, sourceWalletId, targetCurrency) => {
    return apiCall(
      `/wallets/${targetWalletId}/merge-preview?sourceWalletId=${sourceWalletId}&targetCurrency=${targetCurrency}`
    );
  },

  /**
   * Gộp ví nguồn vào ví đích
   * 
   * ⚠️ LƯU Ý: Ví nguồn sẽ BỊ XÓA sau khi gộp thành công!
   * 
   * Quy trình:
   * 1. Chuyển đổi số dư nếu khác currency
   * 2. Chuyển tất cả transactions từ ví nguồn sang ví đích
   * 3. Chuyển đổi amount của transactions nếu cần (lưu thông tin gốc)
   * 4. Chuyển tất cả members từ ví nguồn sang ví đích
   * 5. Chuyển flag "default wallet" nếu ví nguồn là default
   * 6. Xóa ví nguồn và lưu lịch sử merge
   * 
   * @param {number} targetWalletId - ID của ví đích (ví sẽ giữ lại)
   * @param {number} sourceWalletId - ID của ví nguồn (ví sẽ bị xóa)
   * @param {string} targetCurrency - Loại tiền tệ sau khi gộp (VD: "VND", "USD")
   * @returns {Promise<{success: boolean, message: string, result: object}>}
   */
  mergeWallets: async (targetWalletId, sourceWalletId, targetCurrency) => {
    return apiCall(`/wallets/${targetWalletId}/merge`, {
      method: 'POST',
      body: JSON.stringify({
        sourceWalletId,
        targetCurrency,
      }),
    });
  },
};

// ==================== CATEGORY APIs ====================

export const categoryAPI = {
  /**
   * Tạo danh mục mới
   * @param {string} categoryName - Tên danh mục
   * @param {string} description - Mô tả danh mục (tùy chọn)
   * @param {number} transactionTypeId - ID loại giao dịch (1: Chi tiêu, 2: Thu nhập)
   * @returns {Promise<Category>}
   */
  createCategory: async (categoryName, description, transactionTypeId) => {
    return apiCall('/categories/create', {
      method: 'POST',
      body: JSON.stringify({
        categoryName,
        description: description || null,
        transactionTypeId,
      }),
    });
  },

  /**
   * Cập nhật danh mục
   * @param {number} categoryId - ID danh mục
   * @param {string} categoryName - Tên danh mục mới
   * @param {string} description - Mô tả danh mục mới (tùy chọn)
   * @returns {Promise<Category>}
   */
  updateCategory: async (categoryId, categoryName, description) => {
    return apiCall(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify({
        categoryName,
        description: description || null,
      }),
    });
  },

  /**
   * Xóa danh mục
   */
  deleteCategory: async (categoryId) => {
    return apiCall(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Lấy danh sách danh mục
   */
  getCategories: async () => {
    return apiCall('/categories');
  },
};

// ==================== TRANSACTION APIs ====================

export const transactionAPI = {
  /**
   * Tạo giao dịch chi tiêu
   * @param {number} walletId - ID ví
   * @param {number} categoryId - ID danh mục
   * @param {number} amount - Số tiền chi tiêu
   * @param {string} transactionDate - Ngày giao dịch (ISO format)
   * @param {string} note - Ghi chú (tùy chọn)
   * @param {string} imageUrl - URL ảnh hóa đơn (tùy chọn)
   * @returns {Promise<{message: string, transaction: object}>}
   */
  createExpense: async (walletId, categoryId, amount, transactionDate, note, imageUrl) => {
    return apiCall('/transactions/expense', {
      method: 'POST',
      body: JSON.stringify({
        walletId,
        categoryId,
        amount,
        transactionDate,
        note: note || null,
        imageUrl: imageUrl || null,
      }),
    });
  },

  /**
   * Tạo giao dịch thu nhập
   * @param {number} walletId - ID ví
   * @param {number} categoryId - ID danh mục
   * @param {number} amount - Số tiền thu nhập
   * @param {string} transactionDate - Ngày giao dịch (ISO format)
   * @param {string} note - Ghi chú (tùy chọn)
   * @param {string} imageUrl - URL ảnh hóa đơn (tùy chọn)
   * @returns {Promise<{message: string, transaction: object}>}
   */
  createIncome: async (walletId, categoryId, amount, transactionDate, note, imageUrl) => {
    return apiCall('/transactions/income', {
      method: 'POST',
      body: JSON.stringify({
        walletId,
        categoryId,
        amount,
        transactionDate,
        note: note || null,
        imageUrl: imageUrl || null,
      }),
    });
  },

  /**
   * Lấy danh sách tất cả giao dịch
   * @param {number|null} walletId - Lọc theo ví (tùy chọn)
   * @param {number|null} typeId - Lọc theo loại giao dịch: 1 = Chi tiêu, 2 = Thu nhập (tùy chọn)
   * @param {string|null} startDate - Ngày bắt đầu (ISO format: "2024-01-01T00:00:00") (tùy chọn)
   * @param {string|null} endDate - Ngày kết thúc (ISO format: "2024-01-31T23:59:59") (tùy chọn)
   * @returns {Promise<{transactions: Array, total: number}>}
   */
  getAllTransactions: async (walletId = null, typeId = null, startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (walletId !== null) params.append('walletId', walletId);
    if (typeId !== null) params.append('typeId', typeId);
    if (startDate !== null) params.append('startDate', startDate);
    if (endDate !== null) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/transactions?${queryString}` : '/transactions';
    
    return apiCall(url, {
      method: 'GET',
    });
  },

  /**
   * Lấy chi tiết 1 giao dịch
   * @param {number} transactionId - ID giao dịch
   * @returns {Promise<{transaction: object}>}
   */
  getTransactionById: async (transactionId) => {
    return apiCall(`/transactions/${transactionId}`, {
      method: 'GET',
    });
  },

  /**
   * Lấy tất cả giao dịch của 1 ví cụ thể
   * @param {number} walletId - ID ví
   * @returns {Promise<{transactions: Array, total: number, walletId: number}>}
   */
  getTransactionsByWallet: async (walletId) => {
    return apiCall(`/transactions/wallet/${walletId}`, {
      method: 'GET',
    });
  },
};

// ==================== SCHEDULED TRANSACTION APIs ====================

export const scheduledTransactionAPI = {
  /**
   * Tạo giao dịch đặt lịch hẹn
   * Hệ thống sẽ tự động tạo transaction vào thời điểm scheduledDate
   * @param {number} walletId - ID ví
   * @param {number} categoryId - ID danh mục
   * @param {number} amount - Số tiền
   * @param {string} scheduledDate - Ngày hẹn (ISO format, phải trong tương lai)
   * @param {string} note - Ghi chú (tùy chọn)
   * @param {string} imageUrl - URL ảnh hóa đơn (tùy chọn)
   * @returns {Promise<{message: string, scheduledTransaction: object}>}
   */
  createScheduledTransaction: async (walletId, categoryId, amount, scheduledDate, note, imageUrl) => {
    return apiCall('/scheduled-transactions/create', {
      method: 'POST',
      body: JSON.stringify({
        walletId,
        categoryId,
        amount,
        scheduledDate,
        note: note || null,
        imageUrl: imageUrl || null,
      }),
    });
  },

  /**
   * Lấy tất cả giao dịch đặt lịch
   * @returns {Promise<{scheduledTransactions: Array, total: number}>}
   */
  getAllScheduledTransactions: async () => {
    return apiCall('/scheduled-transactions', {
      method: 'GET',
    });
  },

  /**
   * Lấy giao dịch đặt lịch theo trạng thái
   * @param {string} status - Trạng thái: "PENDING", "EXECUTED", hoặc "CANCELLED"
   * @returns {Promise<{scheduledTransactions: Array, total: number, status: string}>}
   */
  getScheduledTransactionsByStatus: async (status) => {
    return apiCall(`/scheduled-transactions/status/${status}`, {
      method: 'GET',
    });
  },

  /**
   * Lấy giao dịch đặt lịch theo ví
   * @param {number} walletId - ID ví
   * @returns {Promise<{scheduledTransactions: Array, total: number, walletId: number}>}
   */
  getScheduledTransactionsByWallet: async (walletId) => {
    return apiCall(`/scheduled-transactions/wallet/${walletId}`, {
      method: 'GET',
    });
  },

  /**
   * Lấy chi tiết giao dịch đặt lịch
   * @param {number} scheduledId - ID giao dịch đặt lịch
   * @returns {Promise<{scheduledTransaction: object}>}
   */
  getScheduledTransactionById: async (scheduledId) => {
    return apiCall(`/scheduled-transactions/${scheduledId}`, {
      method: 'GET',
    });
  },

  /**
   * Hủy giao dịch đặt lịch
   * Chỉ có thể hủy giao dịch đang ở trạng thái PENDING
   * @param {number} scheduledId - ID giao dịch đặt lịch
   * @returns {Promise<{message: string}>}
   */
  cancelScheduledTransaction: async (scheduledId) => {
    return apiCall(`/scheduled-transactions/${scheduledId}/cancel`, {
      method: 'POST',
    });
  },
};

// ==================== FILE UPLOAD APIs ====================

export const fileAPI = {
  /**
   * Upload file (ảnh hóa đơn, avatar, etc.)
   * @param {File} file - File cần upload (required)
   * @param {string} type - Loại file: "receipt" (ảnh hóa đơn), "avatar" (ảnh đại diện), mặc định là "receipt" (optional)
   * @returns {Promise<{message: string, url: string, filename: string, originalFilename: string, size: number, contentType: string}>}
   */
  uploadFile: async (file, type = 'receipt') => {
    if (!file) {
      throw new Error('File không được để trống');
    }

    // Tạo FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Chưa đăng nhập');
    }

    // Gọi API upload
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Không set Content-Type, browser sẽ tự động set với boundary cho FormData
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload file thất bại');
    }

    return data;
  },

  /**
   * Xóa file đã upload
   * @param {string} type - Loại file (receipt, avatar, etc.)
   * @param {string} filename - Tên file cần xóa
   * @returns {Promise<{message: string}>}
   */
  deleteFile: async (type, filename) => {
    if (!type || !filename) {
      throw new Error('Type và filename không được để trống');
    }

    return apiCall(`/files/${type}/${filename}`, {
      method: 'DELETE',
    });
  },

  /**
   * Lấy URL đầy đủ của file (helper function)
   * @param {string} type - Loại file (receipt, avatar, etc.)
   * @param {string} filename - Tên file
   * @returns {string} URL đầy đủ của file
   */
  getFileUrl: (type, filename) => {
    if (!type || !filename) {
      return null;
    }
    return `${API_BASE_URL}/files/${type}/${filename}`;
  },

  /**
   * Upload ảnh hóa đơn (helper function cho receipt)
   * @param {File} file - File ảnh hóa đơn
   * @returns {Promise<{message: string, url: string, filename: string, originalFilename: string, size: number, contentType: string}>}
   */
  uploadReceipt: async (file) => {
    return fileAPI.uploadFile(file, 'receipt');
  },

  /**
   * Upload avatar (helper function cho avatar)
   * @param {File} file - File ảnh avatar
   * @returns {Promise<{message: string, url: string, filename: string, originalFilename: string, size: number, contentType: string}>}
   */
  uploadAvatar: async (file) => {
    return fileAPI.uploadFile(file, 'avatar');
  },
};

// ==================== EXPORT ALL APIs ====================

export default {
  auth: authAPI,
  profile: profileAPI,
  wallet: walletAPI,
  category: categoryAPI,
  transaction: transactionAPI,
  scheduledTransaction: scheduledTransactionAPI,
  file: fileAPI,
};

/**
 * Ví dụ sử dụng:
 * 
 * import api from './api';
 * 
 * // ============ AUTHENTICATION ============
 * // Đăng nhập
 * const loginData = await api.auth.login('user@example.com', 'password');
 * localStorage.setItem('accessToken', loginData.accessToken);
 * localStorage.setItem('refreshToken', loginData.refreshToken);
 * 
 * // ============ WALLET ============
 * // Lấy danh sách ví
 * const { wallets } = await api.wallet.getAllWallets();
 * 
 * // Tạo ví mới
 * const newWallet = await api.wallet.createWallet(
 *   'Ví mới',
 *   'VND',
 *   'Mô tả ví',
 *   false, // setAsDefault
 *   'PERSONAL' // walletType
 * );
 * 
 * // Chuyển đổi ví cá nhân sang ví nhóm
 * const groupWallet = await api.wallet.convertToGroupWallet(1); // walletId
 * 
 * // Chuyển đổi ví nhóm về ví cá nhân (sẽ báo lỗi)
 * try {
 *   const personalWallet = await api.wallet.convertToPersonalWallet(1); // walletId
 * } catch (error) {
 *   console.error('Lỗi:', error.message); // "Không thể chuyển ví nhóm về ví cá nhân..."
 * }
 * 
 * // Hoặc cập nhật loại ví thông qua updateWallet
 * const updated = await api.wallet.updateWallet(
 *   1, // walletId
 *   'Ví nhóm', // walletName
 *   'Mô tả', // description
 *   'VND', // currencyCode
 *   null, // balance
 *   false, // setAsDefault (false = bỏ ví mặc định, true = đặt làm mặc định, null = không thay đổi)
 *   'GROUP' // walletType
 * );
 * 
 * // Bỏ ví mặc định
 * await api.wallet.unsetDefaultWallet(1); // walletId
 * 
 * // Hoặc sử dụng updateWallet với setAsDefault = false
 * await api.wallet.updateWallet(1, null, null, null, null, false, null);
 * 
 * // ============ MERGE WALLET ============
 * // 1. Lấy danh sách ví có thể gộp
 * const { candidateWallets } = await api.wallet.getMergeCandidates(1); // sourceWalletId
 * 
 * // 2. Xem trước kết quả gộp ví
 * const preview = await api.wallet.previewMerge(
 *   2, // targetWalletId (ví đích)
 *   1, // sourceWalletId (ví nguồn - sẽ bị xóa)
 *   'VND' // targetCurrency
 * );
 * 
 * console.log('Số dư sau khi gộp:', preview.preview.finalBalance);
 * console.log('Cảnh báo:', preview.preview.warnings);
 * 
 * // 3. Thực hiện gộp ví
 * // ⚠️ LƯU Ý: Ví nguồn sẽ BỊ XÓA sau khi gộp thành công!
 * const mergeResult = await api.wallet.mergeWallets(
 *   2, // targetWalletId (ví đích - giữ lại)
 *   1, // sourceWalletId (ví nguồn - sẽ bị xóa)
 *   'VND' // targetCurrency
 * );
 * 
 * if (mergeResult.success) {
 *   console.log('Gộp ví thành công!');
 *   console.log('Số dư cuối cùng:', mergeResult.result.finalBalance);
 *   console.log('Số giao dịch đã gộp:', mergeResult.result.mergedTransactions);
 * }
 * 
 * // ============ TRANSACTION ============
 * // Tạo giao dịch chi tiêu với ảnh hóa đơn
 * const expense = await api.transaction.createExpense(
 *   1, // walletId
 *   1, // categoryId
 *   50000, // amount
 *   new Date().toISOString(), // transactionDate
 *   'Ăn trưa', // note
 *   'https://example.com/receipt.jpg' // imageUrl (tùy chọn - ảnh hóa đơn)
 * );
 * 
 * // Tạo giao dịch thu nhập với ảnh hóa đơn
 * const income = await api.transaction.createIncome(
 *   1, // walletId
 *   5, // categoryId
 *   1000000, // amount
 *   new Date().toISOString(), // transactionDate
 *   'Lương tháng 1', // note
 *   'https://example.com/payslip.jpg' // imageUrl (tùy chọn - ảnh hóa đơn)
 * );
 * 
 * // Lấy tất cả giao dịch
 * const allTransactions = await api.transaction.getAllTransactions();
 * console.log('Tổng số giao dịch:', allTransactions.total);
 * 
 * // Lấy giao dịch theo ví
 * const walletTransactions = await api.transaction.getTransactionsByWallet(1); // walletId
 * 
 * // Lấy giao dịch với filter
 * const filteredTransactions = await api.transaction.getAllTransactions(
 *   1, // walletId
 *   1, // typeId (1: Chi tiêu, 2: Thu nhập)
 *   '2024-01-01T00:00:00', // startDate
 *   '2024-01-31T23:59:59' // endDate
 * );
 * 
 * // Lấy chi tiết 1 giao dịch
 * const transaction = await api.transaction.getTransactionById(1); // transactionId
 * 
 * // ============ SCHEDULED TRANSACTION ============
 * // Tạo giao dịch đặt lịch hẹn (tự động thực hiện vào ngày đã hẹn)
 * const scheduled = await api.scheduledTransaction.createScheduledTransaction(
 *   1, // walletId
 *   1, // categoryId
 *   50000, // amount
 *   '2024-01-15T10:00:00', // scheduledDate (phải trong tương lai)
 *   'Thanh toán hóa đơn điện', // note
 *   'https://example.com/bill.jpg' // imageUrl (tùy chọn)
 * );
 * 
 * // Lấy tất cả giao dịch đặt lịch
 * const allScheduled = await api.scheduledTransaction.getAllScheduledTransactions();
 * 
 * // Lấy giao dịch đặt lịch theo trạng thái
 * const pendingScheduled = await api.scheduledTransaction.getScheduledTransactionsByStatus('PENDING');
 * 
 * // Lấy giao dịch đặt lịch theo ví
 * const walletScheduled = await api.scheduledTransaction.getScheduledTransactionsByWallet(1); // walletId
 * 
 * // Hủy giao dịch đặt lịch
 * await api.scheduledTransaction.cancelScheduledTransaction(1); // scheduledId
 * 
 * // ============ FILE UPLOAD ============
 * // Upload ảnh hóa đơn
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const uploadResult = await api.file.uploadReceipt(file);
 * console.log('URL ảnh:', uploadResult.url); // Sử dụng URL này trong imageUrl của transaction
 * 
 * // Upload avatar
 * const avatarResult = await api.file.uploadAvatar(file);
 * 
 * // Upload file với type tùy chỉnh
 * const customResult = await api.file.uploadFile(file, 'receipt');
 * 
 * // Xóa file
 * await api.file.deleteFile('receipt', 'abc123.jpg');
 * 
 * // Lấy URL file (helper)
 * const fileUrl = api.file.getFileUrl('receipt', 'abc123.jpg');
 * 
 * // Ví dụ: Upload ảnh và tạo transaction với ảnh đó
 * const receiptFile = document.querySelector('#receipt-input').files[0];
 * const uploadResult = await api.file.uploadReceipt(receiptFile);
 * const transaction = await api.transaction.createExpense(
 *   1, // walletId
 *   1, // categoryId
 *   50000, // amount
 *   new Date().toISOString(), // transactionDate
 *   'Ăn trưa', // note
 *   uploadResult.url // imageUrl từ upload
 * );
 * 
 * // ============ TRANSFER MONEY ============
 * // Chuyển tiền giữa các ví với ảnh hóa đơn
 * const transfer = await api.wallet.transferMoney(
 *   1, // fromWalletId
 *   2, // toWalletId
 *   100000, // amount
 *   'Chuyển tiền', // note
 *   'https://example.com/receipt.jpg' // imageUrl (tùy chọn - ảnh hóa đơn)
 * );
 */

