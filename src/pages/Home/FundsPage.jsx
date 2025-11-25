// src/pages/Home/FundsPage.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useWalletData } from "../../home/store/WalletDataContext";
import {
  getAllFunds,
  getPersonalFunds,
  getGroupFunds,
  getParticipatedFunds,
  getFundDetails,
  createFund,
  updateFund,
  deleteFund,
  closeFund,
  depositToFund,
  withdrawFromFund,
} from "../../services/fund.service";
import Toast from "../../components/common/Toast/Toast";
import "../../styles/home/FundsPage.css";

import FundSection from "../../components/funds/FundSection";
import ParticipateManager from "../../components/funds/ParticipateManager";
import PersonalTermForm from "../../components/funds/PersonalTermForm";
import PersonalNoTermForm from "../../components/funds/PersonalNoTermForm";
import GroupTermForm from "../../components/funds/GroupTermForm";
import GroupNoTermForm from "../../components/funds/GroupNoTermForm";
import FundDetailView from "../../components/funds/FundDetailView";

export default function FundsPage() {
  const { wallets } = useWalletData();

  const personalWallets = useMemo(
    () => wallets.filter((w) => !w.isShared),
    [wallets]
  );
  const groupWallets = useMemo(
    () => wallets.filter((w) => w.isShared),
    [wallets]
  );

  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  // Map API fund data to frontend format
  const mapFundToFrontend = useCallback((apiFund) => {
    return {
      id: apiFund.fundId,
      fundId: apiFund.fundId,
      name: apiFund.fundName,
      fundName: apiFund.fundName,
      type: apiFund.fundType === "PERSONAL" ? "personal" : "group",
      hasTerm: apiFund.hasDeadline || false,
      role: "owner", // TODO: Determine role from API response
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
      autoDepositEnabled: apiFund.autoDepositEnabled,
      createdAt: apiFund.createdAt,
      updatedAt: apiFund.updatedAt,
    };
  }, []);

  // Load funds from API
  const loadFunds = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Load all funds in parallel
      const [allFundsRes, personalFundsRes, groupFundsRes, participatedFundsRes] = await Promise.all([
        getAllFunds(),
        getPersonalFunds(),
        getGroupFunds(),
        getParticipatedFunds(),
      ]);

      const allFunds = [];
      
      // Process personal funds (owner)
      if (personalFundsRes.response?.ok && personalFundsRes.data?.funds) {
        const personalFunds = personalFundsRes.data.funds.map(mapFundToFrontend);
        allFunds.push(...personalFunds);
      }

      // Process group funds (owner)
      if (groupFundsRes.response?.ok && groupFundsRes.data?.funds) {
        const groupFunds = groupFundsRes.data.funds.map(mapFundToFrontend);
        allFunds.push(...groupFunds);
      }

      // Process participated funds (view/manage role)
      if (participatedFundsRes.response?.ok && participatedFundsRes.data?.funds) {
        const participatedFunds = participatedFundsRes.data.funds.map((apiFund) => {
          const fund = mapFundToFrontend(apiFund);
          // Determine role from API (need to check API response structure)
          fund.role = "view"; // Default, should be determined from API
          return fund;
        });
        allFunds.push(...participatedFunds);
      }

      setFunds(allFunds);
    } catch (err) {
      console.error("Error loading funds:", err);
      setError("Không thể tải danh sách quỹ. Vui lòng thử lại sau.");
      setFunds([]);
    } finally {
      setLoading(false);
    }
  }, [mapFundToFrontend]);

  useEffect(() => {
    loadFunds();
  }, [loadFunds]);

  const personalTermFunds = useMemo(
    () =>
      funds.filter(
        (f) => f.type === "personal" && f.hasTerm && f.role === "owner"
      ),
    [funds]
  );
  const personalNoTermFunds = useMemo(
    () =>
      funds.filter(
        (f) => f.type === "personal" && !f.hasTerm && f.role === "owner"
      ),
    [funds]
  );
  const groupTermFunds = useMemo(
    () =>
      funds.filter(
        (f) => f.type === "group" && f.hasTerm && f.role === "owner"
      ),
    [funds]
  );
  const groupNoTermFunds = useMemo(
    () =>
      funds.filter(
        (f) => f.type === "group" && !f.hasTerm && f.role === "owner"
      ),
    [funds]
  );
  const participateViewFunds = useMemo(
    () => funds.filter((f) => f.role === "view"),
    [funds]
  );
  const participateUseFunds = useMemo(
    () => funds.filter((f) => f.role === "manage"),
    [funds]
  );

  const [viewMode, setViewMode] = useState("overview"); // overview | detail | create-personal | create-group | participate
  const [personalTab, setPersonalTab] = useState("term");
  const [groupTab, setGroupTab] = useState("term");
  const [activeFund, setActiveFund] = useState(null);

  const handleSelectFund = (fund) => {
    setActiveFund(fund);
    setViewMode("detail");
  };

  const handleUpdateFund = async (updatedFund) => {
    try {
      const { response, data } = await updateFund(updatedFund.fundId || updatedFund.id, {
        fundName: updatedFund.name || updatedFund.fundName,
        frequency: updatedFund.frequency,
        amountPerPeriod: updatedFund.amountPerPeriod,
        startDate: updatedFund.startDate,
        endDate: updatedFund.endDate,
        note: updatedFund.description || updatedFund.note,
        reminderEnabled: updatedFund.reminderEnabled,
        autoDepositEnabled: updatedFund.autoDepositEnabled,
        // Add other fields as needed
      });

      if (response?.ok && data?.fund) {
        const mappedFund = mapFundToFrontend(data.fund);
        setFunds((prev) =>
          prev.map((f) => (f.id === mappedFund.id ? mappedFund : f))
        );
        setActiveFund(mappedFund);
        setToast({ open: true, message: "Cập nhật quỹ thành công", type: "success" });
      } else {
        setToast({ open: true, message: data?.error || "Cập nhật quỹ thất bại", type: "error" });
      }
    } catch (err) {
      console.error("Error updating fund:", err);
      setToast({ open: true, message: "Lỗi kết nối khi cập nhật quỹ", type: "error" });
    }
  };

  const handleCreateFund = async (fundData) => {
    try {
      const { response, data } = await createFund(fundData);
      if (response?.ok && data?.fund) {
        setToast({ open: true, message: data.message || "Tạo quỹ thành công", type: "success" });
        await loadFunds(); // Reload funds
        setViewMode("overview"); // Return to overview
        setPersonalTab("term");
        setGroupTab("term");
      } else {
        setToast({ open: true, message: data?.error || "Tạo quỹ thất bại", type: "error" });
      }
    } catch (err) {
      console.error("Error creating fund:", err);
      setToast({ open: true, message: "Lỗi kết nối khi tạo quỹ", type: "error" });
    }
  };

  const handleDeleteFund = async (fundId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa quỹ này?")) {
      return;
    }
    try {
      const { response, data } = await deleteFund(fundId);
      if (response?.ok) {
        setToast({ open: true, message: data.message || "Xóa quỹ thành công", type: "success" });
        await loadFunds();
        if (activeFund?.id === fundId) {
          setActiveFund(null);
          setViewMode("overview");
        }
      } else {
        setToast({ open: true, message: data?.error || "Xóa quỹ thất bại", type: "error" });
      }
    } catch (err) {
      console.error("Error deleting fund:", err);
      setToast({ open: true, message: "Lỗi kết nối khi xóa quỹ", type: "error" });
    }
  };

  const handleDepositFund = async (fundId, amount) => {
    try {
      const { response, data } = await depositToFund(fundId, amount);
      if (response?.ok && data?.fund) {
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
      setToast({ open: true, message: "Lỗi kết nối khi nạp tiền", type: "error" });
    }
  };

  const handleWithdrawFund = async (fundId, amount) => {
    try {
      const { response, data } = await withdrawFromFund(fundId, amount);
      if (response?.ok && data?.fund) {
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
      setToast({ open: true, message: "Lỗi kết nối khi rút tiền", type: "error" });
    }
  };

  return (
    <div className="funds-page container py-4">
      {/* HEADER */}
      <div className="funds-header card border-0 shadow-sm mb-3 p-3 p-lg-4">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <h3 className="mb-1">
              <i className="bi bi-piggy-bank me-2" />
              Quỹ của bạn
            </h3>
            <p className="mb-0 text-muted">
              Theo dõi và quản lý các quỹ tiết kiệm, quỹ nhóm và quỹ bạn tham
              gia.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
            {viewMode === "overview" ? (
              <>
                <button
                  type="button"
                  className="btn btn-outline-primary funds-btn"
                  onClick={() => setViewMode("create-personal")}
                >
                  <i className="bi bi-plus-circle me-1" />
                  Tạo quỹ cá nhân
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setViewMode("create-group")}
                >
                  <i className="bi bi-people-fill me-1" />
                  Tạo quỹ nhóm
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setViewMode("participate")}
                >
                  <i className="bi bi-person-check me-1" />
                  Quản lý quỹ tham gia
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary"
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
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      {viewMode === "overview" && (
        <>
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
                Hãy bắt đầu bằng cách tạo <strong>quỹ cá nhân</strong> hoặc{" "}
                <strong>quỹ nhóm</strong> phù hợp với mục tiêu tài chính của
                bạn.
              </p>
            </div>
          ) : null}

          <div className="funds-two-col">
            {(personalTermFunds.length > 0 ||
              personalNoTermFunds.length > 0) && (
              <div className="funds-box">
                <div className="funds-box__header">Quỹ cá nhân</div>
                <div className="funds-box__body">
                  <p className="text-muted small mb-3">
                    Các quỹ tiết kiệm do riêng bạn sở hữu và quản lý.
                  </p>

                  <FundSection
                    title="Quỹ cá nhân có thời hạn"
                    subtitle="Các quỹ có ngày kết thúc rõ ràng."
                    items={personalTermFunds}
                    onSelectFund={handleSelectFund}
                  />

                  <FundSection
                    title="Quỹ cá nhân không thời hạn"
                    subtitle="Quỹ tích luỹ dài hạn, không xác định ngày kết thúc."
                    items={personalNoTermFunds}
                    onSelectFund={handleSelectFund}
                  />
                </div>
              </div>
            )}

            {(groupTermFunds.length > 0 || groupNoTermFunds.length > 0) && (
              <div className="funds-box">
                <div className="funds-box__header">Quỹ nhóm</div>
                <div className="funds-box__body">
                  <p className="text-muted small mb-3">
                    Quỹ góp chung với bạn bè, gia đình hoặc lớp/nhóm.
                  </p>

                  <FundSection
                    title="Quỹ nhóm có thời hạn"
                    subtitle="Quỹ góp chung có mục tiêu thời hạn."
                    items={groupTermFunds}
                    onSelectFund={handleSelectFund}
                  />

                  <FundSection
                    title="Quỹ nhóm không thời hạn"
                    subtitle="Quỹ nhóm dùng lâu dài, không cố định thời gian."
                    items={groupNoTermFunds}
                    onSelectFund={handleSelectFund}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {viewMode === "detail" && activeFund && (
        <div className="card border-0 shadow-sm p-3 p-lg-4">
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
          />
        </div>
      )}

      {viewMode === "create-personal" && (
        <div className="card border-0 shadow-sm p-3 p-lg-4">
          <div className="funds-tabs mb-3">
            <button
              type="button"
              className={
                "funds-tab" +
                (personalTab === "term" ? " funds-tab--active" : "")
              }
              onClick={() => setPersonalTab("term")}
            >
              Quỹ cá nhân có thời hạn
            </button>
            <button
              type="button"
              className={
                "funds-tab" +
                (personalTab === "no-term" ? " funds-tab--active" : "")
              }
              onClick={() => setPersonalTab("no-term")}
            >
              Quỹ cá nhân không thời hạn
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
            />
          ) : (
            <PersonalNoTermForm
              wallets={personalWallets}
              onSubmit={handleCreateFund}
              onCancel={() => {
                setViewMode("overview");
                setPersonalTab("term");
              }}
            />
          )}
        </div>
      )}

      {viewMode === "create-group" && (
        <div className="card border-0 shadow-sm p-3 p-lg-4">
          <div className="funds-tabs mb-3">
            <button
              type="button"
              className={
                "funds-tab" + (groupTab === "term" ? " funds-tab--active" : "")
              }
              onClick={() => setGroupTab("term")}
            >
              Quỹ nhóm có thời hạn
            </button>
            <button
              type="button"
              className={
                "funds-tab" +
                (groupTab === "no-term" ? " funds-tab--active" : "")
              }
              onClick={() => setGroupTab("no-term")}
            >
              Quỹ nhóm không thời hạn
            </button>
          </div>

          {groupTab === "term" ? (
            <GroupTermForm
              wallets={groupWallets}
              onSubmit={handleCreateFund}
              onCancel={() => {
                setViewMode("overview");
                setGroupTab("term");
              }}
            />
          ) : (
            <GroupNoTermForm
              wallets={groupWallets}
              onSubmit={handleCreateFund}
              onCancel={() => {
                setViewMode("overview");
                setGroupTab("term");
              }}
            />
          )}
        </div>
      )}

      {viewMode === "participate" && (
        <div className="card border-0 shadow-sm p-3 p-lg-4">
          <ParticipateManager
            viewFunds={participateViewFunds}
            useFunds={participateUseFunds}
          />
        </div>
      )}

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        duration={3000}
        onClose={() => setToast({ open: false, message: "", type: "success" })}
      />
    </div>
  );
}
