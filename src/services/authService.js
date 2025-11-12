// ========================================
// 🔐 AUTHENTICATION SERVICE
// ========================================
import api from '../api/axiosConfig';

export const authService = {
  /**
   * Đăng ký tài khoản mới
   * @param {Object} data - {fullName, email, password, confirmPassword, recaptchaToken}
   * @returns {Promise<Object>} - {message}
   */
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Xác minh email với OTP
   * @param {Object} data - {email, code}
   * @returns {Promise<Object>} - {message, accessToken, refreshToken}
   */
  verify: async (data) => {
    const response = await api.post('/auth/verify', data);
    
    // Tự động lưu tokens
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    return response.data;
  },

  /**
   * Đăng nhập
   * @param {Object} data - {email, password}
   * @returns {Promise<Object>} - {message, accessToken, refreshToken, user}
   */
  login: async (data) => {
    const response = await api.post('/auth/login', data);
    
    // Tự động lưu tokens và user info
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    
    return response.data;
  },

  /**
   * Làm mới access token
   * @param {string} refreshToken
   * @returns {Promise<Object>} - {accessToken, message}
   */
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    
    return response.data;
  },

  /**
   * Quên mật khẩu - gửi OTP về email
   * @param {string} email
   * @returns {Promise<Object>} - {message}
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Đặt lại mật khẩu
   * @param {Object} data - {email, "Mã xác thực", newPassword, confirmPassword}
   * @returns {Promise<Object>} - {message}
   */
  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Đăng xuất
   */
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  /**
   * Lấy thông tin user hiện tại từ localStorage
   * @returns {Object|null}
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Kiểm tra đã đăng nhập chưa
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
};

