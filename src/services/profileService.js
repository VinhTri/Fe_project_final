// ========================================
// 👤 PROFILE SERVICE
// ========================================
import api from '../api/axiosConfig';

export const profileService = {
  /**
   * Lấy thông tin profile
   * @returns {Promise<Object>} - {user}
   */
  getProfile: async () => {
    const response = await api.get('/profile');
    
    // Cập nhật localStorage
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // ✅ DISPATCH CUSTOM EVENT để notify các component khác
      window.dispatchEvent(new Event('userProfileUpdated'));
    }
    
    return response.data;
  },

  /**
   * Cập nhật profile
   * @param {Object} data - {fullName?, avatar?}
   * @returns {Promise<Object>} - {message, user}
   */
  updateProfile: async (data) => {
    const response = await api.post('/profile/update', data);
    
    // Cập nhật localStorage
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // ✅ DISPATCH CUSTOM EVENT để notify các component khác (như Topbar)
      window.dispatchEvent(new Event('userProfileUpdated'));
      console.log("📢 Dispatched userProfileUpdated event");
    }
    
    return response.data;
  },

  /**
   * Đổi mật khẩu
   * Trường hợp 1: Đổi từ mật khẩu mặc định (chỉ cần newPassword + confirmPassword)
   * Trường hợp 2: Đổi mật khẩu thường (cần oldPassword + newPassword + confirmPassword)
   * @param {Object} data - {oldPassword?, newPassword, confirmPassword}
   * @returns {Promise<Object>} - {message}
   */
  changePassword: async (data) => {
    const response = await api.post('/profile/change-password', data);
    return response.data;
  },

  /**
   * Yêu cầu OTP để đổi mật khẩu (nếu backend có flow 2 bước)
   * @param {Object} data - {oldPassword, newPassword, confirmPassword}
   * @returns {Promise<Object>} - {message}
   */
  requestPasswordChangeOTP: async (data) => {
    const response = await api.post('/auth/change-password/request-otp', data);
    return response.data;
  },

  /**
   * Xác nhận OTP để hoàn tất đổi mật khẩu (nếu backend có flow 2 bước)
   * @param {Object} data - {code, newPassword}
   * @returns {Promise<Object>} - {message}
   */
  confirmPasswordChange: async (data) => {
    const response = await api.post('/auth/change-password/confirm', data);
    return response.data;
  },

  /**
   * Gửi lại OTP đổi mật khẩu (nếu backend có)
   * @returns {Promise<Object>} - {message}
   */
  resendPasswordChangeOTP: async () => {
    const response = await api.post('/auth/change-password/resend-otp');
    return response.data;
  },

  /**
   * Kiểm tra có mật khẩu chưa (dùng cho Google account)
   * @returns {Promise<Object>} - {hasPassword}
   */
  hasPassword: async () => {
    const response = await api.get('/profile/has-password');
    return response.data;
  },

  /**
   * Kiểm tra đang dùng mật khẩu mặc định hay không
   * @returns {Promise<Object>} - {hasDefaultPassword, message}
   */
  checkDefaultPassword: async () => {
    const response = await api.get('/profile/default-password');
    return response.data;
  },
};

