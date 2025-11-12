# 📚 Services Layer Documentation

## Tổng quan

Thư mục `services/` chứa tất cả các service để giao tiếp với Backend API. Các service này đã được tích hợp với **Axios** và có **Interceptor** để tự động:
- Thêm JWT token vào mỗi request
- Refresh token khi hết hạn (401)
- Handle errors một cách thống nhất

---

## 📦 Cấu trúc

```
services/
├── index.js                 # Export tất cả services
├── authService.js          # Authentication APIs
├── walletService.js        # Wallet management APIs
├── profileService.js       # User profile APIs
├── transactionService.js   # Transaction APIs
└── README.md               # Documentation
```

---

## 🔐 authService

### Import
```javascript
import { authService } from '../services';
// hoặc
import { authService } from '../services/authService';
```

### Methods

#### `register(data)`
Đăng ký tài khoản mới
```javascript
const result = await authService.register({
  fullName: "Nguyễn Văn A",
  email: "example@gmail.com",
  password: "Password@123",
  confirmPassword: "Password@123",
  recaptchaToken: "03AGd..."
});
// Returns: { message: "Đăng ký thành công..." }
```

#### `verify(data)`
Xác minh email với OTP
```javascript
const result = await authService.verify({
  email: "example@gmail.com",
  code: "123456"
});
// Returns: { message, accessToken, refreshToken }
// ✅ Tự động lưu tokens vào localStorage
```

#### `login(data)`
Đăng nhập
```javascript
const result = await authService.login({
  email: "example@gmail.com",
  password: "Password@123"
});
// Returns: { message, accessToken, refreshToken, user }
// ✅ Tự động lưu tokens và user info vào localStorage
```

#### `forgotPassword(email)`
Quên mật khẩu
```javascript
await authService.forgotPassword("example@gmail.com");
// Returns: { message: "Mã xác thực đã gửi đến email" }
```

#### `resetPassword(data)`
Đặt lại mật khẩu
```javascript
await authService.resetPassword({
  email: "example@gmail.com",
  "Mã xác thực": "123456",
  newPassword: "NewPassword@123",
  confirmPassword: "NewPassword@123"
});
```

#### `logout()`
Đăng xuất
```javascript
authService.logout();
// ✅ Clear tokens và redirect về /login
```

#### `getCurrentUser()`
Lấy thông tin user từ localStorage
```javascript
const user = authService.getCurrentUser();
// Returns: { userId, fullName, email, ... } hoặc null
```

#### `isAuthenticated()`
Kiểm tra đã đăng nhập
```javascript
const isLoggedIn = authService.isAuthenticated();
// Returns: boolean
```

---

## 💰 walletService

### Import
```javascript
import { walletService } from '../services';
```

### Methods

#### `getWallets()`
Lấy danh sách tất cả ví (owned + shared)
```javascript
const data = await walletService.getWallets();
// Returns: { wallets: SharedWalletDTO[], total: number }
```

#### `createWallet(data)`
Tạo ví mới
```javascript
const result = await walletService.createWallet({
  walletName: "Ví Tiền Mặt",
  currencyCode: "VND",
  initialBalance: 1000000,
  description: "Ví chi tiêu hàng ngày",
  setAsDefault: true
});
// Returns: { message, wallet }
```

#### `getWalletDetails(walletId)`
Lấy chi tiết 1 ví
```javascript
const data = await walletService.getWalletDetails(1);
// Returns: { wallet }
```

#### `setDefaultWallet(walletId)`
Đặt ví làm mặc định
```javascript
await walletService.setDefaultWallet(1);
// Returns: { message }
```

#### `shareWallet(walletId, email)`
Chia sẻ ví với người khác
```javascript
const result = await walletService.shareWallet(1, "nguoinha@gmail.com");
// Returns: { message, member }
```

#### `getWalletMembers(walletId)`
Lấy danh sách thành viên của ví
```javascript
const data = await walletService.getWalletMembers(1);
// Returns: { members: WalletMemberDTO[], total: number }
```

#### `removeMember(walletId, memberUserId)`
Xóa thành viên (chỉ OWNER)
```javascript
await walletService.removeMember(1, 2);
// Returns: { message }
```

#### `leaveWallet(walletId)`
Rời khỏi ví (MEMBER)
```javascript
await walletService.leaveWallet(1);
// Returns: { message }
```

#### `checkAccess(walletId)`
Kiểm tra quyền truy cập
```javascript
const access = await walletService.checkAccess(1);
// Returns: { hasAccess, isOwner, role }
```

### Merge Wallet APIs

#### `getMergeCandidates(sourceWalletId)`
Lấy danh sách ví có thể gộp
```javascript
const data = await walletService.getMergeCandidates(1);
// Returns: { candidateWallets, ineligibleWallets, total }
```

#### `previewMerge(targetWalletId, sourceWalletId)`
Preview trước khi gộp ví
```javascript
const preview = await walletService.previewMerge(2, 1);
// Returns: { preview: MergeWalletPreviewResponse }
```

