// index.jsx
// index.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/variables.css";

// PROVIDERS
import { WalletDataProvider } from "./home/store/WalletDataContext";
import { BudgetDataProvider } from "./home/store/BudgetDataContext";
import { CategoryDataProvider } from "./home/store/CategoryDataContext";
import { AuthProvider } from "./home/store/AuthContext";
import { NotificationProvider } from "./home/store/NotificationContext";
import { FeedbackProvider } from "./home/store/FeedbackDataContext"; // ⬅️ THÊM DÒNG NÀY

// Toast
import { ToastProvider } from "./components/common/Toast/ToastContext";


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CategoryDataProvider>
        <WalletDataProvider>
          <BudgetDataProvider>
            <NotificationProvider>
              <FeedbackProvider>         {/* ⬅️ BỌC Ở ĐÂY */}
                <ToastProvider>
                  <App />
                </ToastProvider>
              </FeedbackProvider>
            </NotificationProvider>
          </BudgetDataProvider>
        </WalletDataProvider>
      </CategoryDataProvider>
    </AuthProvider>
  </React.StrictMode>
);
