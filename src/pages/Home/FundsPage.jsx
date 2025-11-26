// src/pages/Home/FundsPage.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useWalletData } from "../../home/store/WalletDataContext";
import { fundAPI } from "../../services/api-client";
import Toast from "../../components/common/Toast/Toast";
import ConfirmModal from "../../components/common/Modal/ConfirmModal";
import "../../styles/home/FundsPage.css";

// Components
import FundSection from "../../components/funds/FundSection";
import PersonalTermForm from "../../components/funds/PersonalTermForm";
import PersonalNoTermForm from "../../components/funds/PersonalNoTermForm";
import FundDetailView from "../../components/funds/FundDetailView";

export default function FundsPage() {
  const { wallets } = useWalletData();

  // CHỈ VÍ CÁ NHÂN (vì đã bỏ quỹ nhóm)
  const personalWallets = useMemo(
    () => wallets.filter((w) => !w.isShared),
    [wallets]
  );

  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Map API fund data to frontend format
  const mapFundToFrontend = useCallback((apiFund) => {
    return {
      id: apiFund.fundId,
      fundId: apiFund.fundId,
      name: apiFund.fundName,
      fundName: apiFund.fundName,
      type: apiFund.fundType === "PERSONAL" ? "personal" : "group",
      hasTerm: apiFund.hasDeadline || false,
      role: "owner",
      current: Number(apiFund.currentAmount || 0),
      target: apiFund.targetAmount || null,
      currency: apiFund.currencyCode || "VND",
      description: apiFund.note || "",
      status: apiFund.status,
      progressPercentage: apiFund.progressPercentage || 0,
      members: apiFund.members || [],
      memberCount: apiFund.memberCount || 0,
      // Additional fields from API
      ownerId: apiFund.ownerId,
      ownerName: apiFund.ownerName,
      targetWalletId: apiFund.targetWalletId,
      targetWalletName: apiFund.targetWalletName,
      frequency: apiFund.frequency,
      amountPerPeriod: apiFund.amountPerPeriod,
      startDate: apiFund.startDate,
      endDate: apiFund.endDate,
      reminderEnabled: apiFund.reminderEnabled,
      reminderType: apiFund.reminderType,
      reminderTime: apiFund.reminderTime,
      reminderDayOfWeek: apiFund.reminderDayOfWeek,
      reminderDayOfMonth: apiFund.reminderDayOfMonth,
      reminderMonth: apiFund.reminderMonth,
      reminderDay: apiFund.reminderDay,
      autoDepositEnabled: apiFund.autoDepositEnabled,
      autoDepositType: apiFund.autoDepositType,
      sourceWalletId: apiFund.sourceWalletId,
      sourceWalletName: apiFund.sourceWalletName,
      autoDepositScheduleType: apiFund.autoDepositScheduleType,
      autoDepositTime: apiFund.autoDepositTime,
      autoDepositDayOfWeek: apiFund.autoDepositDayOfWeek,
      autoDepositDayOfMonth: apiFund.autoDepositDayOfMonth,
      autoDepositAmount: apiFund.autoDepositAmount,
      createdAt: apiFund.createdAt,
      updatedAt: apiFund.updatedAt,
    };
  }, []);

  // Load funds from API
  const loadFunds = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Load personal funds (chỉ quỹ cá nhân)
      const personalFundsRes = await fundAPI.getPersonalFunds();

      const allFunds = [];
      
      // Process personal funds (owner) - filter out soft-deleted
      if (personalFundsRes?.funds && Array.isArray(personalFundsRes.funds)) {
        const activePersonalFunds = personalFundsRes.funds.filter(
          (fund) => !fund.deletedAt && !fund.isDeleted && fund.status !== "DELETED"
        );
        const personalFunds = activePersonalFunds.map(mapFundToFrontend);
        allFunds.push(...personalFunds);
      }

      setFunds(allFunds);
    } catch (err) {
      console.error("Error loading funds:", err);
      setError(err.message || "Không thể tải danh sách quỹ. Vui lòng thử lại sau.");
      setFunds([]);
    } finally {
      setLoading(false);
    }
  }, [mapFundToFrontend]);

  useEffect(() => {
    loadFunds();
  }, [loadFunds]);

  // Lắng nghe sự kiện wallet currency thay đổi để reload funds
  useEffect(() => {
    const handleWalletCurrencyChanged = (event) => {
      const { walletId } = event.detail || {};
      // Reload funds để cập nhật currency và số tiền theo tỷ giá
      loadFunds();
    };

    window.addEventListener("walletCurrencyChanged", handleWalletCurrencyChanged);
    return () => {
      window.removeEventListener("walletCurrencyChanged", handleWalletCurrencyChanged);
    };
  }, [loadFunds]);

  // Chỉ lọc quỹ cá nhân
  const personalTermFunds = useMemo(
    () => funds.filter((f) => f.type === "personal" && f.hasTerm && f.role === "owner"),
    [funds]
  );
  const personalNoTermFunds = useMemo(
    () => funds.filter((f) => f.type === "personal" && !f.hasTerm && f.role === "owner"),
    [funds]
  );

  // View mode
  const [viewMode, setViewMode] = useState("overview"); // overview | detail | create
  const [personalTab, setPersonalTab] = useState("term");
  const [activeFund, setActiveFund] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Tìm kiếm + sắp xếp
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState("name"); // name | currentDesc | progressDesc

  const handleSelectFund = async (fund) => {
    // Load chi tiết quỹ từ API để đảm bảo dữ liệu mới nhất
    setLoadingDetail(true);
    try {
      const data = await fundAPI.getFundDetails(fund.id || fund.fundId);
      if (data?.fund) {
        const mappedFund = mapFundToFrontend(data.fund);
        setActiveFund(mappedFund);
        setViewMode("detail");
      } else {
        // Nếu không load được chi tiết, dùng dữ liệu hiện có
        setActiveFund(fund);
        setViewMode("detail");
      }
    } catch (err) {
      console.error("Error loading fund details:", err);
      // Nếu có lỗi, vẫn hiển thị với dữ liệu hiện có
      setActiveFund(fund);
      setViewMode("detail");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateFund = async (updatedFund) => {
    try {
      // Chuẩn bị đầy đủ các field theo API documentation
      const updatePayload = {
        fundName: updatedFund.name || updatedFund.fundName,
        frequency: updatedFund.frequency || "MONTHLY",
        amountPerPeriod: updatedFund.amountPerPeriod || 0,
        startDate: updatedFund.startDate,
        endDate: updatedFund.endDate || undefined,
        note: updatedFund.description || updatedFund.note || null,
        // Reminder fields
        reminderEnabled: updatedFund.reminderEnabled || false,
        reminderType: updatedFund.reminderType || "MONTHLY",
        reminderTime: updatedFund.reminderTime || "20:00:00",
        reminderDayOfWeek: updatedFund.reminderDayOfWeek,
        reminderDayOfMonth: updatedFund.reminderDayOfMonth,
        reminderMonth: updatedFund.reminderMonth,
        reminderDay: updatedFund.reminderDay,
        // Auto deposit fields
        autoDepositEnabled: updatedFund.autoDepositEnabled || false,
        autoDepositType: updatedFund.autoDepositType || "FOLLOW_REMINDER",
        sourceWalletId: updatedFund.sourceWalletId,
        autoDepositScheduleType: updatedFund.autoDepositScheduleType,
        autoDepositTime: updatedFund.autoDepositTime,
        autoDepositDayOfWeek: updatedFund.autoDepositDayOfWeek,
        autoDepositDayOfMonth: updatedFund.autoDepositDayOfMonth,
        autoDepositAmount: updatedFund.autoDepositAmount,
      };

      const data = await fundAPI.updateFund(updatedFund.fundId || updatedFund.id, updatePayload);

      if (data?.fund) {
        const mappedFund = mapFundToFrontend(data.fund);
        setFunds((prev) =>
          prev.map((f) => (f.id === mappedFund.id ? mappedFund : f))
        );
        setActiveFund(mappedFund);
        setToast({ open: true, message: data.message || "Cập nhật quỹ thành công", type: "success" });
      } else {
        setToast({ open: true, message: data?.error || "Cập nhật quỹ thất bại", type: "error" });
      }
    } catch (err) {
      console.error("Error updating fund:", err);
      setToast({ open: true, message: err.message || "Lỗi kết nối khi cập nhật quỹ", type: "error" });
    }
  };

  const handleCreateFund = async (fundData) => {
    try {
      // Kiểm tra ví đích có đang được sử dụng không
      if (fundData.targetWalletId) {
        const checkTargetResponse = await fundAPI.checkWalletUsed(fundData.targetWalletId);
        if (checkTargetResponse?.isUsed === true) {
          setToast({
            open: true,
            message: "Ví đích đang được sử dụng cho quỹ hoặc ngân sách khác. Vui lòng chọn ví khác.",
            type: "error",
          });
          return;
        }
      }

      // Kiểm tra ví nguồn có đang được sử dụng không
      if (fundData.autoDepositEnabled && fundData.sourceWalletId) {
        // Kiểm tra ví nguồn không được trùng với ví đích
        if (fundData.sourceWalletId === fundData.targetWalletId) {
          setToast({
            open: true,
            message: "Ví nguồn không được trùng với ví quỹ. Vui lòng chọn ví khác.",
            type: "error",
          });
          return;
        }

        // Kiểm tra ví nguồn có đang được sử dụng không
        const checkSourceResponse = await fundAPI.checkWalletUsed(fundData.sourceWalletId);
        if (checkSourceResponse?.isUsed === true) {
          setToast({
            open: true,
            message: "Ví nguồn đang được sử dụng cho quỹ hoặc ngân sách khác. Vui lòng chọn ví khác.",
            type: "error",
          });
          return;
        }
      }

      const data = await fundAPI.createFund(fundData);
      if (data?.fund) {
        setToast({ open: true, message: data.message || "Tạo quỹ thành công", type: "success" });
        await loadFunds(); // Reload funds
        setViewMode("overview"); // Return to overview
        setPersonalTab("term");
      } else {
        setToast({ open: true, message: data?.error || "Tạo quỹ thất bại", type: "error" });
      }
    } catch (err) {
      console.error("Error creating fund:", err);
      setToast({ open: true, message: err.message || "Lỗi kết nối khi tạo quỹ", type: "error" });
    }
  };

  const handleDeleteFund = async (fundId) => {
    setConfirmDelete(fundId);
  };

  const confirmDeleteFund = async () => {
    const fundId = confirmDelete;
    setConfirmDelete(null);
    if (!fundId) return;
    
    try {
      const data = await fundAPI.deleteFund(fundId);
      setToast({ open: true, message: data?.message || "Xóa quỹ thành công", type: "success" });
      await loadFunds();
      if (activeFund?.id === fundId) {
        setActiveFund(null);
        setViewMode("overview");
      }
    } catch (err) {
      console.error("Error deleting fund:", err);
      setToast({ open: true, message: err.message || "Xóa quỹ thất bại", type: "error" });
    }
  };

  const handleDepositFund = async (fundId, amount) => {
    try {
      const data = await fundAPI.depositToFund(fundId, amount);
      if (data?.fund) {
        setToast({ open: true, message: data.message || "Nạp tiền thành công", type: "success" });
        await loadFunds();
        if (activeFund?.id === fundId) {
          const updatedFund = mapFundToFrontend(data.fund);
          setActiveFund(updatedFund);
        }
      } else {
        setToast({ open: true, message: data?.error || "Nạp tiền thất bại", type: "error" });
      }
    } catch (err) {
      console.error("Error depositing to fund:", err);
      setToast({ open: true, message: err.message || "Lỗi kết nối khi nạp tiền", type: "error" });
    }
  };

  const handleWithdrawFund = async (fundId, amount) => {
    try {
      const data = await fundAPI.withdrawFromFund(fundId, amount);
      if (data?.fund) {
        setToast({ open: true, message: data.message || "Rút tiền thành công", type: "success" });
        await loadFunds();
        if (activeFund?.id === fundId) {
          const updatedFund = mapFundToFrontend(data.fund);
          setActiveFund(updatedFund);
        }
      } else {
        setToast({ open: true, message: data?.error || "Rút tiền thất bại", type: "error" });
      }
    } catch (err) {
      console.error("Error withdrawing from fund:", err);
      setToast({ open: true, message: err.message || "Lỗi kết nối khi rút tiền", type: "error" });
    }
  };

  const handleCloseFund = async (fundId) => {
    try {
      const data = await fundAPI.closeFund(fundId);
      setToast({ open: true, message: data?.message || "Đóng quỹ thành công", type: "success" });
      await loadFunds();
      if (activeFund?.id === fundId) {
        // Reload fund details
        try {
          const detailData = await fundAPI.getFundDetails(fundId);
          if (detailData?.fund) {
            const updatedFund = mapFundToFrontend(detailData.fund);
            setActiveFund(updatedFund);
          } else {
            setViewMode("overview");
            setActiveFund(null);
          }
        } catch (err) {
          setViewMode("overview");
          setActiveFund(null);
        }
      }
    } catch (err) {
      console.error("Error closing fund:", err);
      setToast({ open: true, message: err.message || "Đóng quỹ thất bại", type: "error" });
    }
  };

  // Helper: áp dụng search + sort
  const applySearchAndSort = (list) => {
    let result = [...list];

    // Tìm kiếm theo tên quỹ
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((f) =>
        (f.name || "").toLowerCase().includes(lower)
      );
    }

    // Sắp xếp
    switch (sortMode) {
      case "currentDesc": // Số tiền hiện tại giảm dần
        result.sort((a, b) => (b.current || 0) - (a.current || 0));
        break;
      case "progressDesc": {
        // Tỷ lệ hoàn thành giảm dần
        const getProgress = (f) =>
          f.target && f.target > 0 ? (f.current || 0) / f.target : 0;
        result.sort((a, b) => getProgress(b) - getProgress(a));
        break;
      }
      case "name":
      default:
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
    }

    return result;
  };

  const filteredTermFunds = useMemo(
    () => applySearchAndSort(personalTermFunds),
    [personalTermFunds, searchTerm, sortMode]
  );

  const filteredNoTermFunds = useMemo(
    () => applySearchAndSort(personalNoTermFunds),
    [personalNoTermFunds, searchTerm, sortMode]
  );

  return (
    <div className="funds-page py-4">
      {/* HEADER */}
      {/* HEADER QUỸ – CHUẨN LAYOUT GIỐNG VÍ */}
<div className="funds-header-unique mb-3">
  {/* TRÁI: ICON + TEXT */}
  <div className="funds-header-left">
    <div className="funds-header-icon">
      <i className="bi bi-piggy-bank" />
    </div>

    <div className="funds-header-text">
      <h2 className="mb-1">Quản lý quỹ</h2>
      <p className="mb-0 text-muted">
        Theo dõi và quản lý các quỹ tiết kiệm cá nhân của bạn.
      </p>
    </div>
  </div>

  {/* PHẢI: NÚT */}
  {viewMode === "overview" ? (
    <button
      type="button"
      className="btn btn-outline-primary funds-header-btn"
      onClick={() => setViewMode("create")}
    >
      <i className="bi bi-plus-circle me-1" />
      Tạo quỹ
    </button>
  ) : (
    <button
      type="button"
      className="btn btn-outline-secondary funds-header-btn"
      onClick={() => {
        setViewMode("overview");
        setActiveFund(null);
      }}
    >
      <i className="bi bi-arrow-left me-1" />
      Quay lại danh sách quỹ
    </button>
  )}
</div>

      {/* OVERVIEW */}
      {viewMode === "overview" && (
        <div className="funds-wrapper">
          {loading ? (
            <div className="card border-0 shadow-sm p-4 mb-3">
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 text-muted">Đang tải danh sách quỹ...</p>
              </div>
            </div>
          ) : error ? (
            <div className="card border-0 shadow-sm p-4 mb-3">
              <div className="alert alert-danger mb-0">
                <i className="bi bi-exclamation-triangle me-2" />
                {error}
                <button
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={loadFunds}
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : funds.length === 0 ? (
            <div className="card border-0 shadow-sm p-4 mb-3">
              <h5 className="mb-2">Chưa có quỹ nào</h5>
              <p className="mb-0 text-muted">
                Hãy bắt đầu bằng cách tạo <strong>quỹ cá nhân</strong> phù hợp với mục tiêu tài chính của bạn.
              </p>
            </div>
          ) : null}

          {/* Thanh tìm kiếm & sắp xếp */}
          {funds.length > 0 && (
            <div className="funds-toolbar">
              <div className="funds-toolbar__search">
                <i className="bi bi-search" />

                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên quỹ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {searchTerm && (
                  <button
                    type="button"
                    className="funds-clear-search"
                    onClick={() => setSearchTerm("")}
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                )}
              </div>

              <div className="funds-toolbar__sort">
                <span>Sắp xếp:</span>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value)}
                >
                  <option value="name">Tên quỹ (A → Z)</option>
                  <option value="currentDesc">
                    Số tiền hiện tại (cao → thấp)
                  </option>
                  <option value="progressDesc">
                    Tỷ lệ hoàn thành (cao → thấp)
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* 2 cột: có thời hạn / không thời hạn */}
          {funds.length > 0 && (
            <div className="funds-two-col">
              {/* BOX 1: QUỸ CÓ THỜI HẠN */}
              <div className="fund-section-wrapper fund-section-wrapper--term">
                <FundSection
                  title="Quỹ có thời hạn"
                  subtitle="Quỹ có mục tiêu rõ ràng và thời hạn kết thúc."
                  items={filteredTermFunds}        
                  onSelectFund={handleSelectFund}
                />
              </div>

              {/* BOX 2: QUỸ KHÔNG THỜI HẠN */}
              <div className="fund-section-wrapper fund-section-wrapper--no-term">
                <FundSection
                  title="Quỹ không thời hạn"
                  subtitle="Quỹ tích luỹ dài hạn, không có hạn chót."
                  items={filteredNoTermFunds}      
                  onSelectFund={handleSelectFund}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL */}
      {viewMode === "detail" && activeFund && (
        <div className="card border-0 shadow-sm p-3 p-lg-4">
          {loadingDetail ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-2 text-muted">Đang tải chi tiết quỹ...</p>
            </div>
          ) : (
            <FundDetailView
              fund={activeFund}
              onBack={() => {
                setViewMode("overview");
                setActiveFund(null);
              }}
              onUpdateFund={handleUpdateFund}
              onDeleteFund={handleDeleteFund}
              onDepositFund={handleDepositFund}
              onWithdrawFund={handleWithdrawFund}
              onCloseFund={handleCloseFund}
              onError={(message) => setToast({ open: true, message, type: "error" })}
            />
          )}
        </div>
      )}

      {/* CREATE FUND */}
      {viewMode === "create" && (
        <div className="card border-0 shadow-sm p-3 p-lg-4">
          <div className="funds-tabs mb-3">
            <button
              className={
                "funds-tab" + (personalTab === "term" ? " funds-tab--active" : "")
              }
              onClick={() => setPersonalTab("term")}
            >
              Quỹ có thời hạn
            </button>
            <button
              className={
                "funds-tab" +
                (personalTab === "no-term" ? " funds-tab--active" : "")
              }
              onClick={() => setPersonalTab("no-term")}
            >
              Quỹ không thời hạn
            </button>
          </div>

          {personalTab === "term" ? (
            <PersonalTermForm
              wallets={personalWallets}
              onSubmit={handleCreateFund}
              onCancel={() => {
                setViewMode("overview");
                setPersonalTab("term");
              }}
              onError={(message) => setToast({ open: true, message, type: "error" })}
            />
          ) : (
            <PersonalNoTermForm
              wallets={personalWallets}
              onSubmit={handleCreateFund}
              onCancel={() => {
                setViewMode("overview");
                setPersonalTab("term");
              }}
              onError={(message) => setToast({ open: true, message, type: "error" })}
            />
          )}
        </div>
      )}

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        duration={3000}
        onClose={() => setToast({ open: false, message: "", type: "success" })}
      />

      <ConfirmModal
        open={!!confirmDelete}
        title="Xóa quỹ"
        message="Bạn có chắc chắn muốn xóa quỹ này?"
        okText="Xóa"
        cancelText="Hủy"
        onOk={confirmDeleteFund}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
