import React, { useState, useEffect } from "react";
// import { categoryService } from "../../services/categoryService"; // ⚠️ Backend chưa có API
import Loading from "../../components/common/Loading";
import "../../styles/home/CategoriesPage.css";
import SuccessToast from "../../components/common/Toast/SuccessToast";

// ⚠️ MOCK DATA - Backend chưa có API quản lý categories
const MOCK_EXPENSE_CATEGORIES = [
  { id: 1, name: "Ăn uống", description: "Chi phí ăn uống hàng ngày", type: "expense" },
  { id: 2, name: "Di chuyển", description: "Xăng xe, xe bus, grab...", type: "expense" },
  { id: 3, name: "Mua sắm", description: "Quần áo, đồ dùng cá nhân", type: "expense" },
  { id: 4, name: "Giải trí", description: "Xem phim, cafe, du lịch", type: "expense" },
  { id: 5, name: "Hóa đơn", description: "Điện, nước, internet, điện thoại", type: "expense" },
  { id: 6, name: "Y tế", description: "Khám bệnh, thuốc men", type: "expense" },
  { id: 7, name: "Giáo dục", description: "Học phí, sách vở", type: "expense" },
  { id: 8, name: "Nhà cửa", description: "Tiền thuê nhà, sửa chữa", type: "expense" },
  { id: 9, name: "Chuyển tiền", description: "Chuyển tiền giữa các ví", type: "expense" },
  { id: 10, name: "Khác", description: "Chi phí khác", type: "expense" },
];

