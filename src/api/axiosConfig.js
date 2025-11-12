// ========================================
// 📦 AXIOS CONFIGURATION WITH INTERCEPTORS
// ========================================
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// ====== REQUEST INTERCEPTOR ======
// Tự động thêm JWT token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ====== RESPONSE INTERCEPTOR ======
// Tự động refresh token khi hết hạn (401)
api.interceptors.response.use(
  (response) => {
    // Log response (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (Unauthorized) và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('🔄 Refreshing access token...');
        
        // Gọi API refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const newAccessToken = response.data.accessToken;
        
        // Lưu token mới
        localStorage.setItem('accessToken', newAccessToken);
        
        // Retry request gốc với token mới
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Refresh token failed:', refreshError);
        
        // Clear tokens và redirect về login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Hiển thị thông báo
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        
        // Redirect về login
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    // Log error
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
    });

    return Promise.reject(error);
  }
);

export default api;

