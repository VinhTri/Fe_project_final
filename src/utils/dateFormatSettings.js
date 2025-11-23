export const DATE_FORMAT_STORAGE_KEY = "appDateFormat";
export const DATE_FORMAT_EVENT = "dateFormatChanged";

export const DATE_FORMAT_OPTIONS = [
  "dd/MM/yyyy",
  "MM/dd/yyyy",
  "yyyy-MM-dd",
];

export const DEFAULT_DATE_FORMAT = {
  pattern: "dd/MM/yyyy",
};

const sanitizePattern = (pattern) => {
  if (!pattern) return DEFAULT_DATE_FORMAT.pattern;
  if (DATE_FORMAT_OPTIONS.includes(pattern)) return pattern;
  return DEFAULT_DATE_FORMAT.pattern;
};

export const sanitizeDateFormatSettings = (settings) => {
  if (!settings) return { ...DEFAULT_DATE_FORMAT };
  return {
    pattern: sanitizePattern(settings.pattern),
  };
};

export const loadDateFormatSettings = () => {
  if (typeof window === "undefined") return { ...DEFAULT_DATE_FORMAT };
  try {
    const raw = localStorage.getItem(DATE_FORMAT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATE_FORMAT };
    const parsed = JSON.parse(raw);
    return sanitizeDateFormatSettings(parsed);
  } catch (error) {
    console.error("Không thể đọc cài đặt định dạng ngày:", error);
    return { ...DEFAULT_DATE_FORMAT };
  }
};

export const saveDateFormatSettings = (partialSettings = {}) => {
  if (typeof window === "undefined") return;
  const current = loadDateFormatSettings();
  const merged = sanitizeDateFormatSettings({ ...current, ...partialSettings });
  try {
    localStorage.setItem(DATE_FORMAT_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(DATE_FORMAT_EVENT, { detail: merged }));
  } catch (error) {
    console.error("Không thể lưu cài đặt định dạng ngày:", error);
  }
};

const tokenMap = (date) => ({
  yyyy: String(date.getFullYear()),
  MM: String(date.getMonth() + 1).padStart(2, "0"),
  dd: String(date.getDate()).padStart(2, "0"),
  HH: String(date.getHours()).padStart(2, "0"),
  mm: String(date.getMinutes()).padStart(2, "0"),
  ss: String(date.getSeconds()).padStart(2, "0"),
});

const applyPattern = (date, pattern) => {
  if (!pattern) return date.toISOString();
  const tokens = tokenMap(date);
  return pattern.replace(/yyyy|MM|dd|HH|mm|ss/g, (token) => tokens[token] || token);
};

export const formatDateValue = (value, settings, options = {}) => {
  if (!value) return "--";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  const activeSettings = settings || loadDateFormatSettings();
  const pattern = options.pattern || activeSettings.pattern;
  const base = applyPattern(date, pattern);

  if (options.withTime) {
    const timePattern = options.timePattern || "HH:mm";
    const timePart = applyPattern(date, timePattern);
    return `${base} ${timePart}`.trim();
  }

  return base;
};
