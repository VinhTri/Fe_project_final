/**
 * Format tiền tệ theo đúng chuẩn quốc tế
 * @param {number} amount - Số tiền
 * @param {string} currency - Mã tiền tệ (VND, USD, EUR, etc.)
 * @returns {string} - Chuỗi đã format
 */
export const formatMoney = (amount = 0, currency = "VND") => {
  try {
    const num = Number(amount) || 0;
    
    // ✅ Chọn locale phù hợp với từng loại tiền
    let locale = "vi-VN"; // Default cho VND
    
    // US Dollar, GBP, etc. dùng en-US format (1,234.56)
    if (["USD", "GBP", "AUD", "CAD", "SGD", "HKD", "NZD"].includes(currency)) {
      locale = "en-US";
    }
    // Euro dùng de-DE format (1.234,56)
    else if (["EUR"].includes(currency)) {
      locale = "de-DE";
    }
    // Yen, Won không có thập phân
    else if (["JPY", "KRW"].includes(currency)) {
      locale = "ja-JP";
    }
    // Yuan
    else if (["CNY"].includes(currency)) {
      locale = "zh-CN";
    }
    
    const options = {
      style: "currency",
      currency,
      maximumFractionDigits: ["VND", "JPY", "KRW"].includes(currency) ? 0 : 2,
      minimumFractionDigits: ["VND", "JPY", "KRW"].includes(currency) ? 0 : 2,
    };
    
    let formatted = new Intl.NumberFormat(locale, options).format(num);
    
    // ✅ FIX: VND - replace ₫ với "VND"
    if (currency === "VND") {
      formatted = formatted.replace(/\s?₫/, " VND");
    }
    
    // ✅ FIX: USD, GBP, etc. - thêm code sau ký hiệu để rõ ràng hơn
    // Ví dụ: $1,234.56 → US$1,234.56 hoặc $1,234.56 USD
    if (["USD", "GBP", "EUR", "AUD", "CAD", "SGD"].includes(currency)) {
      // Option 1: Thêm prefix (US$, GB£, etc.)
      if (currency === "USD" && !formatted.includes("US")) {
        formatted = formatted.replace("$", "US$");
      } else if (currency === "GBP" && !formatted.includes("GB")) {
        formatted = formatted.replace("£", "GB£");
      } else if (currency === "AUD" && !formatted.includes("AU")) {
        formatted = formatted.replace("A$", "AU$").replace("$", "AU$");
      } else if (currency === "CAD" && !formatted.includes("CA")) {
        formatted = formatted.replace("CA$", "CA$").replace("$", "CA$");
      }
    }
    
    return formatted;
  } catch (error) {
    console.error("Format money error:", error, { amount, currency });
    // Fallback: Simple format
    const num = Number(amount) || 0;
    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";
    return `${sign}${absNum.toLocaleString()} ${currency}`;
  }
};

/**
 * Format số tiền đơn giản (không có ký hiệu tiền tệ)
 * @param {number} amount - Số tiền
 * @param {string} currency - Mã tiền tệ (để biết số chữ số thập phân)
 * @returns {string} - Chuỗi đã format
 */
export const formatNumber = (amount = 0, currency = "VND") => {
  const decimals = ["VND", "JPY", "KRW"].includes(currency) ? 0 : 2;
  const locale = ["USD", "GBP", "AUD"].includes(currency) ? "en-US" : "vi-VN";
  
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(Number(amount) || 0);
};

