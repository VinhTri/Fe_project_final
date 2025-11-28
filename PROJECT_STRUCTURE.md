# Cấu trúc dự án

## 📁 Cấu trúc thư mục

```
src/
├── components/          # React components (tổ chức theo feature)
│   ├── budgets/         # Budget components
│   ├── categories/      # Category components
│   ├── common/          # Shared components (Modal, Toast, Header, Footer)
│   │   ├── Modal/
│   │   └── Toast/
│   ├── feedback/        # Feedback components
│   ├── funds/           # Fund components
│   ├── home/            # Home-specific components
│   │   ├── Sidebar/
│   │   └── Topbar/
│   ├── transactions/    # Transaction components
│   │   └── utils/       # Transaction utilities
│   └── wallets/         # Wallet components
│       ├── tabs/        # Wallet tab components
│       └── utils/        # Wallet utilities
│
├── contexts/            # ✅ Context providers (global state)
│   ├── AuthContext.jsx
│   ├── BudgetDataContext.jsx
│   ├── CategoryDataContext.jsx
│   ├── FeedbackDataContext.jsx
│   ├── LanguageContext.jsx
│   ├── NotificationContext.jsx
│   └── WalletDataContext.jsx
│
├── hooks/              # Custom React hooks
│   ├── useCurrency.js
│   ├── useDateFormat.js
│   ├── useOnClickOutside.js
│   └── useToggleMask.js
│
├── layouts/           # Layout components
│   ├── AuthLayout.jsx
│   └── HomeLayout.jsx
│
├── pages/             # Page components (tổ chức theo route)
│   ├── Admin/         # Admin pages
│   │   ├── AdminReviewsPage.jsx
│   │   └── AdminUsersPage.jsx
│   ├── Auth/          # Authentication pages
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── OAuthCallback.jsx
│   │   └── RegisterPage.jsx
│   └── Home/          # Home pages
│       ├── BudgetsPage.jsx
│       ├── CategoriesPage.jsx
│       ├── DashboardPage.jsx
│       ├── FeedbackPage.jsx
│       ├── FundsPage.jsx
│       ├── ReportsPage.jsx
│       ├── SettingsPage.jsx
│       ├── TransactionsPage.jsx
│       └── WalletsPage.jsx
│
├── services/          # API services
│   ├── api-client.js  # Main API client (fetch-based)
│   ├── adminUserApi.js
│   ├── auth.service.js
│   ├── loginLogApi.js
│   ├── notification.service.js
│   ├── profile.service.js
│   └── wallet.service.js
│
├── storage/           # Storage utilities
│   └── DataStore.js   # localStorage utility
│
├── styles/            # CSS files (mirror structure)
│   ├── admin/
│   ├── home/
│   ├── AuthForms.css
│   ├── AuthLayout.css
│   ├── Footer.css
│   ├── GlobalSearch.css
│   ├── Header.css
│   ├── ThemeMode.css
│   └── variables.css
│
└── utils/            # Utility functions
    ├── dateFormat.js
    ├── dateFormatSettings.js
    ├── formatMoney.js
    ├── formatMoneyInput.js
    └── moneyFormatSettings.js
```

## 🎯 Nguyên tắc tổ chức

### 1. Components
- **Tổ chức theo feature**: Mỗi feature có thư mục riêng
- **Common components**: Đặt trong `components/common/`
- **Utils riêng**: Mỗi feature có thể có `utils/` riêng nếu cần

### 2. Contexts
- **Vị trí**: `src/contexts/` (không phải `home/store/`)
- **Mục đích**: Global state management cho toàn app
- **Naming**: `*Context.jsx` hoặc `*DataContext.jsx`

### 3. Pages
- **Tổ chức theo route**: Mỗi route group có thư mục riêng
- **Naming**: `*Page.jsx`

### 4. Services
- **API clients**: Tập trung trong `services/`
- **Naming**: `*.service.js` hoặc `*Api.js`

### 5. Utils
- **Global utilities**: Đặt trong `src/utils/`
- **Feature-specific utilities**: Đặt trong `components/{feature}/utils/`

### 6. Styles
- **Mirror structure**: CSS files theo cấu trúc components/pages
- **Global styles**: Đặt trong `styles/` root

## 📝 Import patterns

### Contexts
```javascript
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
```

### Utils
```javascript
import { formatMoney } from "../../utils/formatMoney";
import { formatVietnamDate } from "../../utils/dateFormat";
```

### Components
```javascript
import WalletDetail from "../../components/wallets/WalletDetail";
import Toast from "../../components/common/Toast/Toast";
```

### Services
```javascript
import { login } from "../../services/auth.service";
import { walletAPI } from "../../services/api-client";
```

## 🔄 Thay đổi gần đây

### ✅ Đã hoàn thành
1. **Di chuyển contexts**: `src/home/store/` → `src/contexts/`
   - Cập nhật 50+ imports
   - Xóa thư mục cũ

2. **Refactor formatMoney**: Tập trung vào `src/utils/formatMoney.js`
   - Loại bỏ code duplicate trong wallets, transactions, funds

3. **Refactor dateFormat**: Tập trung vào `src/utils/dateFormat.js`
   - Thống nhất date formatting trong toàn app

4. **Refactor wallet components**: Tách tab components
   - Giảm WalletDetail.jsx từ 3195 → 720 dòng

## 🎨 Best Practices

1. **DRY (Don't Repeat Yourself)**
   - Dùng utils cho logic chung
   - Tái sử dụng components

2. **Separation of Concerns**
   - Components: UI logic
   - Contexts: Global state
   - Services: API calls
   - Utils: Pure functions

3. **Naming Conventions**
   - Components: PascalCase (`WalletDetail.jsx`)
   - Utils: camelCase (`formatMoney.js`)
   - Contexts: PascalCase (`AuthContext.jsx`)
   - Pages: PascalCase (`WalletsPage.jsx`)

4. **File Organization**
   - Mỗi component trong file riêng
   - Utils tách riêng khi dùng nhiều nơi
   - Styles mirror structure

## 📚 Tài liệu liên quan

- `NEW_STRUCTURE_PLAN.md` - Kế hoạch thiết kế lại cấu trúc
- `STRUCTURE_REVIEW.md` - Đánh giá cấu trúc cũ

