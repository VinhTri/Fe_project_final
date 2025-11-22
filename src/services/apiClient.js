// src/services/apiClient.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api"; // đúng prefix /api của BE

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động gắn Authorization: Bearer <token> nếu có
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

export default apiClient;
