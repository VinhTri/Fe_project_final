// ================================
// 📦 WALLET API SERVICE
// ================================

// ⚙️ Cấu hình base URL backend
const API_BASE = "http://localhost:8080/wallets";

// ⚙️ Helper: tự động thêm JWT token vào header
function getAuthHeaders() {
  const token = localStorage.getItem("token"); // token lưu sau khi đăng nhập
  if (!token) throw new Error("Chưa có token. Hãy đăng nhập trước!");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
async function apiCall(url, options) {
  try {
    const res = await fetch(url, { ...options, headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi server");
    return data;
  } catch (err) {
    throw err;
  }
}

// Sử dụng:
export async function getMyWallets() {
  return apiCall(API_BASE);
}
// =====================================================
// 🟩 1. LẤY DANH SÁCH VÍ (GET /wallets)
// =====================================================
export async function getMyWallets() {
  const res = await fetch(`${API_BASE}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return res.json();
}

// =====================================================
// 🟦 2. TẠO VÍ MỚI (POST /wallets/create)
// =====================================================
export async function createWallet(data) {
  const res = await fetch(`${API_BASE}/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      walletName: data.walletName, // tên ví
      currencyCode: data.currencyCode, // mã tiền tệ (VD: "VND", "USD")
      initialBalance: data.initialBalance, // số dư ban đầu
      description: data.description || "", // mô tả (nếu có)
      setAsDefault: data.setAsDefault ?? false, // có đặt làm mặc định không
    }),
  });

  return res.json();
}

// =====================================================
// 🟨 3. LẤY CHI TIẾT 1 VÍ (GET /wallets/{walletId})
// =====================================================
export async function getWalletDetails(walletId) {
  const res = await fetch(`${API_BASE}/${walletId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return res.json();
}

// =====================================================
// 🟧 4. ĐẶT VÍ MẶC ĐỊNH (PATCH /wallets/{walletId}/set-default)
// =====================================================
export async function setDefaultWallet(walletId) {
  const res = await fetch(`${API_BASE}/${walletId}/set-default`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  return res.json();
}

// =====================================================
// 🟪 5. CHIA SẺ VÍ VỚI NGƯỜI KHÁC (POST /wallets/{walletId}/share)
// =====================================================
export async function shareWallet(walletId, email) {
  const res = await fetch(`${API_BASE}/${walletId}/share`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ email }),
  });
  return res.json();
}

// =====================================================
// 🟫 6. LẤY DANH SÁCH THÀNH VIÊN (GET /wallets/{walletId}/members)
// =====================================================
export async function getWalletMembers(walletId) {
  const res = await fetch(`${API_BASE}/${walletId}/members`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return res.json();
}

// =====================================================
// 🟥 7. XÓA THÀNH VIÊN KHỎI VÍ (DELETE /wallets/{walletId}/members/{memberUserId})
// =====================================================
export async function removeMember(walletId, memberUserId) {
  const res = await fetch(`${API_BASE}/${walletId}/members/${memberUserId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return res.json();
}

// =====================================================
// 🟦 8. THÀNH VIÊN RỜI KHỎI VÍ (POST /wallets/{walletId}/leave)
// =====================================================
export async function leaveWallet(walletId) {
  const res = await fetch(`${API_BASE}/${walletId}/leave`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return res.json();
}

// =====================================================
// 🟩 9. KIỂM TRA QUYỀN TRUY CẬP (GET /wallets/{walletId}/access)
// =====================================================
export async function checkWalletAccess(walletId) {
  const res = await fetch(`${API_BASE}/${walletId}/access`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return res.json();
}
