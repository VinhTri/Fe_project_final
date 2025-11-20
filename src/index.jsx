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

// ✅ Toast
import { ToastProvider } from "./components/common/Toast/ToastContext";
import { LanguageProvider } from "./home/store/LanguageContext";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CategoryDataProvider>
        <WalletDataProvider>
          <BudgetDataProvider>
            <ToastProvider>
              <LanguageProvider>
                <App />
              </LanguageProvider>
            </ToastProvider>
          </BudgetDataProvider>
        </WalletDataProvider>
      </CategoryDataProvider>
    </AuthProvider>
  </React.StrictMode>
);
