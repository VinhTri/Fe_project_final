export const MONEY_FORMAT_STORAGE_KEY = "appMoneyFormat";
export const MONEY_FORMAT_EVENT = "moneyFormatChanged";

const DEFAULT_DISPLAY_CURRENCY = "VND";
const USD_TO_VND_EXCHANGE_RATE = 26380;

const VND_PER_CURRENCY_UNIT = {
  VND: 1,
  USD: USD_TO_VND_EXCHANGE_RATE,
  EUR: 26316,
  JPY: 159,
  GBP: 31250,
  CNY: 3333,
};

const SUPPORTED_DISPLAY_CURRENCIES = ["VND", "USD"];

export const DEFAULT_MONEY_FORMAT = {
  grouping: "space", // space | dot | comma
  decimalDigits: 0,
  defaultCurrency: DEFAULT_DISPLAY_CURRENCY,
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

const normalizeCurrencyCode = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.trim().toUpperCase();
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
  const selectedCurrency = normalizeCurrencyCode(settings.defaultCurrency);
  const defaultCurrency = SUPPORTED_DISPLAY_CURRENCIES.includes(selectedCurrency)
    ? selectedCurrency
    : DEFAULT_DISPLAY_CURRENCY;
  return { grouping, decimalDigits, defaultCurrency };
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

export const convertCurrencyAmount = (amount = 0, fromCurrency = "VND", toCurrency = "VND") => {
  const safeAmount = Number(amount) || 0;
  const source = normalizeCurrencyCode(fromCurrency) || DEFAULT_DISPLAY_CURRENCY;
  const target = normalizeCurrencyCode(toCurrency) || DEFAULT_DISPLAY_CURRENCY;
  if (source === target) return safeAmount;
  const sourceRate = VND_PER_CURRENCY_UNIT[source];
  const targetRate = VND_PER_CURRENCY_UNIT[target];
  if (!sourceRate || !targetRate) {
    return safeAmount;
  }
  const valueInVnd = safeAmount * sourceRate;
  if (target === "VND") return valueInVnd;
  return valueInVnd / targetRate;
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
  const displayCurrency = activeSettings.defaultCurrency || DEFAULT_DISPLAY_CURRENCY;
  const convertedAmount = convertCurrencyAmount(amount, currency, displayCurrency);
  const formattedNumber = formatNumberWithSettings(convertedAmount, activeSettings);

  if (displayCurrency === "USD") {
    return `$${formattedNumber}`;
  }

  return `${formattedNumber} ${displayCurrency}`.trim();
};
