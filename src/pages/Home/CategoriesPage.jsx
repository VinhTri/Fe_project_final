import React, { useState } from "react";
import "../../styles/home/CategoriesPage.css";
import SuccessToast from "../../components/common/Toast/SuccessToast";
import CategoryFormModal from "../../components/categories/CategoryFormModal";

// 5 danh mục mẫu – Chi phí
const INITIAL_EXPENSE_CATEGORIES = [
  { id: 1, name: "Ăn uống", description: "Cơm, nước, cafe, đồ ăn vặt" },
  { id: 2, name: "Di chuyển", description: "Xăng xe, gửi xe, phương tiện công cộng" },
  { id: 3, name: "Mua sắm", description: "Quần áo, giày dép, đồ dùng cá nhân" },
  { id: 4, name: "Hóa đơn", description: "Điện, nước, internet, điện thoại" },
  { id: 5, name: "Giải trí", description: "Xem phim, game, du lịch, hội họp bạn bè" },
];

// 5 danh mục mẫu – Thu nhập
const INITIAL_INCOME_CATEGORIES = [
  { id: 101, name: "Lương", description: "Lương chính hàng tháng" },
  { id: 102, name: "Thưởng", description: "Thưởng dự án, thưởng KPI" },
  { id: 103, name: "Bán hàng", description: "Bán đồ cũ, bán online" },
  { id: 104, name: "Lãi tiết kiệm", description: "Lãi ngân hàng, lãi đầu tư an toàn" },
  { id: 105, name: "Khác", description: "Các khoản thu nhập khác" },
];

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState("expense"); // expense | income
  const [expenseCategories, setExpenseCategories] = useState(
    INITIAL_EXPENSE_CATEGORIES
  );
  const [incomeCategories, setIncomeCategories] = useState(
    INITIAL_INCOME_CATEGORIES
  );
  // search inputs (the inline form will be used for search)
  const [searchName, setSearchName] = useState("");
  const [searchDesc, setSearchDesc] = useState("");

  // modal for create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [modalInitial, setModalInitial] = useState("");
  const [modalEditingId, setModalEditingId] = useState(null);
  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toast, setToast] = useState({ open: false, message: "" });

  const currentList =
    activeTab === "expense" ? expenseCategories : incomeCategories;
  const displayedList = currentList.filter((c) => {
    const nameMatch = (c.name || "").toLowerCase().includes((searchName || "").toLowerCase());
    const descMatch = (c.description || "").toLowerCase().includes((searchDesc || "").toLowerCase());
    return nameMatch && descMatch;
  });
  const totalPages = Math.max(1, Math.ceil(displayedList.length / pageSize));
  const paginatedList = displayedList.slice((page - 1) * pageSize, page * pageSize);

  // adjust page if current page is out of bounds after filters/changes
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages, displayedList.length]);

  const resetSearch = () => {
    setSearchName("");
    setSearchDesc("");
    setPage(1);
  };

  // inline form becomes search; add/edit handled by modal
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // search is reactive via searchName/searchDesc
  };

  const openAddModal = () => {
    setModalMode("create");
    setModalInitial("");
    setModalEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setModalMode("edit");
    setModalInitial({ name: cat.name, description: cat.description || "" });
    setModalEditingId(cat.id);
    setModalOpen(true);
  };

  const handleModalSubmit = (payload) => {
    // payload = { name, description }
    if (modalMode === "create") {
      const data = { id: Date.now(), name: payload.name, description: payload.description };
      // insert at the beginning so new categories appear at top
      if (activeTab === "expense") {
        setExpenseCategories((list) => [data, ...list]);
      } else {
        setIncomeCategories((list) => [data, ...list]);
      }
      // go to first page to show the new item
      setPage(1);
      setToast({ open: true, message: "Đã thêm danh mục mới." });
    } else if (modalMode === "edit") {
      const updater = (list) => list.map((c) => (c.id === modalEditingId ? { ...c, name: payload.name, description: payload.description } : c));
      if (activeTab === "expense") {
        setExpenseCategories(updater);
      } else {
        setIncomeCategories(updater);
      }
      setToast({ open: true, message: "Đã cập nhật danh mục." });
    }
    setModalOpen(false);
    setModalEditingId(null);
  };

  const handleEdit = (cat) => {
    openEditModal(cat);
  };

  const handleDelete = (cat) => {
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;

    if (activeTab === "expense") {
      setExpenseCategories((list) => list.filter((c) => c.id !== cat.id));
    } else {
      setIncomeCategories((list) => list.filter((c) => c.id !== cat.id));
    }

    setToast({ open: true, message: "Đã xóa danh mục." });
    if (modalEditingId === cat.id) {
      setModalEditingId(null);
      setModalOpen(false);
    }
  };

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
                  resetSearch();
                  setPage(1);
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
                  resetSearch();
                  setPage(1);
                }}
              >
                Thu nhập
              </button>
            </div>
            <div className="ms-3">
              <button
                type="button"
                className="btn btn-sm btn-success rounded-pill category-add-header-btn"
                onClick={openAddModal}
                style={{ padding: "6px 14px" }}
              >
                Thêm danh mục
              </button>
            </div>
          </div>
        </div>
      </div>

      

      {/* FORM THÊM / SỬA */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <form className="row g-3 align-items-end" onSubmit={handleSearchSubmit}>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Tên danh mục</label>
              <input
                className="form-control"
                placeholder="VD: Ăn uống, Lương..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                maxLength={40}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label fw-semibold">Mô tả</label>
              <input
                className="form-control"
                placeholder="Mô tả ngắn cho danh mục (tùy chọn)"
                value={searchDesc}
                onChange={(e) => setSearchDesc(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary flex-grow-1">
                Tìm kiếm
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={resetSearch}>
                Xóa
              </button>
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
              Tổng: {displayedList.length} danh mục
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
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Chưa có danh mục nào.
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((c, idx) => (
                    <tr key={c.id}>
                      <td>{(page - 1) * pageSize + idx + 1}</td>
                      <td className="fw-semibold">{c.name}</td>
                      <td>{c.description || "-"}</td>
                      <td className="text-center">
                        <button className="btn btn-link btn-sm text-muted me-2" type="button" onClick={() => openEditModal(c)} title="Sửa">
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
          {/* PAGINATION (bottom-right) */}
          <div className="d-flex justify-content-end align-items-center mt-3">
            <div className="text-muted small me-3">Trang {page} / {totalPages}</div>
            <nav aria-label="Page navigation">
              <ul className="pagination mb-0">
                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous">« Trước</button>
                </li>
                <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next">Sau »</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <CategoryFormModal
        open={modalOpen}
        mode={modalMode}
        initialValue={modalInitial}
        typeLabel={activeTab === "expense" ? "chi phí" : "thu nhập"}
        onSubmit={handleModalSubmit}
        onClose={() => setModalOpen(false)}
      />

      <SuccessToast
        open={toast.open}
        message={toast.message}
        duration={2200}
        onClose={() => setToast({ open: false, message: "" })}
      />
    </div>
  );
}