const MOCK_INCOME_CATEGORIES = [
  { id: 11, name: "Lương", description: "Lương tháng", type: "income" },
  { id: 12, name: "Thưởng", description: "Tiền thưởng, KPI", type: "income" },
  { id: 13, name: "Đầu tư", description: "Lãi đầu tư, cổ tức", type: "income" },
  { id: 14, name: "Bán đồ", description: "Bán đồ cũ, không dùng", type: "income" },
  { id: 15, name: "Làm thêm", description: "Thu nhập từ công việc phụ", type: "income" },
  { id: 16, name: "Quà tặng", description: "Tiền quà, mừng tuổi", type: "income" },
  { id: 17, name: "Chuyển tiền", description: "Chuyển tiền giữa các ví", type: "income" },
  { id: 18, name: "Khác", description: "Thu nhập khác", type: "income" },
];

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState("expense"); // expense | income
  
  // ⚠️ USING LOCAL STATE - Backend chưa có API
  const [expenseCategories, setExpenseCategories] = useState(MOCK_EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState(MOCK_INCOME_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  
  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "" });
  const [nextId, setNextId] = useState(19); // For generating new IDs

  // ⚠️ MOCK FUNCTION - Backend chưa có API
  const loadCategories = async () => {
    // Do nothing - using mock data
    console.warn("⚠️ Backend chưa có API quản lý categories");
    console.warn("📝 Hiện tại dùng mock data local");
  };

  // Load categories on mount
  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentList =
    activeTab === "expense" ? expenseCategories : incomeCategories;

  const resetForm = () => {
    setNameInput("");
    setDescInput("");
    setEditingId(null);
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    try {
      if (editingId) {
        // ✅ UPDATE CATEGORY (LOCAL)
        const updater = (cats) =>
          cats.map((c) =>
            c.id === editingId
              ? { ...c, name: nameInput.trim(), description: descInput.trim() }
              : c
          );

        if (activeTab === "expense") {
          setExpenseCategories(updater);
        } else {
          setIncomeCategories(updater);
        }

        setToast({ open: true, message: "✅ Đã cập nhật danh mục." });
      } else {
        // ✅ CREATE CATEGORY (LOCAL)
        const newCat = {
          id: nextId,
          name: nameInput.trim(),
          description: descInput.trim(),
          type: activeTab,
        };

        if (activeTab === "expense") {
          setExpenseCategories([...expenseCategories, newCat]);
        } else {
          setIncomeCategories([...incomeCategories, newCat]);
        }

        setNextId(nextId + 1);
        setToast({ open: true, message: "✅ Đã thêm danh mục mới." });
      }

      resetForm();
    } catch (error) {
      console.error("❌ Error saving category:", error);
      setToast({
        open: true,
        message: "Không thể lưu danh mục",
      });
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setNameInput(cat.name);
    setDescInput(cat.description || "");
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;

    try {
      // ✅ DELETE CATEGORY (LOCAL)
      if (activeTab === "expense") {
        setExpenseCategories(expenseCategories.filter((c) => c.id !== cat.id));
      } else {
        setIncomeCategories(incomeCategories.filter((c) => c.id !== cat.id));
      }

      setToast({ open: true, message: "✅ Đã xóa danh mục." });
      if (editingId === cat.id) resetForm();
    } catch (error) {
      console.error("❌ Error deleting category:", error);
      setToast({
        open: true,
        message: "Không thể xóa danh mục",
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="cat-page container py-4">
        <Loading />
      </div>
    );
  }

  // Show error if API failed
  if (apiError) {
    return (
      <div className="cat-page container py-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {apiError}
          <button 
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={loadCategories}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cat-page container py-4">
      {/* HEADER – màu giống trang Danh sách ví */}
      <div
        className="cat-header card border-0 mb-3"
        style={{
          borderRadius: 18,
          background:
            "linear-gradient(90deg, #00325d 0%, #004b8f 40%, #005fa8 100%)",
          color: "#ffffff",
        }}
      >
        <div className="card-body d-flex justify-content-between align-items-center">
          {/* BÊN TRÁI: ICON + TEXT */}
          <div className="d-flex align-items-center gap-2">
            <div className="cat-header-icon-wrap">
              {/* icon giống ở sidebar: Danh mục = bi-tags */}
              <i className="bi bi-tags cat-header-icon" />
            </div>
            <div>
              <h2 className="mb-1" style={{ color: "#ffffff" }}>
                Danh Mục
              </h2>
              <p className="mb-0" style={{ color: "rgba(255,255,255,0.82)" }}>
                Thêm các danh mục mà bạn thường tiêu tiền vào hoặc nhận tiền từ
                đây.
              </p>
            </div>
          </div>

          {/* BÊN PHẢI: NÚT TAB */}
          <div className="d-flex align-items-center gap-3">
            <div
              className="btn-group rounded-pill bg-white p-1"
              role="group"
              style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.4)" }}
            >
              <button
                type="button"
                className={
                  "btn btn-sm rounded-pill fw-semibold px-3 " +
                  (activeTab === "expense"
                    ? "text-white bg-success"
                    : "text-dark bg-white")
                }
                onClick={() => {
                  setActiveTab("expense");
                  resetForm();
                }}
              >
                Chi phí
              </button>

              <button
                type="button"
                className={
                  "btn btn-sm rounded-pill fw-semibold px-3 " +
                  (activeTab === "income"
                    ? "text-white bg-success"
                    : "text-dark bg-white")
                }
                onClick={() => {
                  setActiveTab("income");
                  resetForm();
                }}
              >
                Thu nhập
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ WARNING MESSAGE */}
      <div className="alert alert-warning d-flex align-items-start gap-2 mb-3">
        <i className="bi bi-exclamation-triangle fs-5 mt-1"></i>
        <div className="flex-grow-1">
          <h6 className="mb-1 fw-semibold">⚠️ Danh mục chỉ lưu trữ local</h6>
          <p className="mb-0 small">
            Backend chưa có API quản lý categories. Các thay đổi bạn thực hiện (thêm/sửa/xóa) chỉ tồn tại trong phiên làm việc hiện tại.
            Refresh trang = mất data. Tuy nhiên, các danh mục mặc định vẫn luôn có sẵn khi tạo giao dịch.
          </p>
        </div>
      </div>

      {/* FORM THÊM / SỬA */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <form
            className="row g-3 align-items-end"
            onSubmit={handleAddOrUpdate}
          >
            <div className="col-md-4">
              <label className="form-label fw-semibold">Tên danh mục</label>
              <input
                className="form-control"
                placeholder="VD: Ăn uống, Lương..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={40}
                required
              />
            </div>
            <div className="col-md-5">
              <label className="form-label fw-semibold">Mô tả</label>
              <input
                className="form-control"
                placeholder="Mô tả ngắn cho danh mục (tùy chọn)"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary flex-grow-1">
                {editingId ? "Lưu thay đổi" : "Thêm danh mục"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={resetForm}
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* BẢNG DANH MỤC */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              Danh sách danh mục{" "}
              <span className="badge bg-light text-secondary ms-1">
                {activeTab === "expense" ? "Chi phí" : "Thu nhập"}
              </span>
            </h5>
            <span className="text-muted small">
              Tổng: {currentList.length} danh mục
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>#</th>
                  <th style={{ width: "25%" }}>Tên danh mục</th>
                  <th>Mô tả</th>
                  <th className="text-center" style={{ width: "15%" }}>
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Chưa có danh mục nào.
                    </td>
                  </tr>
                ) : (
                  currentList.map((c, idx) => (
                    <tr key={c.id}>
                      <td>{idx + 1}</td>
                      <td className="fw-semibold">{c.name}</td>
                      <td>{c.description || "-"}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-link btn-sm text-muted me-2"
                          type="button"
                          onClick={() => handleEdit(c)}
                          title="Sửa"
                        >
                          <i className="bi bi-pencil-square" />
                        </button>
                        <button
                          className="btn btn-link btn-sm text-danger"
                          type="button"
                          onClick={() => handleDelete(c)}
                          title="Xóa"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SuccessToast
        open={toast.open}
        message={toast.message}
        duration={2200}
        onClose={() => setToast({ open: false, message: "" })}
      />
    </div>
  );
}