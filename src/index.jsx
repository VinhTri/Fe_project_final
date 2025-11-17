import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/variables.css";

// ✅ Import providers
import { WalletDataProvider } from "./home/store/WalletDataContext";
import { BudgetDataProvider } from "./home/store/BudgetDataContext";
import { CategoryDataProvider } from "./home/store/CategoryDataContext";
import { TransactionDataProvider } from "./home/store/TransactionDataContext";

// Global error handler để bắt unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Ngăn lỗi hiển thị trong console (optional)
  // event.preventDefault();
});

// Global error handler cho errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* ✅ Wrap with providers - CategoryDataProvider first, then others */}
    <CategoryDataProvider>
      <WalletDataProvider>
        <TransactionDataProvider>
          <BudgetDataProvider>
            <App />
          </BudgetDataProvider>
        </TransactionDataProvider>
      </WalletDataProvider>
    </CategoryDataProvider>
  </React.StrictMode>
);

