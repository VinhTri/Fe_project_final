import { useState, useEffect, useCallback } from "react";
import {
  loadMoneyFormatSettings,
  formatCurrency,
  convertCurrencyAmount,
  MONEY_FORMAT_EVENT,
  MONEY_FORMAT_STORAGE_KEY,
  DEFAULT_MONEY_FORMAT,
} from "../utils/moneyFormatSettings";

export function useMoneyFormat() {
  const [settings, setSettings] = useState(() => loadMoneyFormatSettings());

  useEffect(() => {
    if (typeof window === "undefined") return () => {};
    const handleFormatChange = (event) => {
      if (event?.detail) {
        setSettings(event.detail);
        return;
      }
      setSettings(loadMoneyFormatSettings());
    };

    const handleStorage = (event) => {
      if (event?.key && event.key !== MONEY_FORMAT_STORAGE_KEY) return;
      setSettings(loadMoneyFormatSettings());
    };

    window.addEventListener(MONEY_FORMAT_EVENT, handleFormatChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(MONEY_FORMAT_EVENT, handleFormatChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const formatMoney = useCallback(
    (amount, currency) => formatCurrency(amount, currency, settings),
    [settings]
  );

  const convertAmount = useCallback(
    (amount, fromCurrency, toCurrency) => {
      const target = toCurrency || settings?.defaultCurrency || DEFAULT_MONEY_FORMAT.defaultCurrency;
      return convertCurrencyAmount(amount, fromCurrency, target);
    },
    [settings]
  );

  return {
    formatMoney,
    convertAmount,
    moneyFormatSettings: settings,
    displayCurrency: settings?.defaultCurrency || DEFAULT_MONEY_FORMAT.defaultCurrency,
  };
}
