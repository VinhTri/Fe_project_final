import React, { useMemo, useState } from "react";
import "../../styles/home/TransactionsPage.css";
import TransactionViewModal from "../../components/transactions/TransactionViewModal";
import TransactionFormModal from "../../components/transactions/TransactionFormModal";
import ConfirmModal from "../../components/common/Modal/ConfirmModal";
import SuccessToast from "../../components/common/Toast/SuccessToast";

const MOCK_TRANSACTIONS = [
  {
    id: 1,
    code: "TX-0001",
    type: "expense",
    walletName: "Tiền mặt",
    amount: 50000,
    currency: "VND",
    date: "2023-10-20T12:00",
    category: "Ăn uống",
    note: "Bữa trưa vui vẻ cùng đồng nghiệp",
    creatorCode: "USR001",
    attachment:
      "https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 2,
    code: "TX-0002",
    type: "income",
    walletName: "Ngân hàng A",
    amount: 1500000,
    currency: "VND",
    date: "2023-10-19T09:00",
    category: "Lương thưởng",
    note: "Lương tuần",
    creatorCode: "USR001",
    attachment: "",
  },
];

const PAGE_SIZE = 10;

function toDateObj(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterWallet, setFilterWallet] = useState("all");
  const [fromDateTime, setFromDateTime] = useState("");
  const [toDateTime, setToDateTime] = useState("");

  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "" });

  const [currentPage, setCurrentPage] = useState(1);

  const nextCode = () => {
    const max = transactions.reduce((m, t) => {
      const num = parseInt(String(t.code || "").replace(/\D/g, ""), 10);
      return isNaN(num) ? m : Math.max(m, num);
    }, 0);
    const n = max + 1;
    return `TX-${String(n).padStart(4, "0")}`;
  };

  const handleCreate = (payload) => {
    const tx = {
      id: Date.now(),
      code: nextCode(),
      creatorCode: "USR001",
      attachment: payload.attachment || "",
      ...payload,
    };
    setTransactions((list) => [tx, ...list]);
    setCreating(false);
    setToast({ open: true, message: "Đã thêm giao dịch mới." });
    setCurrentPage(1);
  };

  const handleUpdate = (payload) => {
    if (!editing) return;
    setTransactions((list) =>
      list.map((t) =>
        t.id === editing.id ? { ...t, ...payload, attachment: payload.attachment || t.attachment } : t
      )
    );
    setEditing(null);
    setToast({ open: true, message: "Đã cập nhật giao dịch." });
  };

  const handleDelete = () => {
    if (!confirmDel) return;
    setTransactions((list) => list.filter((t) => t.id !== confirmDel.id));
    setConfirmDel(null);
    setToast({ open: true, message: "Đã xóa giao dịch." });
  };

  const allCategories = useMemo(() => {
    const s = new Set(transactions.map((t) => t.category).filter(Boolean));
    return Array.from(s);
  }, [transactions]);

  const allWallets = useMemo(() => {
    const s = new Set(transactions.map((t) => t.walletName).filter(Boolean));
    return Array.from(s);
  }, [transactions]);

  const filteredSorted = useMemo(() => {
    let list = transactions.slice();

    list = list.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (filterWallet !== "all" && t.walletName !== filterWallet) return false;

      const d = toDateObj(t.date);
      if (!d) return false;

      if (fromDateTime) {
        const from = toDateObj(fromDateTime);
        if (from && d < from) return false;
      }
      if (toDateTime) {
        const to = toDateObj(toDateTime);
        if (to && d > to) return false;
      }

      if (searchText) {
        const keyword = searchText.toLowerCase();
        const joined = [
          t.code,
          t.walletName,
          t.category,
          t.note,
          t.amount?.toString(),
        ]
          .join(" ")
          .toLowerCase();
        if (!joined.includes(keyword)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      const da = toDateObj(a.date)?.getTime() || 0;
      const db = toDateObj(b.date)?.getTime() || 0;
      return db - da;
    });

    return list;
  }, [
    transactions,
    filterType,
    filterCategory,
    filterWallet,
    fromDateTime,
    toDateTime,
    searchText,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSorted.slice(start, start + PAGE_SIZE);
  }, [filteredSorted, currentPage]);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const handleDateChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchText("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterWallet("all");
    setFromDateTime("");
    setToDateTime("");
    setCurrentPage(1);
  };

  return (
    <div className="tx-page container py-4">
      {/* Header */}
      <div className="tx-header card border-0 mb-3">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <h2 className="tx-title mb-1">Quản lý Giao dịch</h2>
            <p className="text-muted mb-0">
              Xem, tìm kiếm và quản lý các khoản thu chi gần đây.
            </p>
          </div>
          <button
            className="btn btn-primary tx-add-btn d-flex align-items-center"
            onClick={() => setCreating(true)}
          >
            <i className="bi bi-plus-lg me-2" />
            Thêm giao dịch mới
          </button>
        </div>
      </div>

      {/* Filters – chia 2 hàng */}
      <div className="tx-filters card border-0 mb-3">
        <div className="card-body d-flex flex-column gap-2">
          {/* Hàng 1: search + loại + danh mục */}
          <div className="d-flex flex-wrap gap-2">
            <div className="tx-filter-item flex-grow-1">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  className="form-control border-start-0"
                  placeholder="Tìm kiếm giao dịch..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="tx-filter-item">
              <select
                className="form-select"
                value={filterType}
                onChange={handleFilterChange(setFilterType)}
              >
                <option value="all">Loại giao dịch</option>
                <option value="income">Thu nhập</option>
                <option value="expense">Chi tiêu</option>
              </select>
            </div>

            <div className="tx-filter-item">
              <select
                className="form-select"
                value={filterCategory}
                onChange={handleFilterChange(setFilterCategory)}
              >
                <option value="all">Danh mục</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hàng 2: ví + khoảng thời gian + nút xóa lọc */}
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <div className="tx-filter-item">
              <select
                className="form-select"
                value={filterWallet}
                onChange={handleFilterChange(setFilterWallet)}
              >
                <option value="all">Ví</option>
                {allWallets.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="tx-filter-item d-flex align-items-center gap-1">
              <input
                type="datetime-local"
                className="form-control tx-filter-datetime-input"
                value={fromDateTime}
                onChange={handleDateChange(setFromDateTime)}
              />
              <span className="small text-muted">đến</span>
              <input
                type="datetime-local"
                className="form-control tx-filter-datetime-input"
                value={toDateTime}
                onChange={handleDateChange(setToDateTime)}
              />
            </div>

            <div className="ms-auto">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={clearFilters}
              >
                <i className="bi bi-x-circle me-1" />
                Xóa lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 tx-table-card">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr className="text-muted small">
                <th>Ngày</th>
                <th>Thời gian</th>
                <th>Loại</th>
                <th>Ví</th>
                <th>Danh mục</th>
                <th>Mô tả</th>
                <th className="text-end">Số tiền</th>
                <th className="text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    Không có giao dịch nào phù hợp.
                  </td>
                </tr>
              )}

              {paginated.map((t) => {
                const d = toDateObj(t.date);
                const dateStr = d
                  ? d.toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "";
                const timeStr = d
                  ? d.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <tr key={t.id}>
                    <td>{dateStr}</td>
                    <td>{timeStr}</td>
                    <td>{t.type === "income" ? "Thu nhập" : "Chi tiêu"}</td>
                    <td>{t.walletName}</td>
                    <td>{t.category}</td>
                    <td className="tx-note-cell" title={t.note || "-"}>
                      {t.note || "-"}
                    </td>
                    <td className="text-end">
                      <span
                        className={
                          t.type === "expense"
                            ? "tx-amount-expense"
                            : "tx-amount-income"
                        }
                      >
                        {t.type === "expense" ? "-" : "+"}
                        {t.amount.toLocaleString("vi-VN")} {t.currency}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-link btn-sm text-muted me-1"
                        title="Xem chi tiết"
                        onClick={() => setViewing(t)}
                      >
                        <i className="bi bi-eye" />
                      </button>
                      <button
                        className="btn btn-link btn-sm text-muted me-1"
                        title="Chỉnh sửa"
                        onClick={() => setEditing(t)}
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        className="btn btn-link btn-sm text-danger"
                        title="Xóa"
                        onClick={() => setConfirmDel(t)}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="tx-pagination d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted small">
          Trang {currentPage}/{totalPages}
        </div>
        <div className="d-flex gap-1">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            « Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={
                "btn btn-sm btn-outline-secondary " +
                (p === currentPage ? "active" : "")
              }
              onClick={() => goToPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Sau »
          </button>
        </div>
      </div>

      {/* Modals & Toast */}
      <TransactionViewModal
        open={!!viewing}
        tx={viewing}
        onClose={() => setViewing(null)}
      />

      <TransactionFormModal
        open={creating}
        mode="create"
        onSubmit={handleCreate}
        onClose={() => setCreating(false)}
      />

      <TransactionFormModal
        open={!!editing}
        mode="edit"
        initialData={editing}
        onSubmit={handleUpdate}
        onClose={() => setEditing(null)}
      />

      <ConfirmModal
        open={!!confirmDel}
        title="Xóa giao dịch"
        message={
          confirmDel ? `Bạn chắc chắn muốn xóa giao dịch ${confirmDel.code}? ` : ""
        }
        okText="Xóa"
        cancelText="Hủy"
        onOk={handleDelete}
        onClose={() => setConfirmDel(null)}
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
