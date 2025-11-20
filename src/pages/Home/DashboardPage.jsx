import React, { useMemo, useState, useEffect } from "react";
import "../../styles/home/DashboardPage.css";
import { useLanguage } from "../../home/store/LanguageContext";


/**
 * Dashboard tổng quan tài chính – dùng dữ liệu ảo, đổi theo:
 *  - Tuần này
 *  - Tháng này
 *  - Năm nay
 *
 * =================== NƠI GẮN API SAU NÀY ===================
 * TODO: Khi có backend, thay các object mock*ByPeriod bằng
 *       dữ liệu thật lấy từ API.
 *  Ví dụ:
 *    useEffect(() => {
 *      fetch(`/api/dashboard?period=${period}`)
 *        .then(res => res.json())
 *        .then(setData);
 *    }, [period]);
 * ===========================================================
 */

// ===== MOCK DATA (Fallback nếu chưa có localStorage) =====
// Để demo đẹp, ta sẽ sinh dữ liệu quanh thời điểm hiện tại (2025)
const createMockData = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  return [
    {
      id: 1,
      code: "TX-0001",
      type: "expense",
      walletName: "Tiền mặt",
      amount: 50000,
      currency: "VND",
      date: new Date(currentYear, currentMonth, currentDay, 12, 0).toISOString(),
      category: "Ăn uống",
      note: "Bữa trưa",
    },
    {
      id: 2,
      code: "TX-0002",
      type: "income",
      walletName: "Ngân hàng A",
      amount: 15000000,
      currency: "VND",
      date: new Date(currentYear, currentMonth, currentDay - 1, 9, 0).toISOString(),
      category: "Lương",
      note: "Lương tháng",
    },
    {
      id: 3,
      code: "TX-0003",
      type: "expense",
      walletName: "Momo",
      amount: 120000,
      currency: "VND",
      date: new Date(currentYear, currentMonth, currentDay - 2, 18, 30).toISOString(),
      category: "Giải trí",
      note: "Xem phim",
    },
    {
      id: 4,
      code: "TX-0004",
      type: "expense",
      walletName: "Tiền mặt",
      amount: 3500000,
      currency: "VND",
      date: new Date(currentYear, currentMonth, 3, 8, 0).toISOString(), // Đầu tháng
      category: "Hóa đơn",
      note: "Tiền phòng",
    },
    {
      id: 5,
      code: "TX-0005",
      type: "expense",
      walletName: "Techcombank",
      amount: 2000000,
      currency: "VND",
      date: new Date(currentYear, currentMonth, 1, 9, 0).toISOString(),
      category: "Tiết kiệm",
      note: "Gửi tiết kiệm",
    },
  ];
};

const STORAGE_EXTERNAL = "app_external_transactions_v1";

