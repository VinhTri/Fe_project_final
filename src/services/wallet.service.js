/**
 * Wallet Service - Service layer cho các API calls liên quan đến wallet management
 * Base URL: http://localhost:8080/wallets
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:8080/wallets";

// Tạo axios instance với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để tự động thêm Authorization header vào mỗi request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Helper function để xử lý response từ axios
 * @param {Object} axiosResponse - Response object từ axios
 * @returns {Object} - { data, response }
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
 * Helper function để xử lý lỗi chung (tránh lặp code)
 * @param {Object} error - Lỗi từ axios
 * @param {string} contextMsg - Thông báo ngữ cảnh (ví dụ: "tạo ví")
 */
const handleError = (error, contextMsg) => {
  console.error(`wallet.service: Error during ${contextMsg}:`, error);
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
      data: { error: `Lỗi kết nối đến máy chủ khi ${contextMsg}.` },
    };
  } else {
    return {
      response: { ok: false, status: 0 },
      data: { error: error.message || "Đã xảy ra lỗi không xác định." },
    };
  }
};

// ========================= CREATE WALLET =========================

/**
 * 📝 TẠO VÍ MỚI
 */
export const createWallet = async (createData) => {
  try {
    const response = await apiClient.post("/create", createData);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "tạo ví");
  }
};

// ========================= GET ALL WALLETS =========================

/**
 * 📋 LẤY TẤT CẢ VÍ (Đã tham gia/Sở hữu)
 */
export const getMyWallets = async () => {
  try {
    const response = await apiClient.get("");
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "lấy danh sách ví");
  }
};

/**
 * 🤝 LẤY DANH SÁCH VÍ MÀ TÔI CÓ QUYỀN TRUY CẬP (Alias cho getMyWallets)
 * Hàm này cần thiết để sửa lỗi import bên ParticipateManager.jsx
 */
export const getAllAccessibleWallets = async () => {
  return getMyWallets();
};

// ========================= GET WALLET DETAILS =========================

/**
 * 🔍 LẤY CHI TIẾT VÍ
 */
export const getWalletDetails = async (walletId) => {
  try {
    const response = await apiClient.get(`/${walletId}`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "lấy chi tiết ví");
  }
};

// ========================= SET DEFAULT WALLET =========================

/**
 * ⭐ ĐẶT VÍ MẶC ĐỊNH
 */
export const setDefaultWallet = async (walletId) => {
  try {
    const response = await apiClient.patch(`/${walletId}/set-default`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "đặt ví mặc định");
  }
};

// ========================= INVITATIONS (TÍNH NĂNG MỚI) =========================

/**
 * 📩 LẤY DANH SÁCH LỜI MỜI THAM GIA VÍ (PENDING)
 * @returns {Promise<Object>} - { invitations: Array, total: number }
 */
export const getInvitations = async () => {
  try {
    const response = await apiClient.get("/invitations");
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "lấy danh sách lời mời");
  }
};

/**
 * ✅ PHẢN HỒI LỜI MỜI (ĐỒNG Ý / TỪ CHỐI)
 * @param {number} walletId - ID ví được mời
 * @param {boolean} accept - true (Đồng ý) | false (Từ chối)
 */
export const respondToInvitation = async (walletId, accept) => {
  try {
    // Backend nhận tham số qua query param: ?accept=true/false
    const response = await apiClient.post(`/${walletId}/invitation`, null, {
      params: { accept },
    });
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "phản hồi lời mời");
  }
};

// ========================= MEMBER MANAGEMENT =========================

/**
 * 🔗 GỬI LỜI MỜI CHO NGƯỜI KHÁC
 * (Lưu ý: Backend sẽ tạo trạng thái PENDING cho user này)
 */
export const shareWallet = async (walletId, email) => {
  try {
    const response = await apiClient.post(`/${walletId}/share`, { email });
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "chia sẻ ví");
  }
};

/**
 * 👥 LẤY DANH SÁCH THÀNH VIÊN
 */
export const getWalletMembers = async (walletId) => {
  try {
    const response = await apiClient.get(`/${walletId}/members`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "lấy danh sách thành viên");
  }
};

