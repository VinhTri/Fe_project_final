import React, { useState } from "react";
import "../../styles/home/CategoriesPage.css";

let nextId = 1;

export default function CategoriesPage() {
  // type: "expense" = Chi phí, "income" = Thu nhập
  const [type, setType] = useState("expense");
  const [data, setData] = useState({
    expense: [],
    income: [],
  });

  // Modal thêm / sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = thêm mới
  const [nameInput, setNameInput] = useState("");

  // Modal xóa
  const [deleteItem, setDeleteItem] = useState(null);

  const currentList = data[type];

  const createDefaultIcon = () => (type === "expense" ? "💸" : "💰");

  // ====== MỞ MODAL THÊM / SỬA ======
  const openAddModal = () => {
    setEditingItem(null);
    setNameInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setNameInput(item.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNameInput("");
    setEditingItem(null);
  };

  // ====== LƯU (THÊM / SỬA) ======
  const handleSaveCategory = (e) => {
    e.preventDefault();
    const value = nameInput.trim();
    if (!value) return;

    if (editingItem) {
      // Sửa
      setData((prev) => ({
        ...prev,
        [type]: prev[type].map((c) =>
          c.id === editingItem.id ? { ...c, name: value } : c
        ),
      }));
    } else {
      // Thêm mới
      const newCat = {
        id: nextId++,
        name: value,
        icon: createDefaultIcon(),
      };

      setData((prev) => ({
        ...prev,
        [type]: [...prev[type], newCat],
      }));
    }

    closeModal();
  };

  // ====== XÓA ======
  const openDeleteModal = (item) => {
    setDeleteItem(item);
  };

  const closeDeleteModal = () => {
    setDeleteItem(null);
  };

  const confirmDelete = () => {
    if (!deleteItem) return;
    setData((prev) => ({
      ...prev,
      [type]: prev[type].filter((c) => c.id !== deleteItem.id),
    }));
    closeDeleteModal();
  };

  return (
    <div className="category-page container py-4">
      {/* Header giống layout trong ảnh */}
      <div className="card border-0 category-header-card mb-4">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h3 className="category-title mb-2">Danh Mục</h3>
            <p className="category-desc mb-0">
              Thêm các danh mục mà bạn thường tiêu tiền vào hoặc nhận được tiền
              từ đây
            </p>
          </div>

          <div className="category-header-right">
            <div className="category-type-toggle">
              <button
                type="button"
                className={`cat-toggle-btn ${
                  type === "expense" ? "active" : ""
                }`}
                onClick={() => setType("expense")}
              >
                Chi phí
              </button>
              <button
                type="button"
                className={`cat-toggle-btn ${
                  type === "income" ? "active" : ""
                }`}
                onClick={() => setType("income")}
              >
                Thu nhập
              </button>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm category-add-header-btn"
              onClick={openAddModal}
            >
              <i className="bi bi-plus-circle me-1" />
              Thêm danh mục
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách danh mục */}
      <div className="card border-0 category-list-card">
        <div className="card-body p-0">
          {currentList.length === 0 ? (
            <div className="category-empty text-center text-muted py-4">
              Chưa có danh mục nào. Nhấn{" "}
              <strong>&quot;Thêm danh mục&quot;</strong> để tạo danh mục đầu
              tiên.
            </div>
          ) : (
            <ul className="list-unstyled mb-0">
              {currentList.map((c) => (
                <li
                  key={c.id}
                  className="category-row d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="category-icon-wrapper">
                      <span className="category-icon">{c.icon}</span>
                    </div>
                    <span className="category-name">{c.name}</span>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <button
                      type="button"
                      className="category-link-btn"
                      onClick={() => openEditModal(c)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="category-link-btn category-link-btn--danger"
                      onClick={() => openDeleteModal(c)}
                    >
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ===== MODAL THÊM / SỬA DANH MỤC ===== */}
      {isModalOpen && (
        <div className="category-modal-backdrop">
          <div className="category-modal">
            <h5 className="category-modal-title mb-3">
              {editingItem ? "Sửa danh mục" : "Thêm danh mục"}
            </h5>

            <form onSubmit={handleSaveCategory}>
              <div className="mb-3">
                <label className="form-label category-modal-label">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  className="form-control category-input"
                  placeholder="Nhập tên danh mục..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL XÓA DANH MỤC ===== */}
      {deleteItem && (
        <div className="category-modal-backdrop">
          <div className="category-modal">
            <h5 className="category-modal-title mb-3">Xóa danh mục</h5>
            <p className="category-modal-text">
              Bạn có chắc muốn xóa danh mục{" "}
              <strong>{deleteItem.name}</strong> không?
            </p>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={closeDeleteModal}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={confirmDelete}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
