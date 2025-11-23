import { useState, useEffect, useCallback } from "react";
import {
  loadDateFormatSettings,
  formatDateValue,
  DATE_FORMAT_EVENT,
  DATE_FORMAT_STORAGE_KEY,
} from "../utils/dateFormatSettings";

export function useDateFormat() {
  const [settings, setSettings] = useState(() => loadDateFormatSettings());

  useEffect(() => {
    if (typeof window === "undefined") return () => {};

    const handleFormatChange = (event) => {
      if (event?.detail) {
        setSettings(event.detail);
        return;
      }
      setSettings(loadDateFormatSettings());
    };

    const handleStorage = (event) => {
      if (event?.key && event.key !== DATE_FORMAT_STORAGE_KEY) return;
      setSettings(loadDateFormatSettings());
    };

    window.addEventListener(DATE_FORMAT_EVENT, handleFormatChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(DATE_FORMAT_EVENT, handleFormatChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const formatDate = useCallback(
    (value, options) => formatDateValue(value, settings, options),
    [settings]
  );

  return {
    formatDate,
    dateFormatSettings: settings,
  };
}
