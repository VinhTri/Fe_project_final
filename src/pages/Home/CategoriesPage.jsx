// src/pages/Home/CategoriesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../../styles/home/CategoriesPage.css";
import SuccessToast from "../../components/common/Toast/SuccessToast";
import { DataStore } from "../../store/DataStore";

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

const PAGE_SIZE = 8;

/* ---------- Modal thêm/sửa danh mục ---------- */
function CategoryModal({ open, mode, name, desc, onName, onDesc, onClose, onSubmit }) {
  if (!open) return null;

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)", // lớp mờ phía sau
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
  };

  return (
    <div style={overlayStyle}>
      <div className="modal-dialog" style={{ maxWidth: 520 }}>
        <div
          className="modal-content border-0 shadow-lg bg-white text-dark"
          style={{
            borderRadius: 20,
            backgroundColor: "#ffffff", // ép trắng hoàn toàn
          }}
        >
          <div className="modal-header border-0 pb-0" style={{ padding: "16px 22px 8px" }}>
            <h5 className="modal-title fw-semibold text-dark">
              {mode === "edit" ? "Sửa danh mục" : "Thêm danh mục"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="modal-body" style={{ padding: "12px 22px 18px" }}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark">Tên danh mục</label>
                <input
                  className="form-control bg-white text-dark"
                  placeholder="VD: Ăn uống, Lương..."
                  value={name}
                  onChange={(e) => onName(e.target.value)}
                  maxLength={40}
                  required
                />
              </div>
              <div className="mb-0">
                <label className="form-label fw-semibold text-dark">Mô tả</label>
                <input
                  className="form-control bg-white text-dark"
                  placeholder="Mô tả ngắn cho danh mục (tùy chọn)"
                  value={desc}
                  onChange={(e) => onDesc(e.target.value)}
                  maxLength={80}
                />
              </div>
            </div>

            <div className="modal-footer border-0 pt-0" style={{ padding: "8px 22px 16px" }}>
              <button type="button" className="btn btn-light" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                {mode === "edit" ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


/* ------------------- Page ------------------- */
export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState("expense"); // expense | income

  // Khởi tạo từ DataStore, fallback dữ liệu mẫu
  const [expenseCategories, setExpenseCategories] = useState(() => {
    const saved = DataStore.getExpenseCategories();
    return saved && saved.length > 0 ? saved : INITIAL_EXPENSE_CATEGORIES;
  });
  const [incomeCategories, setIncomeCategories] = useState(() => {
    const saved = DataStore.getIncomeCategories();
    return saved && saved.length > 0 ? saved : INITIAL_INCOME_CATEGORIES;
  });

  // Tìm kiếm (form cũ chuyển thành search)
  const [searchText, setSearchText] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Toast
  const [toast, setToast] = useState({ open: false, message: "" });

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);

  // Đồng bộ về DataStore để Transactions dùng được
  useEffect(() => {
    try {
      DataStore.setExpenseCategories(expenseCategories);
    } catch (_) {}
  }, [expenseCategories]);
  useEffect(() => {
    try {
      DataStore.setIncomeCategories(incomeCategories);
    } catch (_) {}
  }, [incomeCategories]);

  const currentList = activeTab === "expense" ? expenseCategories : incomeCategories;

  const filteredList = useMemo(() => {
    const kw = searchText.trim().toLowerCase();
    if (!kw) return currentList;
    return currentList.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        (c.description || "").toLowerCase().includes(kw)
    );
  }, [currentList, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredList.slice(start, start + PAGE_SIZE);

  const resetModal = () => {
    setNameInput("");
    setDescInput("");
    setEditingId(null);
    setModalMode("create");
  };

  const openCreateModal = () => {
    resetModal();
    setModalOpen(true);
  };

  const handleSubmitModal = () => {
    if (!nameInput.trim()) return;
    const data = {
      id: editingId || Date.now(),
      name: nameInput.trim(),
      description: descInput.trim(),
    };

    if (activeTab === "expense") {
      setExpenseCategories((list) => {
        if (modalMode === "edit") {
          return list.map((c) => (c.id === editingId ? data : c));
        }
        // mới thêm đứng đầu
        return [data, ...list];
      });
    } else {
      setIncomeCategories((list) => {
        if (modalMode === "edit") {
          return list.map((c) => (c.id === editingId ? data : c));
        }
        // mới thêm đứng đầu
        return [data, ...list];
      });
    }

    setToast({
      open: true,
      message: modalMode === "edit" ? "Đã cập nhật danh mục." : "Đã thêm danh mục mới.",
    });
    setModalOpen(false);
    // sau khi thêm -> về trang 1 để thấy mục mới
    setCurrentPage(1);
    resetModal();
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setNameInput(cat.name);
    setDescInput(cat.description || "");
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleDelete = (cat) => {
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;

    if (activeTab === "expense") {
      setExpenseCategories((list) => list.filter((c) => c.id !== cat.id));
    } else {
      setIncomeCategories((list) => list.filter((c) => c.id !== cat.id));
    }

    setToast({ open: true, message: "Đã xóa danh mục." });
    if (editingId === cat.id) resetModal();

    // nếu xóa trang cuối khiến rỗng -> lùi trang
    setTimeout(() => {
      const newTotal = Math.max(
        1,
        Math.ceil(
          (activeTab === "expense"
            ? (expenseCategories.length - 1)
            : (incomeCategories.length - 1)) / PAGE_SIZE
        )
      );
      if (currentPage > newTotal) setCurrentPage(newTotal);
    }, 0);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchText("");
    setCurrentPage(1);
  };

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  return (
    <div className="cat-page container py-4">
      {/* HEADER – màu giống trang Danh sách ví */}
      <div
        className="cat-header card border-0 mb-3"
        style={{
          borderRadius: 18,
          background: "linear-gradient(90deg, #00325d 0%, #004b8f 40%, #005fa8 100%)",
          color: "#ffffff",
        }}
      >
        <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          {/* BÊN TRÁI: ICON + TEXT */}
          <div className="d-flex align-items-center gap-2">
            <div className="cat-header-icon-wrap">
              <i className="bi bi-tags cat-header-icon" />
            </div>
            <div>
              <h2 className="mb-1" style={{ color: "#ffffff" }}>
                Danh Mục
              </h2>
              <p className="mb-0" style={{ color: "rgba(255,255,255,0.82)" }}>
                Thêm các danh mục mà bạn thường tiêu tiền vào hoặc nhận tiền từ đây.
              </p>
            </div>
          </div>

          {/* BÊN PHẢI: TAB + THÊM DANH MỤC */}
          <div className="d-flex align-items-center gap-2">
            <div
              className="btn-group rounded-pill bg-white p-1"
              role="group"
              style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.4)" }}
            >
              <button
                type="button"
                className={
                  "btn btn-sm rounded-pill fw-semibold px-3 " +
                  (activeTab === "expense" ? "text-white bg-success" : "text-dark bg-white")
                }
                onClick={() => switchTab("expense")}
              >
                Chi phí
              </button>

              <button
                type="button"
                className={
                  "btn btn-sm rounded-pill fw-semibold px-3 " +
                  (activeTab === "income" ? "text-white bg-success" : "text-dark bg-white")
                }
                onClick={() => switchTab("income")}
              >
                Thu nhập
              </button>
            </div>

            {/* Nút thêm: nền xanh, chữ trắng (giống “Thêm giao dịch mới”) */}
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center"
              onClick={openCreateModal}
              title="Thêm danh mục"
              style={{ borderRadius: 9999 }}
            >
              <i className="bi bi-plus-lg me-2" />
              Thêm danh mục
            </button>
          </div>
        </div>
      </div>

      {/* TÌM KIẾM (thay form cũ) */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  className="form-control border-start-0"
                  placeholder="Tìm danh mục theo tên hoặc mô tả..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className="col-md-4 d-flex justify-content-md-end">
              <span className="text-muted small">
                Tổng: {filteredList.length}/{currentList.length} danh mục
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BẢNG DANH MỤC */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
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
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Không có danh mục phù hợp.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((c, idx) => (
                    <tr key={c.id}>
                      <td>{start + idx + 1}</td>
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

        {/* Phân trang like ảnh: Trang X/Y + « Trước / Sau » */}
        <div className="card-footer d-flex justify-content-between align-items-center">
          <span className="text-muted small">
            Trang {currentPage}/{totalPages}
          </span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              « Trước
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Sau »
            </button>
          </div>
        </div>
      </div>

      {/* Modal thêm/sửa */}
      <CategoryModal
        open={modalOpen}
        mode={modalMode}
        name={nameInput}
        desc={descInput}
        onName={setNameInput}
        onDesc={setDescInput}
        onClose={() => {
          setModalOpen(false);
          if (modalMode === "create") resetModal();
        }}
        onSubmit={handleSubmitModal}
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
