// src/index.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/variables.css";

// Providers
import { WalletDataProvider } from "./home/store/WalletDataContext";
import { BudgetDataProvider } from "./home/store/BudgetDataContext";
import { CategoryDataProvider } from "./home/store/CategoryDataContext";
import { AuthProvider } from "./home/store/AuthContext";
import { ToastProvider } from "./components/common/Toast/ToastContext";
import { FeedbackProvider } from "./home/store/FeedbackDataContext";
import { NotificationProvider } from "./home/store/NotificationContext";   // ⬅️ Quan trọng
import { LanguageProvider } from "./home/store/LanguageContext";

// Global error handlers
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>          {/* ⬅️ THÊM VÀO ĐÂY */}
          <LanguageProvider>
            <FeedbackProvider>
              <CategoryDataProvider>
                <WalletDataProvider>
                  <BudgetDataProvider>
                    <App />
                  </BudgetDataProvider>
                </WalletDataProvider>
              </CategoryDataProvider>
            </FeedbackProvider>
          </LanguageProvider>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