#### `mergeWallets(targetWalletId, sourceWalletId)`
Thực hiện gộp ví
```javascript
const result = await walletService.mergeWallets(2, 1);
// Returns: { success, message, result: MergeWalletResponse }
```

#### `getMergeHistory()`
Lấy lịch sử gộp ví
```javascript
const history = await walletService.getMergeHistory();
// Returns: { history, total, message }
```

---

## 👤 profileService

### Import
```javascript
import { profileService } from '../services';
```

### Methods

#### `getProfile()`
Lấy thông tin profile
```javascript
const data = await profileService.getProfile();
// Returns: { user }
// ✅ Tự động cập nhật localStorage
```

#### `updateProfile(data)`
Cập nhật profile
```javascript
const result = await profileService.updateProfile({
  fullName: "Nguyễn Văn B",
  avatar: "base64_string_or_url"
});
// Returns: { message, user }
// ✅ Tự động cập nhật localStorage
```

#### `changePassword(data)`
Đổi mật khẩu

**Trường hợp 1: Đổi từ mật khẩu mặc định**
```javascript
await profileService.changePassword({
  newPassword: "NewPassword@123",
  confirmPassword: "NewPassword@123"
});
```

**Trường hợp 2: Đổi mật khẩu thường**
```javascript
await profileService.changePassword({
  oldPassword: "OldPassword@123",
  newPassword: "NewPassword@123",
  confirmPassword: "NewPassword@123"
});
```

#### `hasPassword()`
Kiểm tra có mật khẩu chưa
```javascript
const data = await profileService.hasPassword();
// Returns: { hasPassword: boolean }
```

#### `checkDefaultPassword()`
Kiểm tra đang dùng mật khẩu mặc định
```javascript
const data = await profileService.checkDefaultPassword();
// Returns: { hasDefaultPassword: boolean, message }
```

---

## 💸 transactionService

### Import
```javascript
import { transactionService } from '../services';
```

### Methods

#### `createExpense(data)`
Tạo giao dịch chi tiêu
```javascript
const result = await transactionService.createExpense({
  amount: 50000,
  transactionDate: "2024-01-01T14:30:00",
  walletId: 1,
  categoryId: 5,
  note: "Mua đồ ăn trưa",
  imageUrl: "https://example.com/receipt.jpg"  // optional
});
// Returns: { message, transaction }
```

#### `createIncome(data)`
Tạo giao dịch thu nhập
```javascript
const result = await transactionService.createIncome({
  amount: 5000000,
  transactionDate: "2024-01-01T09:00:00",
  walletId: 1,
  categoryId: 10,
  note: "Lương tháng 1"
});
// Returns: { message, transaction }
```

---

## 🔧 Axios Config

File `api/axiosConfig.js` đã được cấu hình với:

### Features
- ✅ **Base URL**: `http://localhost:8080`
- ✅ **Timeout**: 30 seconds
- ✅ **Auto add JWT token** vào mỗi request
- ✅ **Auto refresh token** khi 401
- ✅ **Error handling** thống nhất
- ✅ **Console logging** (chỉ trong development)

### Request Interceptor
Tự động thêm JWT token vào header:
```javascript
Authorization: Bearer {accessToken}
```

### Response Interceptor
- **Success**: Log response trong development
- **Error 401**: Tự động refresh token và retry request
- **Other errors**: Log chi tiết và trả về error

---

## 📝 Error Handling

### Try-Catch Pattern
```javascript
try {
  const result = await walletService.createWallet(data);
  console.log('Success:', result);
} catch (error) {
  // Axios error
  if (error.response) {
    console.error('Error:', error.response.data.error);
    alert(error.response.data.error);
  } else {
    console.error('Error:', error.message);
  }
}
```

### Error Response Format
Backend luôn trả về format:
```json
{
  "error": "Mô tả lỗi chi tiết"
}
```

Access error message:
```javascript
error.response?.data?.error || error.message
```

---

## 🎯 Best Practices

### 1. Sử dụng try-catch
```javascript
const handleLogin = async () => {
  try {
    const result = await authService.login(formData);
    // Success
    navigate('/home');
  } catch (error) {
    // Error handling
    setError(error.response?.data?.error || 'Có lỗi xảy ra');
  }
};
```

### 2. Loading state
```javascript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  try {
    setLoading(true);
    const data = await walletService.getWallets();
    setWallets(data.wallets);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### 3. Import multiple services
```javascript
import { authService, walletService, profileService } from '../services';
```

### 4. Async/await over .then()
```javascript
// ✅ Good
const result = await walletService.getWallets();

// ❌ Avoid
walletService.getWallets().then(result => { ... });
```

---

## 🔗 Related Files

- Backend API Documentation: `/FRONTEND_API_DOCUMENTATION.md`
- Axios Config: `/src/api/axiosConfig.js`
- Wallet Data Context: `/src/home/store/WalletDataContext.jsx`

---

## 📞 Support

Nếu gặp lỗi API:
1. Check Console logs (request/response đều được log)
2. Check Network tab (F12)
3. Verify JWT token trong localStorage
4. Check backend có chạy không (port 8080)

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-11

