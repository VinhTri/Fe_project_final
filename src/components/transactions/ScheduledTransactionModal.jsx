import React, { useEffect, useMemo, useState } from "react";
import Modal from "../common/Modal/Modal";
import { previewScheduledTransaction } from "../../services/scheduled-transaction.service";

const SCHEDULE_TYPES = [
  { value: "ONE_TIME", label: "Một lần", tooltip: "Chỉ thực hiện một lần vào ngày đã chọn" },
  { value: "DAILY", label: "Hằng ngày", tooltip: "Lặp lại hàng ngày vào giờ đã chọn" },
  { value: "WEEKLY", label: "Hằng tuần", tooltip: "Chạy mỗi tuần vào cùng ngày / giờ" },
  { value: "MONTHLY", label: "Hằng tháng", tooltip: "Tự động chạy mỗi tháng" },
  { value: "YEARLY", label: "Hằng năm", tooltip: "Lặp lại vào cùng ngày mỗi năm" },
];

const DEFAULT_FORM = {
  transactionType: "expense",
  walletId: "",
  categoryId: "",
  amount: "",
  note: "",
  scheduleType: "MONTHLY",
  firstRun: "",
  endDate: "",
  dayOfWeek: "",
  dayOfMonth: "",
  month: "",
  day: "",
};

