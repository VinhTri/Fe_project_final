# Phân tích cấu trúc thư mục dự án

## 📊 Tổng quan

Dự án có cấu trúc khá tốt nhưng cần một số cải thiện để nhất quán và dễ maintain hơn.

## ✅ Điểm mạnh

1. **Pages** - Tổ chức tốt theo route type:
   - `src/pages/Auth/` - Authentication pages
   - `src/pages/Home/` - Main app pages
   - `src/pages/Admin/` - Admin pages

2. **Components** - Tổ chức theo feature (Feature-based):
   - `budgets/`, `categories/`, `wallets/`, `transactions/`, `funds/`, `feedback/`
   - Có `common/` cho shared components

3. **Styles** - Mirror structure của pages/components:
   - `styles/home/`, `styles/admin/`, `styles/AuthLayout.css`

4. **Hooks & Utils** - Tách riêng, dễ tái sử dụng

## ⚠️ Vấn đề cần cải thiện

### 1. Context/Store Location (Quan trọng)

**Hiện tại:**
```
src/home/store/
  - AuthContext.jsx          ← Dùng toàn cục nhưng ở trong /home/
  - WalletDataContext.jsx
  - BudgetDataContext.jsx
  - CategoryDataContext.jsx
  - FeedbackDataContext.jsx
  - NotificationContext.jsx
  - LanguageContext.jsx

src/store/
  - DataStore.js            ← Utility cho localStorage
```

**Vấn đề:**
- Context files ở `src/home/store/` nhưng được import từ nhiều nơi (Auth pages, Admin pages, etc.)
- Tên thư mục `home/store` gây hiểu lầm là chỉ dùng cho Home pages
- Có 2 pattern: Context API (`home/store/`) và utility (`store/`)

**Đề xuất:**
```
src/contexts/              ← Đổi tên từ home/store
  - AuthContext.jsx
  - WalletDataContext.jsx
  - BudgetDataContext.jsx
  - CategoryDataContext.jsx
  - FeedbackDataContext.jsx
  - NotificationContext.jsx
  - LanguageContext.jsx

src/store/                ← Giữ cho utilities
  - DataStore.js
```

**Hoặc:**
```
src/store/
  - contexts/
    - AuthContext.jsx
    - WalletDataContext.jsx
    - ...
  - DataStore.js
```

### 2. Service Layer Duplication (Quan trọng)

**Hiện tại:**
```
src/services/
  - api-client.js          ← Tất cả APIs (fetch-based)
  - auth.service.js         ← Auth APIs (axios-based)
  - profile.service.js      ← Profile APIs (axios-based)
  - wallet.service.js
  - notification.service.js
  - adminUserApi.js
  - loginLogApi.js
```

**Vấn đề:**
- Có 2 cách gọi API: `api-client.js` (fetch) và các service files (axios)
- Một số file dùng `api-client.js`, một số dùng service riêng
- Không nhất quán về error handling và response format

**Đề xuất - Option 1: Dùng api-client.js (Recommended)**
```
src/services/
  - api-client.js          ← Giữ làm main API client
  - index.js               ← Export tất cả APIs từ api-client
```

**Đề xuất - Option 2: Tách riêng services (Nếu muốn modular hơn)**
```
src/services/
  - api-client.js          ← Base client với interceptors
  - auth.service.js        ← Import từ api-client, wrap auth APIs
  - profile.service.js      ← Import từ api-client, wrap profile APIs
  - wallet.service.js
  - ...
  - index.js               ← Export tất cả
```

**Lưu ý:** Nếu chọn Option 2, cần refactor để tất cả dùng cùng base client.

### 3. File không sử dụng

**File cần xóa:**
- `src/components/common/Sidebar.jsx` - Không được import, chỉ dùng `HomeSidebar`

### 4. Naming Convention

**Cần thống nhất:**
- Service files: `*.service.js` hoặc `*Api.js` (hiện tại có cả 2)
- Context files: `*Context.jsx` (đã nhất quán)

## 📋 Kế hoạch cải thiện

### Bước 1: Di chuyển Context files
```bash
# Di chuyển từ src/home/store/ → src/contexts/
mv src/home/store/* src/contexts/
rmdir src/home/store
```

**Cần update imports trong:**
- `src/index.jsx`
- `src/ProtectedRoute.jsx`
- Tất cả pages và components import contexts

### Bước 2: Thống nhất Service layer

**Chọn 1 trong 2:**
- **Option A:** Dùng `api-client.js` làm main, xóa các service files riêng
- **Option B:** Giữ service files nhưng refactor để dùng cùng base client

### Bước 3: Xóa file không dùng
- Xóa `src/components/common/Sidebar.jsx`

### Bước 4: Update imports
- Tìm và thay thế tất cả imports từ `home/store` → `contexts`
- Thống nhất imports cho services

## 🎯 Kết luận

**Cấu trúc hiện tại: 7/10**

**Sau khi cải thiện: 9/10**

Cấu trúc cơ bản tốt, chỉ cần:
1. Di chuyển contexts ra ngoài `/home/`
2. Thống nhất service layer
3. Xóa file không dùng
4. Update imports

Sau khi làm xong, codebase sẽ nhất quán và dễ maintain hơn nhiều!

