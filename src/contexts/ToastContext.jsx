import React, { createContext, useContext, useState } from "react";
import SuccessToast from "../components/common/Toast/SuccessToast";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ open: false, message: "" });

  const showToast = (message, duration = 3000) => {
    setToast({ open: true, message });
    // Auto close được handle bởi SuccessToast component
  };

  const hideToast = () => {
    setToast({ open: false, message: "" });
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <SuccessToast
        open={toast.open}
        message={toast.message}
        duration={3000}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
};