export default function ScheduledTransactionModal({
  open,
  wallets = [],
  expenseCategories = [],
  incomeCategories = [],
  onSubmit,
  onClose,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [previewData, setPreviewData] = useState({ message: "Chưa chọn thời điểm chạy.", hasPreview: false });
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...DEFAULT_FORM,
        transactionType: prev.transactionType || "expense",
        scheduleType: prev.scheduleType || "MONTHLY",
      }));
      setErrors({});
    }
  }, [open]);

  const categoryOptions = useMemo(
    () => (form.transactionType === "income" ? incomeCategories : expenseCategories) || [],
    [form.transactionType, expenseCategories, incomeCategories]
  );

  // Map scheduleType từ frontend sang backend
  const mapScheduleTypeToBackend = (type) => {
    const mapping = {
      ONE_TIME: "ONCE",
      DAILY: "DAILY",
      WEEKLY: "WEEKLY",
      MONTHLY: "MONTHLY",
      YEARLY: "YEARLY",
    };
    return mapping[type] || type;
  };

  // Parse firstRun để lấy startDate và executionTime
  // firstRun format: "YYYY-MM-DDTHH:mm" (from datetime-local input)
  const parseFirstRun = (firstRun) => {
    if (!firstRun) return { startDate: null, executionTime: null };
    try {
      // Parse directly from datetime-local format (YYYY-MM-DDTHH:mm)
      // This avoids timezone issues
      const [datePart, timePart] = firstRun.split("T");
      if (!datePart) return { startDate: null, executionTime: null };
      
      // Validate date format
      const dateMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!dateMatch) return { startDate: null, executionTime: null };
      
      const startDate = datePart; // Already in YYYY-MM-DD format
      
      // Parse time part (HH:mm or HH:mm:ss)
      let executionTime = "00:00:00";
      if (timePart) {
        const timeMatch = timePart.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (timeMatch) {
          const hours = timeMatch[1];
          const minutes = timeMatch[2];
          const seconds = timeMatch[3] || "00";
          executionTime = `${hours}:${minutes}:${seconds}`;
        }
      }
      
      return { startDate, executionTime };
    } catch (error) {
      console.error("Error parsing firstRun:", error);
      return { startDate: null, executionTime: null };
    }
  };

  // Gọi preview API khi các field liên quan thay đổi
  useEffect(() => {
    const fetchPreview = async () => {
      // Kiểm tra các field bắt buộc
      if (!form.walletId || !form.categoryId || !form.amount || !form.firstRun) {
        setPreviewData({ message: "Chưa chọn thời điểm chạy.", hasPreview: false });
        return;
      }

      // Kiểm tra các field bắt buộc theo scheduleType
      if (form.scheduleType === "WEEKLY" && !form.dayOfWeek) {
        setPreviewData({ message: "Vui lòng chọn thứ trong tuần.", hasPreview: false });
        return;
      }
      if (form.scheduleType === "MONTHLY" && !form.dayOfMonth) {
        setPreviewData({ message: "Vui lòng chọn ngày trong tháng.", hasPreview: false });
        return;
      }
      if (form.scheduleType === "YEARLY" && (!form.month || !form.day)) {
        setPreviewData({ message: "Vui lòng chọn tháng và ngày.", hasPreview: false });
        return;
      }

      const { startDate, executionTime } = parseFirstRun(form.firstRun);
      if (!startDate || !executionTime) {
        setPreviewData({ message: "Chưa chọn thời điểm chạy.", hasPreview: false });
        return;
      }

      setPreviewLoading(true);
      try {
        const previewPayload = {
          walletId: Number(form.walletId),
          transactionTypeId: form.transactionType === "expense" ? 1 : 2,
          categoryId: Number(form.categoryId),
          amount: Number(form.amount),
          note: form.note || "",
          scheduleType: mapScheduleTypeToBackend(form.scheduleType),
          startDate,
          executionTime,
          endDate: form.scheduleType === "ONE_TIME" ? null : form.endDate || null,
        };

        // Thêm các field tùy chọn theo scheduleType
        if (form.scheduleType === "WEEKLY" && form.dayOfWeek) {
          previewPayload.dayOfWeek = Number(form.dayOfWeek);
        }
        if (form.scheduleType === "MONTHLY" && form.dayOfMonth) {
          previewPayload.dayOfMonth = Number(form.dayOfMonth);
        }
        if (form.scheduleType === "YEARLY") {
          if (form.month) previewPayload.month = Number(form.month);
          if (form.day) previewPayload.day = Number(form.day);
        }

        const response = await previewScheduledTransaction(previewPayload);
        if (response.response.ok && response.data) {
          // Check if there's an error message from backend
          if (response.data.error) {
            setPreviewData({
              hasPreview: false,
              message: response.data.error,
            });
          } else {
            setPreviewData({
              hasPreview: response.data.hasPreview || false,
              message: response.data.message || "Chưa chọn thời điểm chạy.",
              nextExecutionDate: response.data.nextExecutionDate,
              executionTime: response.data.executionTime,
            });
          }
        } else {
          // Backend returned an error
          const errorMessage = response.data?.error || response.data?.message || "Không thể tính toán ngày thực hiện.";
          setPreviewData({
            hasPreview: false,
            message: errorMessage,
          });
        }
      } catch (error) {
        console.error("Error fetching preview:", error);
        setPreviewData({
          hasPreview: false,
          message: "Không thể tính toán ngày thực hiện.",
        });
      } finally {
        setPreviewLoading(false);
      }
    };

    // Debounce để tránh gọi API quá nhiều
    const timeoutId = setTimeout(fetchPreview, 500);
    return () => clearTimeout(timeoutId);
  }, [
    form.walletId,
    form.categoryId,
    form.amount,
    form.scheduleType,
    form.firstRun,
    form.endDate,
    form.dayOfWeek,
    form.dayOfMonth,
    form.month,
    form.day,
  ]);

  const previewText = useMemo(() => {
    if (previewLoading) return "Đang tính toán...";
    return previewData.message || "Chưa chọn thời điểm chạy.";
  }, [previewData, previewLoading]);

  const handleChange = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.walletId) nextErrors.walletId = "Vui lòng chọn ví áp dụng";
    if (!form.categoryId) nextErrors.categoryId = "Vui lòng chọn danh mục";
    if (!form.amount || Number(form.amount) <= 0) nextErrors.amount = "Số tiền phải lớn hơn 0";
    if (!form.firstRun) {
      nextErrors.firstRun = "Vui lòng chọn thời điểm bắt đầu";
    } else {
      // Validate firstRun không được là quá khứ (cho ONCE)
      // Parse từ datetime-local format (YYYY-MM-DDTHH:mm) để tránh timezone issues
      if (form.scheduleType === "ONE_TIME") {
        try {
          const [datePart, timePart] = form.firstRun.split("T");
          if (datePart && timePart) {
            const [year, month, day] = datePart.split("-").map(Number);
            const [hours, minutes] = timePart.split(":").map(Number);
            const firstRunDate = new Date(year, month - 1, day, hours, minutes);
            const now = new Date();
            // So sánh với độ chính xác đến phút
            const nowMinutes = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
            if (firstRunDate < nowMinutes) {
              nextErrors.firstRun = "Ngày thực hiện không được là ngày trong quá khứ";
            }
          }
        } catch (error) {
          console.error("Error validating firstRun:", error);
        }
      }
    }
    if (form.scheduleType !== "ONE_TIME" && !form.endDate) nextErrors.endDate = "Vui lòng chọn ngày kết thúc";
    
    // Validation cho các field theo scheduleType
    if (form.scheduleType === "WEEKLY" && !form.dayOfWeek) {
      nextErrors.dayOfWeek = "Vui lòng chọn thứ trong tuần";
    }
    if (form.scheduleType === "MONTHLY" && !form.dayOfMonth) {
      nextErrors.dayOfMonth = "Vui lòng chọn ngày trong tháng";
    }
    if (form.scheduleType === "YEARLY") {
      if (!form.month) nextErrors.month = "Vui lòng chọn tháng";
      if (!form.day) nextErrors.day = "Vui lòng chọn ngày";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const wallet = wallets.find((w) => String(w.walletId || w.id) === String(form.walletId));
    const category = categoryOptions.find((c) => String(c.categoryId || c.id) === String(form.categoryId));

    // Parse firstRun để lấy startDate và executionTime
    const { startDate, executionTime } = parseFirstRun(form.firstRun);

    onSubmit?.({
      transactionType: form.transactionType,
      walletId: wallet?.walletId || wallet?.id || null,
      walletName: wallet?.walletName || wallet?.name || "",
      categoryId: category?.categoryId || category?.id || null,
      categoryName: category?.categoryName || category?.name || "",
      amount: Number(form.amount),
      note: form.note.trim(),
      scheduleType: mapScheduleTypeToBackend(form.scheduleType),
      startDate,
      executionTime,
      endDate: form.scheduleType === "ONE_TIME" ? null : form.endDate || null,
      dayOfWeek: form.scheduleType === "WEEKLY" ? Number(form.dayOfWeek) : undefined,
      dayOfMonth: form.scheduleType === "MONTHLY" ? Number(form.dayOfMonth) : undefined,
      month: form.scheduleType === "YEARLY" ? Number(form.month) : undefined,
      day: form.scheduleType === "YEARLY" ? Number(form.day) : undefined,
    });
    setForm(DEFAULT_FORM);
  };

  return (
    <Modal open={open} onClose={onClose} width={560}>
      <div className="modal__content" style={{ padding: "1.75rem" }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h4 className="mb-1">Tạo lịch giao dịch</h4>
            <p className="text-muted mb-0">Tự động hóa các khoản thu chi định kỳ.</p>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Đóng" />
        </div>

        <form className="schedule-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Loại giao dịch</label>
            <div className="btn-group" role="group">
              <input
                type="radio"
                className="btn-check"
                name="schedule-type"
                id="schedule-expense"
                checked={form.transactionType === "expense"}
                onChange={() => setForm((prev) => ({ ...prev, transactionType: "expense", categoryId: "" }))}
              />
              <label className="btn btn-outline-primary" htmlFor="schedule-expense">
                Chi tiêu
              </label>
              <input
                type="radio"
                className="btn-check"
                name="schedule-type"
                id="schedule-income"
                checked={form.transactionType === "income"}
                onChange={() => setForm((prev) => ({ ...prev, transactionType: "income", categoryId: "" }))}
              />
              <label className="btn btn-outline-primary" htmlFor="schedule-income">
                Thu nhập
              </label>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Ví áp dụng</label>
              <select
                className={`form-select ${errors.walletId ? "is-invalid" : ""}`}
                value={form.walletId}
                onChange={handleChange("walletId")}
              >
                <option value="">-- Chọn ví --</option>
                {wallets.map((wallet) => (
                  <option key={wallet.walletId || wallet.id} value={wallet.walletId || wallet.id}>
                    {wallet.walletName || wallet.name}
                  </option>
                ))}
              </select>
              {errors.walletId && <div className="invalid-feedback d-block">{errors.walletId}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label">Danh mục</label>
              <select
                className={`form-select ${errors.categoryId ? "is-invalid" : ""}`}
                value={form.categoryId}
                onChange={handleChange("categoryId")}
              >
                <option value="">-- Chọn danh mục --</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>
                    {cat.categoryName || cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <div className="invalid-feedback d-block">{errors.categoryId}</div>}
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <label className="form-label">Số tiền</label>
              <div className="input-group">
                <input
                  type="number"
                  min="0"
                  className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                  value={form.amount}
                  onChange={handleChange("amount")}
                />
                <span className="input-group-text">VND</span>
              </div>
              {errors.amount && <div className="invalid-feedback d-block">{errors.amount}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Ghi chú (tùy chọn)</label>
              <input className="form-control" value={form.note} onChange={handleChange("note")} placeholder="VD: Thanh toán điện" />
            </div>
          </div>

          <div className="mt-3">
            <label className="form-label fw-semibold">Kiểu lịch hẹn</label>
            <div className="row g-2 schedule-type-grid">
              {SCHEDULE_TYPES.map((type) => (
                <div className="col-6" key={type.value}>
                  <button
                    type="button"
                    className={`btn w-100 schedule-type-item ${form.scheduleType === type.value ? "active" : ""}`}
                    title={type.tooltip}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        scheduleType: type.value,
                        dayOfWeek: "",
                        dayOfMonth: "",
                        month: "",
                        day: "",
                      }))
                    }
                  >
                    {type.label}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <label className="form-label">Thời điểm đầu tiên</label>
              <input
                type="datetime-local"
                className={`form-control ${errors.firstRun ? "is-invalid" : ""}`}
                value={form.firstRun}
                onChange={handleChange("firstRun")}
              />
              {errors.firstRun && <div className="invalid-feedback d-block">{errors.firstRun}</div>}
            </div>
            {form.scheduleType !== "ONE_TIME" && (
              <div className="col-md-6">
                <label className="form-label">Ngày kết thúc</label>
                <input
                  type="date"
                  className={`form-control ${errors.endDate ? "is-invalid" : ""}`}
                  value={form.endDate}
                  onChange={handleChange("endDate")}
                />
                {errors.endDate && <div className="invalid-feedback d-block">{errors.endDate}</div>}
              </div>
            )}
          </div>

          {/* Field cho WEEKLY */}
          {form.scheduleType === "WEEKLY" && (
            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <label className="form-label">Thứ trong tuần</label>
                <select
                  className={`form-select ${errors.dayOfWeek ? "is-invalid" : ""}`}
                  value={form.dayOfWeek}
                  onChange={handleChange("dayOfWeek")}
                >
                  <option value="">-- Chọn thứ --</option>
                  <option value="1">Thứ 2</option>
                  <option value="2">Thứ 3</option>
                  <option value="3">Thứ 4</option>
                  <option value="4">Thứ 5</option>
                  <option value="5">Thứ 6</option>
                  <option value="6">Thứ 7</option>
                  <option value="7">Chủ nhật</option>
                </select>
                {errors.dayOfWeek && <div className="invalid-feedback d-block">{errors.dayOfWeek}</div>}
              </div>
            </div>
          )}

          {/* Field cho MONTHLY */}
          {form.scheduleType === "MONTHLY" && (
            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <label className="form-label">Ngày trong tháng</label>
                <select
                  className={`form-select ${errors.dayOfMonth ? "is-invalid" : ""}`}
                  value={form.dayOfMonth}
                  onChange={handleChange("dayOfMonth")}
                >
                  <option value="">-- Chọn ngày --</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Ngày {day}
                    </option>
                  ))}
                </select>
                {errors.dayOfMonth && <div className="invalid-feedback d-block">{errors.dayOfMonth}</div>}
              </div>
            </div>
          )}

          {/* Field cho YEARLY */}
          {form.scheduleType === "YEARLY" && (
            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <label className="form-label">Tháng</label>
                <select
                  className={`form-select ${errors.month ? "is-invalid" : ""}`}
                  value={form.month}
                  onChange={handleChange("month")}
                >
                  <option value="">-- Chọn tháng --</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      Tháng {month}
                    </option>
                  ))}
                </select>
                {errors.month && <div className="invalid-feedback d-block">{errors.month}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Ngày</label>
                <select
                  className={`form-select ${errors.day ? "is-invalid" : ""}`}
                  value={form.day}
                  onChange={handleChange("day")}
                >
                  <option value="">-- Chọn ngày --</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Ngày {day}
                    </option>
                  ))}
                </select>
                {errors.day && <div className="invalid-feedback d-block">{errors.day}</div>}
              </div>
            </div>
          )}

          <div className="alert alert-secondary mt-3" role="alert">
            <strong>Mini preview:</strong> {previewText}.
          </div>

          <p className="text-muted small mb-3">
            (Δ) Hệ thống sẽ kiểm tra số dư ví tại thời điểm chạy. Nếu thiếu tiền, báo cáo "Không đủ số dư" sẽ được ghi nhận.
          </p>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              Tạo lịch
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