/**
 * 🚫 XÓA THÀNH VIÊN
 */
export const removeMember = async (walletId, memberUserId) => {
  try {
    const response = await apiClient.delete(
      `/${walletId}/members/${memberUserId}`
    );
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "xóa thành viên");
  }
};

/**
 * 🚪 RỜI KHỎI VÍ
 */
export const leaveWallet = async (walletId) => {
  try {
    const response = await apiClient.post(`/${walletId}/leave`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "rời khỏi ví");
  }
};

/**
 * 👑 CẬP NHẬT QUYỀN THÀNH VIÊN
 */
export const updateMemberRole = async (walletId, memberId, newRole) => {
  try {
    // Dựa trên Controller Backend: PUT /wallets/{walletId}/members/{memberId}/role?role=EDITOR
    const response = await apiClient.put(
      `/${walletId}/members/${memberId}/role`, // Endpoint phải khớp với logic trong WalletServiceImpl -> updateMemberRole
      null,
      { params: { role: newRole } }
    );
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "cập nhật quyền thành viên");
  }
};

// ========================== ACCESS CHECK ==========================

export const checkAccess = async (walletId) => {
  try {
    const response = await apiClient.get(`/${walletId}/access`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "kiểm tra quyền truy cập");
  }
};

// ========================== MERGE WALLET ==========================

export const getMergeCandidates = async (sourceWalletId) => {
  try {
    const response = await apiClient.get(`/${sourceWalletId}/merge-candidates`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "lấy danh sách ví gộp");
  }
};

export const previewMerge = async (
  targetWalletId,
  sourceWalletId,
  targetCurrency
) => {
  try {
    const response = await apiClient.get(`/${targetWalletId}/merge-preview`, {
      params: { sourceWalletId, targetCurrency },
    });
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "xem trước gộp ví");
  }
};

export const mergeWallets = async (targetWalletId, mergeData) => {
  try {
    const response = await apiClient.post(
      `/${targetWalletId}/merge`,
      mergeData
    );
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "gộp ví");
  }
};

// ========================== UPDATE & DELETE WALLET ==========================

export const updateWallet = async (walletId, updateData) => {
  try {
    const response = await apiClient.put(`/${walletId}`, updateData);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "cập nhật ví");
  }
};

export const deleteWallet = async (walletId) => {
  try {
    const response = await apiClient.delete(`/${walletId}`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "xóa ví");
  }
};

// ========================== TRANSFER MONEY ==========================

export const getTransferTargets = async (walletId) => {
  try {
    const response = await apiClient.get(`/${walletId}/transfer-targets`);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "lấy danh sách ví đích");
  }
};

export const transferMoney = async (transferData) => {
  try {
    const fromWalletId =
      transferData.fromWalletId ||
      transferData.sourceWalletId ||
      transferData.sourceId;
    const toWalletId =
      transferData.toWalletId ||
      transferData.targetWalletId ||
      transferData.targetId;
    const note = transferData.note || transferData.description || "";

    const apiPayload = {
      fromWalletId,
      toWalletId,
      amount: transferData.amount,
      targetCurrencyCode: transferData.targetCurrencyCode,
      note,
    };

    const response = await apiClient.post("/transfer", apiPayload);
    return handleAxiosResponse(response);
  } catch (error) {
    return handleError(error, "chuyển tiền");
  }
};

// Export API_BASE_URL và Default Object
export { API_BASE_URL };

export default {
  createWallet,
  getMyWallets,
  getAllAccessibleWallets, // <--- ĐÃ THÊM HÀM NÀY ĐỂ FIX LỖI
  getWalletDetails,
  setDefaultWallet,
  // New Invitation Features
  getInvitations,
  respondToInvitation,
  // Existing Features
  shareWallet,
  getWalletMembers,
  removeMember,
  leaveWallet,
  updateMemberRole,
  checkAccess,
  getMergeCandidates,
  previewMerge,
  mergeWallets,
  updateWallet,
  deleteWallet,
  getTransferTargets,
  transferMoney,
};