// Helper: Lấy khoảng thời gian
const getPeriodRange = (period) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === "tuan") {
    // Tuần này: T2 -> CN
    const day = start.getDay(); // 0=CN, 1=T2...
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === "thang") {
    // Tháng này: 1 -> Cuối tháng
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "nam") {
    // Năm nay: 1/1 -> 31/12
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState("tuan");
  const [transactions, setTransactions] = useState([]);

  const periodLabelFull = {
    tuan: t("dashboard.period.week"),
    thang: t("dashboard.period.month"),
    nam: t("dashboard.period.year"),
  };

  const spendingLevelTagLabel = {
    tuan: t("dashboard.by_week"),
    thang: t("dashboard.by_month"),
    nam: t("dashboard.by_year"),
  };

  // Load dữ liệu từ localStorage (giống TransactionsPage)
  useEffect(() => {
    const loadData = () => {
      try {
        const raw = localStorage.getItem(STORAGE_EXTERNAL);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setTransactions(parsed);
            return;
          }
        }
        // Nếu không có dữ liệu, dùng mock
        setTransactions(createMockData());
      } catch (e) {
        console.error("Lỗi đọc dữ liệu:", e);
        setTransactions(createMockData());
      }
    };
    loadData();
    
    // Lắng nghe sự thay đổi của localStorage (nếu mở tab khác)
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  // Lọc giao dịch theo kỳ
  const currentTransactions = useMemo(() => {
    const { start, end } = getPeriodRange(period);
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }, [transactions, period]);

  // 1. Tổng chi tiêu
  const totalSpending = useMemo(() => {
    return currentTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentTransactions]);

  // 2. Loại giao dịch (Donut chart) - Top 3 danh mục chi tiêu + Khác
  const transactionTypeData = useMemo(() => {
    const expenseTxs = currentTransactions.filter((t) => t.type === "expense");
    const map = {};
    let total = 0;
    expenseTxs.forEach((t) => {
      const cat = t.category || t("dashboard.other");
      map[cat] = (map[cat] || 0) + t.amount;
      total += t.amount;
    });

    const sorted = Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const top3 = sorted.slice(0, 3);
    const others = sorted.slice(3);
    const otherValue = others.reduce((sum, item) => sum + item.value, 0);

    const result = top3.map((item, index) => ({
      id: item.label,
      label: item.label,
      value: total ? Math.round((item.value / total) * 100) : 0,
      color: ["#2D99AE", "#0C5776", "#BCFEFE"][index] || "#ccc",
    }));

    if (otherValue > 0) {
      result.push({
        id: "khac",
        label: t("dashboard.other"),
        value: total ? Math.round((otherValue / total) * 100) : 0,
        color: "#F8DAD0",
      });
    }
    
    // Nếu không có dữ liệu
    if (result.length === 0) {
      return [{ id: "empty", label: t("dashboard.no_data"), value: 0, color: "#eee" }];
    }

    return result;
  }, [currentTransactions, t]);

  // 3. Biểu đồ đường (Spending Trend) & Biểu đồ cột (Spending Level)
  // Cần gom nhóm theo thời gian (Ngày cho Tuần, Tuần cho Tháng, Tháng cho Năm)
  const chartData = useMemo(() => {
    const { start, end } = getPeriodRange(period);
    const data = [];
    
    if (period === "tuan") {
      // 7 ngày: T2 -> CN
      const dayLabels = [
        t("common.day.mon"),
        t("common.day.tue"),
        t("common.day.wed"),
        t("common.day.thu"),
        t("common.day.fri"),
        t("common.day.sat"),
        t("common.day.sun"),
      ];

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const label = dayLabels[i];
        
        // Tính tổng chi ngày đó
        const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
        
        const spending = currentTransactions
          .filter(t => t.type === "expense" && new Date(t.date) >= dayStart && new Date(t.date) <= dayEnd)
          .reduce((sum, t) => sum + t.amount, 0);
          
        const income = currentTransactions
          .filter(t => t.type === "income" && new Date(t.date) >= dayStart && new Date(t.date) <= dayEnd)
          .reduce((sum, t) => sum + t.amount, 0);

        data.push({ label, value: spending, income, spending });
      }
    } else if (period === "thang") {
      // 4-5 tuần
      // Đơn giản hóa: chia làm 4 tuần
      for (let i = 1; i <= 4; i++) {
        const label = `${t("dashboard.chart.week_prefix")} ${i}`;
        // Logic chia tuần tương đối
        // Tuần 1: 1-7, Tuần 2: 8-14, Tuần 3: 15-21, Tuần 4: 22-end
        const wStart = new Date(start);
        wStart.setDate((i - 1) * 7 + 1);
        const wEnd = new Date(start);
        if (i === 4) wEnd.setMonth(wEnd.getMonth() + 1, 0);
        else wEnd.setDate(i * 7);
        wEnd.setHours(23, 59, 59, 999);

        const spending = currentTransactions
          .filter(t => t.type === "expense" && new Date(t.date) >= wStart && new Date(t.date) <= wEnd)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const income = currentTransactions
          .filter(t => t.type === "income" && new Date(t.date) >= wStart && new Date(t.date) <= wEnd)
          .reduce((sum, t) => sum + t.amount, 0);

        data.push({ label, value: spending, income, spending });
      }
    } else {
      // 12 tháng
      for (let i = 0; i < 12; i++) {
        const label = `${t("dashboard.chart.month_prefix")}${i + 1}`;
        const mStart = new Date(start.getFullYear(), i, 1);
        const mEnd = new Date(start.getFullYear(), i + 1, 0, 23, 59, 59);

        const spending = currentTransactions
          .filter(t => t.type === "expense" && new Date(t.date) >= mStart && new Date(t.date) <= mEnd)
          .reduce((sum, t) => sum + t.amount, 0);

        const income = currentTransactions
          .filter(t => t.type === "income" && new Date(t.date) >= mStart && new Date(t.date) <= mEnd)
          .reduce((sum, t) => sum + t.amount, 0);

        data.push({ label, value: spending, income, spending });
      }
    }
    return data;
  }, [currentTransactions, period, t]);

  // 4. Lịch sử giao dịch (Mới nhất trước)
  const historyList = useMemo(() => {
    const locale = language === "vi" ? "vi-VN" : "en-US";
    return [...currentTransactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10) // Lấy 10 giao dịch gần nhất
      .map(t => ({
        id: t.id,
        title: t.category,
        description: t.note || t.walletName,
        amount: t.type === "expense" ? -t.amount : t.amount,
        time: new Date(t.date).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }) + " • " + new Date(t.date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
      }));
  }, [currentTransactions, language]);

  // Main Donut Value (Lấy cái lớn nhất)
  const mainDonutValue = transactionTypeData.length > 0 ? transactionTypeData[0] : { value: 0 };

  return (
    <div className="dashboard-page">
      {/* Ô bọc trắng cho phần tiêu đề */}
      <div className="dashboard-page__header-box">
        <div className="dashboard-page__header">
          <div>
            <h2 className="dashboard-page__title">{t("dashboard.title")}</h2>
            <p className="dashboard-page__subtitle">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <div className="dashboard-page__period">
            <button
              className={
                "db-btn db-btn--ghost " +
                (period === "tuan" ? "db-btn--active" : "")
              }
              onClick={() => setPeriod("tuan")}
            >
              {t("dashboard.period.week")}
            </button>
            <button
              className={
                "db-btn db-btn--ghost " +
                (period === "thang" ? "db-btn--active" : "")
              }
              onClick={() => setPeriod("thang")}
            >
              {t("dashboard.period.month")}
            </button>
            <button
              className={
                "db-btn db-btn--ghost " +
                (period === "nam" ? "db-btn--active" : "")
              }
              onClick={() => setPeriod("nam")}
            >
              {t("dashboard.period.year")}
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Cột trái */}
        <section className="dashboard-main">
          <div className="db-card-grid">
            {/* Loại giao dịch */}
            <div className="db-card">
              <div className="db-card__header">
                <h3>{t("dashboard.transaction_type")}</h3>
              </div>
              <div className="db-card__body db-card__body--horizontal">
                <div className="db-donut">
                  <div className="db-donut__ring" />
                  <div className="db-donut__center">
                    <span className="db-donut__value">
                      {mainDonutValue.value}%
                    </span>
                    <span className="db-donut__label">{mainDonutValue.label}</span>
                  </div>
                </div>
                <ul className="db-legend">
                  {transactionTypeData.map((item) => (
                    <li key={item.id} className="db-legend__item">
                      <span
                        className="db-legend__dot"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="db-legend__label">{item.label}</span>
                      <span className="db-legend__value">
                        {item.value}
                        <span className="db-legend__unit">%</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tổng chi tiêu */}
            <div className="db-card">
              <div className="db-card__header">
                <h3>{t("dashboard.total_spending")}</h3>
                <span className="db-card__tag">
                  {periodLabelFull[period] || ""}
                </span>
              </div>
              <div className="db-card__body">
                <div className="db-card__kpi">
                  <div>
                    <p className="db-kpi__label">{t("dashboard.total_expense")}</p>
                    <p className="db-kpi__value">
                      {totalSpending.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                  {/* Trend tạm thời ẩn hoặc tính toán nếu cần */}
                  {/* <div className="db-kpi__trend db-kpi__trend--up">
                    <i className="bi bi-arrow-up-right" />
                    <span>+12,3% so với kỳ trước</span>
                  </div> */}
                </div>
                <div className="db-line-chart">
                  <svg viewBox="0 0 100 40" className="db-line-chart__svg" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                    <polyline
                      className="db-line-chart__line db-line-chart__line--primary"
                      points={chartData
                        .map((item, index) => {
                          const xStep =
                            chartData.length > 1
                              ? 100 /
                                (chartData.length - 1)
                              : 0;
                          const x = index * xStep;
                          const max = Math.max(
                            ...chartData.map((p) => p.value)
                          );
                          const min = Math.min(
                            ...chartData.map((p) => p.value)
                          );
                          const range = max - min || 1;
                          // Normalize to 0-40 height (svg height)
                          // Invert Y because SVG 0 is top
                          const normalized =
                            40 - ((item.value - min) / range) * 30 - 5; 
                          return `${x},${normalized}`;
                        })
                        .join(" ")}
                    />
                  </svg>
                  <div className="db-line-chart__labels">
                    {chartData.map((item, i) => (
                      // Chỉ hiện label cách nhau để đỡ rối nếu nhiều
                      <span key={i} style={{ fontSize: '8px' }}>{item.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mức độ chi tiêu */}
            <div className="db-card">
              <div className="db-card__header">
                <h3>{t("dashboard.spending_level")}</h3>
                <span className="db-card__tag">
                  {spendingLevelTagLabel[period]}
                </span>
              </div>
              <div className="db-card__body">
                <p className="db-card__subtitle">
                  {t("dashboard.spending_level_subtitle")}
                </p>
                <div className="db-bar-chart db-bar-chart--dense">
                  {chartData.map((item, i) => {
                     const max = Math.max(...chartData.map(p => p.value)) || 1;
                     const height = (item.value / max) * 100; // max 100px height
                     return (
                      <div key={i} className="db-bar-chart__item">
                        <div className="db-bar-chart__bar-wrap">
                          <div
                            className="db-bar-chart__bar db-bar-chart__bar--spending"
                            style={{ height: `${height}px` }}
                            title={`${item.value.toLocaleString()}đ`}
                          />
                        </div>
                        <span className="db-bar-chart__label">
                          {item.label}
                        </span>
                      </div>
                     );
                  })}
                </div>
              </div>
            </div>

            {/* Biến động số dư */}
            <div className="db-card">
              <div className="db-card__header">
                <h3>{t("dashboard.balance_fluctuation")}</h3>
                <span className="db-card__tag">{t("dashboard.income_expense")}</span>
              </div>
              <div className="db-card__body">
                <div className="db-balance-chart">
                  <svg viewBox="0 0 100 40" className="db-line-chart__svg" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                    {/* Thu vào */}
                    <polyline
                      className="db-line-chart__line db-line-chart__line--primary"
                      points={chartData
                        .map((item, index) => {
                          const xStep = chartData.length > 1 ? 100 / (chartData.length - 1) : 0;
                          const x = index * xStep;
                          // Scale chung cho cả thu và chi để so sánh
                          const allValues = [...chartData.map(p => p.income), ...chartData.map(p => p.spending)];
                          const max = Math.max(...allValues) || 1;
                          const min = 0;
                          const range = max - min;
                          
                          const normalized = 40 - (item.income / range) * 35;
                          return `${x},${normalized}`;
                        })
                        .join(" ")}
                    />
                    {/* Chi ra */}
                    <polyline
                      className="db-line-chart__line db-line-chart__line--secondary"
                      points={chartData
                        .map((item, index) => {
                          const xStep = chartData.length > 1 ? 100 / (chartData.length - 1) : 0;
                          const x = index * xStep;
                          const allValues = [...chartData.map(p => p.income), ...chartData.map(p => p.spending)];
                          const max = Math.max(...allValues) || 1;
                          const min = 0;
                          const range = max - min;
                          
                          const normalized = 40 - (item.spending / range) * 35;
                          return `${x},${normalized}`;
                        })
                        .join(" ")}
                    />
                  </svg>
                  <div className="db-line-chart__labels">
                    {chartData.map((item, i) => (
                      <span key={i} style={{ fontSize: '8px' }}>{item.label}</span>
                    ))}
                  </div>
                  <div className="db-balance-legend">
                    <span className="db-balance-legend__item">
                      <span className="dot dot--primary" /> {t("dashboard.income")}
                    </span>
                    <span className="db-balance-legend__item">
                      <span className="dot dot--secondary" /> {t("dashboard.expense")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cột phải: lịch sử giao dịch */}
        <aside className="dashboard-side">
          <div className="db-card db-card--side">
            <div className="db-card__header db-card__header--side">
              <div>
                <h3>{t("dashboard.transaction_history")}</h3>
                <p className="db-card__subtitle">{t("dashboard.recent_transactions")}</p>
              </div>
              <span className="db-card__tag">
                {periodLabelFull[period] || ""}
              </span>
            </div>
            <div className="db-side__search">
              <span className="db-side__search-icon">
                <i className="bi bi-search" />
              </span>
              <input
                type="text"
                placeholder={t("dashboard.search_placeholder")}
                className="db-side__search-input"
              />
            </div>
            <ul className="db-history-list">
              {historyList.length === 0 ? (
                <li className="text-center text-muted py-3">{t("dashboard.no_transactions")}</li>
              ) : (
                historyList.map((item) => (
                  <li key={item.id} className="db-history-item">
                    <div className="db-history-item__icon">
                      <i className="bi bi-credit-card-2-front" />
                    </div>
                    <div className="db-history-item__main">
                      <div className="db-history-item__row">
                        <span className="db-history-item__title">
                          {item.title}
                        </span>
                        <span
                          className={
                            "db-history-item__amount " +
                            (item.amount >= 0
                              ? "db-history-item__amount--positive"
                              : "db-history-item__amount--negative")
                          }
                        >
                          {item.amount >= 0 ? "+" : ""}
                          {item.amount.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <p className="db-history-item__desc">
                        {item.description}
                      </p>
                      <span className="db-history-item__time">
                        {item.time}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}