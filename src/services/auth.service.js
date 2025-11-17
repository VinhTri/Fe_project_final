/**
 * Auth Service - Service layer cho các API calls liên quan đến authentication
 * Base URL: http://localhost:8080/auth
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:8080/auth";

// Tạo axios instance với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Helper function để xử lý response từ axios
 * @param {Object} axiosResponse - Response object từ axios
 * @returns {Object} - { data, response } với format tương tự fetch để component có thể check response.status
 */
const handleAxiosResponse = (axiosResponse) => {
  return {
    data: axiosResponse.data,
    response: {
      ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
    },
  };
};

/**
 * 📌 ĐĂNG KÝ (có CAPTCHA + gửi mã email)
 * @param {Object} registerData - Dữ liệu đăng ký
 * @param {string} registerData.fullName - Họ và tên
 * @param {string} registerData.email - Email
 * @param {string} registerData.password - Mật khẩu
 * @param {string} registerData.confirmPassword - Xác nhận mật khẩu
 * @param {string} registerData.recaptchaToken - Token từ reCAPTCHA
 * @returns {Promise<Object>} - { message: string } hoặc { error: string }
 */
export const register = async ({ fullName, email, password, confirmPassword, recaptchaToken }) => {
  try {
    const response = await apiClient.post("/register", {
      fullName,
      email,
      password,
      confirmPassword,
      recaptchaToken,
    });

    return handleAxiosResponse(response);
  } catch (error) {
    // Xử lý lỗi từ axios
    if (error.response) {
      // Server trả về error response (4xx, 5xx)
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      // Request được gửi nhưng không có response (network error)
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ. Kiểm tra backend và secret key." },
      };
    } else {
      // Lỗi khác
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

/**
 * 📩 XÁC MINH EMAIL
 * @param {Object} verifyData - Dữ liệu xác minh
 * @param {string} verifyData.email - Email cần xác minh
 * @param {string} verifyData.code - Mã xác minh 6 số
 * @returns {Promise<Object>} - { message: string, accessToken: string, refreshToken: string } hoặc { error: string }
 */
export const verifyAccount = async ({ email, code }) => {
  try {
    const response = await apiClient.post("/verify", {
      email,
      code,
    });

    return handleAxiosResponse(response);
  } catch (error) {
    if (error.response) {
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi xác minh mã." },
      };
    } else {
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

/**
 * 📌 ĐĂNG NHẬP (chỉ cho tài khoản đã xác minh)
 * @param {Object} loginData - Dữ liệu đăng nhập
 * @param {string} loginData.email - Email
 * @param {string} loginData.password - Mật khẩu
 * @returns {Promise<Object>} - { message: string, accessToken: string, refreshToken: string, user: Object } hoặc { error: string }
 */
export const login = async ({ email, password }) => {
  try {
    const response = await apiClient.post("/login", {
      email,
      password,
    });

    return handleAxiosResponse(response);
  } catch (error) {
    if (error.response) {
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      return {
        response: { ok: false, status: 0 },
        data: { error: "Không thể kết nối server. Kiểm tra backend giúp nhé." },
      };
    } else {
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

/**
 * 🔄 LÀM MỚI TOKEN
 * QUAN TRỌNG: Endpoint refresh token KHÔNG cần Authorization header
 * @param {Object} refreshData - Dữ liệu refresh token
 * @param {string} refreshData.refreshToken - Refresh token
 * @returns {Promise<Object>} - { accessToken: string, message: string } hoặc { error: string }
 */
export const refreshToken = async ({ refreshToken }) => {
  try {
    // Kiểm tra refreshToken có tồn tại không
    if (!refreshToken) {
      return {
        response: { ok: false, status: 400 },
        data: { error: "Không tìm thấy refresh token. Vui lòng đăng nhập lại." },
      };
    }
    
    // Gọi API refresh bằng axios trực tiếp (KHÔNG qua apiClient)
    // để tránh interceptor tự động thêm Authorization header với accessToken đã hết hạn
    const response = await axios.post(`${API_BASE_URL}/refresh`, {
      refreshToken,
    }, {
      headers: {
        "Content-Type": "application/json",
        // KHÔNG thêm Authorization header
      },
    });

    const result = handleAxiosResponse(response);
    
    // Lưu accessToken mới vào localStorage
    if (result.data && result.data.accessToken) {
      localStorage.setItem('accessToken', result.data.accessToken);
    }
    
    return result;
  } catch (error) {
    // Nếu refresh token hết hạn, xóa cả refresh token
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('accessToken');
    }
    
    if (error.response) {
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối đến máy chủ khi làm mới token." },
      };
    } else {
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

/**
 * 🔐 QUÊN MẬT KHẨU - Gửi mã OTP qua email
 * @param {Object} forgotPasswordData - Dữ liệu quên mật khẩu
 * @param {string} forgotPasswordData.email - Email cần reset mật khẩu
 * @returns {Promise<Object>} - { message: string } hoặc { error: string }
 */
export const forgotPassword = async ({ email }) => {
  try {
    const response = await apiClient.post("/forgot-password", {
      email,
    });

    return handleAxiosResponse(response);
  } catch (error) {
    if (error.response) {
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau." },
      };
    } else {
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

/**
 * 📲 XÁC MINH OTP (cho Quên Mật Khẩu)
 * @param {Object} verifyData - Dữ liệu xác minh
 * @param {string} verifyData.email - Email
 * @param {string} verifyData.otp - Mã OTP 6 số
 * @returns {Promise<Object>} - { message: string } hoặc { error: string }
 */
export const verifyOtp = async ({ email, otp }) => {
    try {
      const response = await apiClient.post("/verify-otp", {
        email,
        "Mã xác thực": otp, // 👈 Gửi key là "Mã xác thực"
      });
      return handleAxiosResponse(response);
    } catch (error) {
      if (error.response) {
        return {
          data: error.response.data || { error: "Đã xảy ra lỗi" },
          response: {
            ok: false,
            status: error.response.status,
            statusText: error.response.statusText,
          },
        };
      } else if (error.request) {
        return {
          response: { ok: false, status: 0 },
          data: { error: "Lỗi kết nối khi xác thực mã." },
        };
      } else {
        return {
          response: { ok: false, status: 0 },
          data: { error: error.message || "Đã xảy ra lỗi không xác định." },
        };
      }
    }
  };

/**
 * 🔑 RESET MẬT KHẨU - Đặt lại mật khẩu mới với OTP
 * @param {Object} resetPasswordData - Dữ liệu reset mật khẩu
 * @param {string} resetPasswordData.email - Email
 * @param {string} resetPasswordData.otp - Mã OTP (Backend sử dụng key "Mã xác thực")
 * @param {string} resetPasswordData.newPassword - Mật khẩu mới
 * @param {string} resetPasswordData.confirmPassword - Xác nhận mật khẩu mới
 * @returns {Promise<Object>} - { message: string } hoặc { error: string }
 */
export const resetPassword = async ({ email, otp, newPassword, confirmPassword }) => {
  try {
    const response = await apiClient.post("/reset-password", {
      email,
      "Mã xác thực": otp, // ⚠️ Backend yêu cầu key là "Mã xác thực" (tiếng Việt)
      newPassword,
      confirmPassword,
    });

    return handleAxiosResponse(response);
  } catch (error) {
    if (error.response) {
      return {
        data: error.response.data || { error: "Đã xảy ra lỗi" },
        response: {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
        },
      };
    } else if (error.request) {
      return {
        response: { ok: false, status: 0 },
        data: { error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau." },
      };
    } else {
      return {
        response: { ok: false, status: 0 },
        data: { error: error.message || "Đã xảy ra lỗi không xác định." },
      };
    }
  }
};

// Export API_BASE_URL để các component khác có thể sử dụng nếu cần
export { API_BASE_URL };

