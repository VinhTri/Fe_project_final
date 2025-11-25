// src/services/walletApi.js
/**
 * Wallet API – Gọi toàn bộ API ví theo WalletController (Spring)
 *
 * BE:
 *   @RestController
 *   @RequestMapping("/wallets")
 */

import apiClient, {
  handleAxiosResponse,
  handleAxiosError,
} from "./apiClient";

// Base path trên backend
const BASE = "/wallets";

// ======================= API WALLETS =======================

/**
 * GET /wallets
 * Lấy tất cả ví mà user hiện tại có quyền truy cập (cá nhân + chia sẻ)
 * Response: { wallets: SharedWalletDTO[], total: number }
 */
export const getMyWallets = async () => {
  try {
    const res = await apiClient.get(BASE);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * GET /wallets/{walletId}
 * Lấy chi tiết 1 ví
 * Response: { wallet: Wallet }
 */
export const getWalletDetails = async (walletId) => {
  try {
    const res = await apiClient.get(`${BASE}/${walletId}`);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * POST /wallets/create
 * Tạo ví mới
 */
export const createWallet = async (payload) => {
  try {
    const res = await apiClient.post(`${BASE}/create`, payload);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * PATCH /wallets/{walletId}/set-default
 * Đặt ví mặc định cho user
 */
export const setDefaultWallet = async (walletId) => {
  try {
    const res = await apiClient.patch(`${BASE}/${walletId}/set-default`);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * PUT /wallets/{walletId}
 * Cập nhật thông tin ví
 */
export const updateWallet = async (walletId, payload) => {
  try {
    const res = await apiClient.put(`${BASE}/${walletId}`, payload);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * DELETE /wallets/{walletId}
 * Xóa ví
 */
export const deleteWallet = async (walletId) => {
  try {
    const res = await apiClient.delete(`${BASE}/${walletId}`);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

// ======================= SHARE / MEMBER =======================

/**
 * POST /wallets/{walletId}/share
 * Chia sẻ ví cho 1 user khác
 */
export const shareWallet = async (walletId, payload) => {
  try {
    const res = await apiClient.post(`${BASE}/${walletId}/share`, payload);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * GET /wallets/{walletId}/members
 * Lấy danh sách thành viên của ví
 */
export const getWalletMembers = async (walletId) => {
  try {
    const res = await apiClient.get(`${BASE}/${walletId}/members`);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * DELETE /wallets/{walletId}/members/{memberUserId}
 * Owner xóa 1 member ra khỏi ví
 */
export const removeWalletMember = async (walletId, memberUserId) => {
  try {
    const res = await apiClient.delete(
      `${BASE}/${walletId}/members/${memberUserId}`
    );
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * POST /wallets/{walletId}/leave
 * Member tự rời khỏi ví
 */
export const leaveWallet = async (walletId) => {
  try {
    const res = await apiClient.post(`${BASE}/${walletId}/leave`);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * GET /wallets/{walletId}/access
 * Check quyền trên 1 ví
 */
export const checkWalletAccess = async (walletId) => {
  try {
    const res = await apiClient.get(`${BASE}/${walletId}/access`);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

// ======================= MERGE WALLETS =======================

/**
 * GET /wallets/{sourceWalletId}/merge-candidates
 */
export const getMergeCandidates = async (sourceWalletId) => {
  try {
    const res = await apiClient.get(
      `${BASE}/${sourceWalletId}/merge-candidates`
    );
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * GET /wallets/{targetWalletId}/merge-preview
 */
export const previewMerge = async (
  targetWalletId,
  { sourceWalletId, targetCurrency }
) => {
  try {
    const res = await apiClient.get(`${BASE}/${targetWalletId}/merge-preview`, {
      params: { sourceWalletId, targetCurrency },
    });
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * POST /wallets/{targetWalletId}/merge
 */
export const mergeWallets = async (targetWalletId, payload) => {
  try {
    const res = await apiClient.post(`${BASE}/${targetWalletId}/merge`, payload);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

// ======================= TRANSFER MONEY =======================

/**
 * GET /wallets/{walletId}/transfer-targets
 */
export const getTransferTargets = async (walletId) => {
  try {
    const res = await apiClient.get(`${BASE}/${walletId}/transfer-targets`);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * POST /wallets/transfer
 */
export const transferMoney = async (payload) => {
  try {
    const res = await apiClient.post(`${BASE}/transfer`, payload);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * GET /wallets/transfers
 */
export const getAllTransfers = async () => {
  try {
    const res = await apiClient.get(`${BASE}/transfers`);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * PUT /wallets/transfers/{transferId}
 */
export const updateTransfer = async (transferId, payload) => {
  try {
    const res = await apiClient.put(`${BASE}/transfers/${transferId}`, payload);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

/**
 * DELETE /wallets/transfers/{transferId}
 */
export const deleteTransfer = async (transferId) => {
  try {
    const res = await apiClient.delete(`${BASE}/transfers/${transferId}`);
    return handleAxiosResponse(res);
  } catch (error) {
    return handleAxiosError(error);
  }
};

// ======================= EXPORT ALIAS CHO TÊN CŨ =======================

// Để các component cũ gọi walletAPI.removeMember(...) vẫn chạy
export const removeMember = removeWalletMember;
