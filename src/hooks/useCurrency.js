import { useState, useEffect, useCallback } from "react";
import { getMoneyFormatSettings } from "../utils/moneyFormatSettings";

// Tỉ giá cố định
const USD_TO_VND = 25000;

export function useCurrency() {
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("defaultCurrency") || "VND"
  );
  const [moneyFormatVersion, setMoneyFormatVersion] = useState(0);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.currency) setCurrency(e.detail.currency);
    };
    window.addEventListener("currencySettingChanged", handler);
    // Listen for money format changes
    const moneyFormatHandler = () => setMoneyFormatVersion((v) => v + 1);
    window.addEventListener("moneyFormatChanged", moneyFormatHandler);
    return () => {
      window.removeEventListener("currencySettingChanged", handler);
      window.removeEventListener("moneyFormatChanged", moneyFormatHandler);
    };
  }, []);

  // Quy đổi và format số tiền
  const formatCurrency = useCallback(
    (amount) => {
      const { thousand, decimal, decimalDigits } = getMoneyFormatSettings();
      let value = Number(amount);
      let formatted = "";
      if (currency === "USD") {
        value = value / USD_TO_VND;
      }
      // Format number with custom thousand/decimal separators
      formatted = value
        .toFixed(decimalDigits)
        .replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
      // Replace decimal point if needed
      if (decimal !== ".") {
        const parts = formatted.split(".");
        if (parts.length === 2) {
          formatted = parts[0] + decimal + parts[1];
        }
      }
      // Add currency symbol
      if (currency === "USD") {
        return formatted + " $";
      }
      return formatted + " ₫";
    },
    [currency, moneyFormatVersion]
  );

  return { currency, formatCurrency };
}
