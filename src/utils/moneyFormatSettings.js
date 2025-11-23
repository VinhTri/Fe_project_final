export const MONEY_FORMAT_STORAGE_KEY = "appMoneyFormat";
export const MONEY_FORMAT_EVENT = "moneyFormatChanged";

export const DEFAULT_MONEY_FORMAT = {
  grouping: "space", // space | dot | comma
  decimalDigits: 0,
};

const GROUPING_SYMBOLS = {
  space: " ",
  dot: ".",
  comma: ",",
};

const DECIMAL_SYMBOLS = {
  space: ",",
  dot: ",",
  comma: ".",
};

const clampDecimalDigits = (value) => {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return 0;
  if (num > 8) return 8;
  return Math.round(num);
};

export const sanitizeMoneyFormat = (settings) => {
  if (!settings) return { ...DEFAULT_MONEY_FORMAT };
  const grouping = GROUPING_SYMBOLS[settings.grouping] ? settings.grouping : DEFAULT_MONEY_FORMAT.grouping;
  const decimalDigits = clampDecimalDigits(settings.decimalDigits ?? DEFAULT_MONEY_FORMAT.decimalDigits);
  return { grouping, decimalDigits };
};

export const loadMoneyFormatSettings = () => {
  if (typeof window === "undefined") return { ...DEFAULT_MONEY_FORMAT };
  try {
    const raw = localStorage.getItem(MONEY_FORMAT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MONEY_FORMAT };
    const parsed = JSON.parse(raw);
    return sanitizeMoneyFormat(parsed);
  } catch (error) {
    console.error("Không thể đọc cài đặt định dạng tiền tệ:", error);
    return { ...DEFAULT_MONEY_FORMAT };
  }
};

export const saveMoneyFormatSettings = (partialSettings = {}) => {
  if (typeof window === "undefined") return;
  const current = loadMoneyFormatSettings();
  const merged = sanitizeMoneyFormat({ ...current, ...partialSettings });
  try {
    localStorage.setItem(MONEY_FORMAT_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(MONEY_FORMAT_EVENT, { detail: merged }));
  } catch (error) {
    console.error("Không thể lưu cài đặt định dạng tiền tệ:", error);
  }
};

export const formatNumberWithSettings = (amount = 0, settings) => {
  const { grouping, decimalDigits } = settings || loadMoneyFormatSettings();
  const separator = GROUPING_SYMBOLS[grouping] || GROUPING_SYMBOLS.space;
  const decimalSymbol = DECIMAL_SYMBOLS[grouping] || DECIMAL_SYMBOLS.space;

  const safeNumber = Number(amount) || 0;
  const negative = safeNumber < 0;
  const absValue = Math.abs(safeNumber);
  const fixed = absValue.toFixed(decimalDigits);
  const [integerPartRaw, fractionPart] = fixed.split(".");
  const integerPart = integerPartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  const decimalPart = decimalDigits > 0 ? decimalSymbol + fractionPart : "";
  return `${negative ? "-" : ""}${integerPart}${decimalPart}`;
};

export const formatCurrency = (amount = 0, currency = "VND", settings) => {
  const activeSettings = settings || loadMoneyFormatSettings();
  const formattedNumber = formatNumberWithSettings(amount, activeSettings);
  const currencyCode = currency || "";

  if (!currencyCode) return formattedNumber;
  if (currencyCode === "USD") {
    return `$${formattedNumber}`;
  }
  return `${formattedNumber} ${currencyCode}`.trim();
};
