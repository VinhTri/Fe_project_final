// src/pages/Home/WalletsPage.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useWalletData } from "../../home/store/WalletDataContext";

import WalletCard from "../../components/wallets/WalletCard";
import WalletEditModal from "../../components/wallets/WalletEditModal";
import ConfirmModal from "../../components/common/Modal/ConfirmModal";
import SuccessToast from "../../components/common/Toast/SuccessToast";
import WalletCreateChooser from "../../components/wallets/WalletCreateChooser";
import WalletCreatePersonalModal from "../../components/wallets/WalletCreatePersonalModal";
import WalletCreateGroupModal from "../../components/wallets/WalletCreateGroupModal";
import WalletInspector from "../../components/wallets/WalletInspector";
import useToggleMask from "../../hooks/useToggleMask";

import "../../styles/home/WalletsPage.css";

const CURRENCIES = ["VND", "USD", "EUR", "JPY", "GBP"];

/** Hook animate mở/đóng bằng max-height + opacity (mượt cả khi đóng) */
function useAutoHeight(isOpen, deps = []) {
  const ref = useRef(null);
  const [maxH, setMaxH] = useState(isOpen ? "none" : "0px");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isOpen) {
      setMaxH("0px");
      requestAnimationFrame(() => {
        const h = el.scrollHeight;
        setMaxH(h + "px");
        const id = setTimeout(() => setMaxH("none"), 400);
        return () => clearTimeout(id);
      });
    } else {
      const current = getComputedStyle(el).maxHeight;
      if (current === "none") {
        const h = el.scrollHeight;
        setMaxH(h + "px");
        requestAnimationFrame(() => setMaxH("0px"));
      } else {
        setMaxH("0px");
      }
    }
  }, [isOpen, ...deps]);

  return {
    ref,
    props: {
      className: "exp-anim",
      style: { maxHeight: maxH },
      "aria-hidden": isOpen ? "false" : "true",
    },
  };
}

const formatMoney = (amount = 0, currency = "VND") => {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    })
      .format(Number(amount) || 0)
      .replace(/\s?₫$/, " VND");
  } catch {
    return `${(Number(amount) || 0).toLocaleString("vi-VN")} ${currency}`;
  }
};

export default function WalletsPage() {
  const { wallets, createWallet, updateWallet, deleteWallet } = useWalletData();

  // ===== Tổng quan & toggle =====
  const [showTotalAll, toggleTotalAll] = useToggleMask(true);
  const [showTotalPersonal, toggleTotalPersonal] = useToggleMask(true);
  const [showTotalGroup, toggleTotalGroup] = useToggleMask(true);

  // ===== Modal & lựa chọn =====
  const [showChooser, setShowChooser] = useState(false);
  const [showPersonal, setShowPersonal] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const anchorRef = useRef(null);

  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "" });

  // ===== Sắp xếp =====
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [sortScope, setSortScope] = useState("all");
  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  // ===== Mở rộng =====
  const [expandedSection, setExpandedSection] = useState(null);
  const isPersonalExpanded = expandedSection === "personal";
  const isGroupExpanded = expandedSection === "group";
  const toggleExpand = (key) =>
    setExpandedSection((prev) => (prev === key ? null : key));

  // ===== Inspector =====
  const [selectedWallet, setSelectedWallet] = useState(null);
  useEffect(() => {
    if (expandedSection === null) setSelectedWallet(null);
  }, [expandedSection]);

  const topRef = useRef(null);
  useEffect(() => {
    if (expandedSection && topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [expandedSection]);

  const inspectorRef = useRef(null);
  const focusInspector = (delay = 280) => {
    setTimeout(() => {
      const el = inspectorRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      el.classList.remove("flash");
      el.offsetHeight;
      el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 900);
    }, delay);
  };

  // ===== Đổi sang field backend =====
  const existingNames = useMemo(
    () => wallets.map((w) => w.walletName?.toLowerCase().trim() || ""),
    [wallets]
  );

  const compareByKey = (a, b, key) => {
    if (key === "walletName")
      return (a.walletName || "").localeCompare(b.walletName || "");
    if (key === "initialBalance")
      return Number(a.initialBalance || 0) - Number(b.initialBalance || 0);
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  };
  const sortWith = (arr, key, dir) => {
    const out = [...arr].sort((a, b) => compareByKey(a, b, key));
    return dir === "asc" ? out : out.reverse();
  };
  const sortDefaultDesc = (arr) => sortWith(arr, "createdAt", "desc");

  const personalListRaw = useMemo(
    () => wallets.filter((w) => !w.isShared),
    [wallets]
  );
  const groupListRaw = useMemo(
    () => wallets.filter((w) => w.isShared),
    [wallets]
  );

  const personalWallets = useMemo(() => {
    const list = personalListRaw;
    if (sortScope === "all" || sortScope === "personal")
      return sortWith(list, sortKey, sortDir);
    return sortDefaultDesc(list);
  }, [personalListRaw, sortKey, sortDir, sortScope]);

  const groupWallets = useMemo(() => {
    const list = groupListRaw;
    if (sortScope === "all" || sortScope === "group")
      return sortWith(list, sortKey, sortDir);
    return sortDefaultDesc(list);
  }, [groupListRaw, sortKey, sortDir, sortScope]);

  const currencyOfChoice = useMemo(
    () => (wallets[0]?.currencyCode ? wallets[0].currencyCode : "VND"),
    [wallets]
  );

  // ===== Tổng =====
  const totalAll = useMemo(
    () =>
      wallets
        .filter((w) => w.includeOverall !== false)
        .reduce((s, w) => s + (Number(w.initialBalance) || 0), 0),
    [wallets]
  );

  const totalPersonal = useMemo(
    () =>
      personalListRaw
        .filter((w) => w.includePersonal !== false)
        .reduce((s, w) => s + (Number(w.initialBalance) || 0), 0),
    [personalListRaw]
  );

  const totalGroup = useMemo(
    () =>
      groupListRaw
        .filter((w) => w.includeGroup !== false)
        .reduce((s, w) => s + (Number(w.initialBalance) || 0), 0),
    [groupListRaw]
  );

  // ===== CRUD =====
  const handleAddWalletClick = () => setShowChooser((v) => !v);

  const doDelete = async (w) => {
    setConfirmDel(null);
    await deleteWallet(w.id);
    setToast({ open: true, message: `Đã xóa ví "${w.walletName}"` });
    if (selectedWallet?.id === w.id) setSelectedWallet(null);
  };

  // ✅ TẠO VÍ CÁ NHÂN - đã sửa key
  const handleCreatePersonal = async (f) => {
    const res = await createWallet({
      walletName: f.walletName.trim(),
      currencyCode: f.currencyCode,
      initialBalance: Number(f.initialBalance || 0),
      description: f.description?.trim() || "",
      setAsDefault: !!f.setAsDefault,
    });

    const w = res?.wallet;
    if (w?.setAsDefault) {
      const others = wallets.filter((x) => x.id !== w.id && x.setAsDefault);
      if (others.length) {
        await Promise.all(
          others.map((x) => updateWallet({ ...x, setAsDefault: false }))
        );
      }
    }

    setShowPersonal(false);
    setToast({
      open: true,
      message: `Đã tạo ví cá nhân "${w?.walletName || "Mới"}"`,
    });
  };

  const afterCreateGroupWallet = async (w) => {
    if (w && (w.includeOverall === undefined || w.includeGroup === undefined)) {
      const updated = { ...w, includeOverall: true, includeGroup: true };
      await updateWallet(updated);
    }
    setToast({
      open: true,
      message: `Đã tạo ví nhóm "${w?.walletName || ""}"`,
    });
  };

  // ✅ CẬP NHẬT VÍ - đã sửa key
  const handleSubmitEdit = async (data) => {
    const updated = {
      ...data,
      walletName: data.walletName?.trim(),
      currencyCode: data.currencyCode,
      initialBalance: Number(data.initialBalance || 0),
      description: data.description?.trim() || "",
      setAsDefault: !!data.setAsDefault,
    };

    await updateWallet(updated);

    if (updated?.setAsDefault) {
      const others = wallets.filter(
        (x) => x.id !== updated.id && x.setAsDefault
      );
      if (others.length) {
        await Promise.all(
          others.map((x) => updateWallet({ ...x, setAsDefault: false }))
        );
      }
    }

    setEditing(null);
    setToast({ open: true, message: "Cập nhật ví thành công" });
    if (selectedWallet?.id === updated.id) setSelectedWallet(updated);
  };

  // Rút tiền (giữ nguyên logic)
  const handleWithdraw = async (wallet, amount) => {
    const next = {
      ...wallet,
      initialBalance: Number(wallet.initialBalance || 0) - Number(amount),
    };
    await updateWallet(next);
    setSelectedWallet(next);
    setToast({ open: true, message: "Rút tiền thành công" });
  };
  // Gộp ví (merge)
  const handleMerge = async ({ mode, baseWallet, otherWallet }) => {
    if (!otherWallet) return;
    if (mode === "this_to_other") {
      const to = {
        ...otherWallet,
        initialBalance:
          Number(otherWallet.initialBalance || 0) +
          Number(baseWallet.initialBalance || 0),
      };
      await updateWallet(to);
      await deleteWallet(baseWallet.id);
      if (selectedWallet?.id === baseWallet.id) setSelectedWallet(to);
      setToast({
        open: true,
        message: `Đã gộp "${baseWallet.walletName}" vào "${otherWallet.walletName}"`,
      });
    } else {
      const to = {
        ...baseWallet,
        initialBalance:
          Number(baseWallet.initialBalance || 0) +
          Number(otherWallet.initialBalance || 0),
      };
      await updateWallet(to);
      await deleteWallet(otherWallet.id);
      if (selectedWallet?.id === baseWallet.id) setSelectedWallet(to);
      setToast({
        open: true,
        message: `Đã gộp "${otherWallet.walletName}" vào "${baseWallet.walletName}"`,
      });
    }
  };

  // Chuyển đổi loại ví
  const handleConvert = async (wallet, toShared) => {
    const next = {
      ...wallet,
      isShared: !!toShared,
      groupId: toShared ? wallet.groupId || null : null,
    };
    await updateWallet(next);
    setSelectedWallet(next);
    setToast({ open: true, message: "Chuyển đổi loại ví thành công" });
  };

  // Toggle hiển thị tổng & từng phần
  const handleToggleOverall = async (wallet, nextOn) => {
    const next = { ...wallet, includeOverall: !!nextOn };
    await updateWallet(next);
    if (selectedWallet?.id === wallet.id) setSelectedWallet(next);
  };

  const handleToggleSection = async (wallet, nextOn) => {
    const next = { ...wallet };
    if (wallet.isShared) next.includeGroup = !!nextOn;
    else next.includePersonal = !!nextOn;
    await updateWallet(next);
    if (selectedWallet?.id === wallet.id) setSelectedWallet(next);
  };

  // Auto-height containers
  const personalExpand = useAutoHeight(isPersonalExpanded, [
    personalWallets.length,
  ]);
  const groupExpand = useAutoHeight(isGroupExpanded, [groupWallets.length]);

  // Click card: mở rộng (trừ vùng tương tác)
  const isInteractiveEvent = (e) => {
    const t = e.target;
    return !!t.closest(
      ".dropdown, .dropdown-menu, .wc-dots, button, a, input, textarea, select, label, .form-check"
    );
  };

  // Quản lý refs của từng card
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const cardRefs = useRef({});
  const setCardRef = (id) => (el) => {
    if (el) cardRefs.current[id] = el;
  };
  const scrollToSelected = (delayMs = 0) => {
    const id = selectedWalletId || selectedWallet?.id;
    const el = id ? cardRefs.current[id] : null;
    if (!el) return;
    const run = () =>
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    delayMs > 0 ? setTimeout(run, delayMs) : run();
  };

  const handleCardClick = (section, wallet) => {
    setSelectedWallet(wallet);
    setSelectedWalletId(wallet.id);

    const willOpenPersonal = section === "personal" && !isPersonalExpanded;
    const willOpenGroup = section === "group" && !isGroupExpanded;
    if (willOpenPersonal) setExpandedSection("personal");
    if (willOpenGroup) setExpandedSection("group");

    const needDelay = willOpenPersonal || willOpenGroup;
    const delay = needDelay ? 480 : 0;
    scrollToSelected(delay);
    focusInspector(needDelay ? 300 : 0);
  };

  const handleCardAreaClick = (section, wallet) => (e) => {
    if (isInteractiveEvent(e)) return;
    handleCardClick(section, wallet);
  };

  useEffect(() => {
    if (!selectedWalletId) return;
    if (isPersonalExpanded || isGroupExpanded) {
      scrollToSelected(0);
    }
  }, [selectedWalletId, isPersonalExpanded, isGroupExpanded]);

  // Đưa ví mặc định lên đầu
  const defaultFirst = (arr) => {
    const d = [];
    const r = [];
    for (const w of arr) {
      (w?.setAsDefault ? d : r).push(w);
    }
    return [...d, ...r];
  };
  // ===== Render =====
  return (
    <div className="wallet-page container py-4">
      <div ref={topRef} />

      {/* ===== Header ===== */}
      <div className="wallet-header card border-0 shadow-sm p-3 p-lg-4 mb-2">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <h3 className="wallet-header__title mb-0">
            <i className="bi bi-wallet2 me-2"></i> Danh sách ví
          </h3>

          <div className="wallet-header__controls d-flex align-items-center gap-3 flex-wrap">
            {/* Phạm vi */}
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-layers-half text-light opacity-75"></i>
              <label className="sort-label text-light">Phạm vi:</label>
              <select
                className="form-select form-select-sm sort-select"
                value={sortScope}
                onChange={(e) => setSortScope(e.target.value)}
              >
                <option value="all">Tất cả ví</option>
                <option value="personal">Chỉ ví cá nhân</option>
                <option value="group">Chỉ ví nhóm</option>
              </select>
            </div>

            {/* Sắp xếp */}
            <div className="sort-box d-flex align-items-center gap-2">
              <i className="bi bi-sort-alpha-down text-light opacity-75"></i>
              <label className="sort-label text-light">Sắp xếp theo:</label>
              <select
                className="form-select form-select-sm sort-select"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="initialBalance">Số tiền</option>
                <option value="walletName">Tên ví</option>
              </select>

              <button
                className="btn btn-sm btn-outline-light sort-dir-btn"
                onClick={toggleSortDir}
              >
                {sortDir === "asc" ? (
                  <>
                    <i className="bi bi-sort-down-alt me-1" /> Tăng
                  </>
                ) : (
                  <>
                    <i className="bi bi-sort-up me-1" /> Giảm
                  </>
                )}
              </button>
            </div>

            {/* Tạo ví mới */}
            <div className="position-relative">
              <button
                ref={anchorRef}
                className="btn btn-sm btn-outline-light sort-dir-btn d-flex align-items-center"
                onClick={handleAddWalletClick}
              >
                <i className="bi bi-plus-lg me-2"></i> Tạo ví mới
              </button>
              <WalletCreateChooser
                open={showChooser}
                anchorRef={anchorRef}
                onClose={() => setShowChooser(false)}
                onChoosePersonal={() => {
                  setShowChooser(false);
                  setShowPersonal(true);
                }}
                onChooseGroup={() => {
                  setShowChooser(false);
                  setShowGroup(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Tổng tất cả ví ===== */}
      {expandedSection === null && (
        <section className="mt-2 mb-3">
          <div className="sum-card sum-card--overall">
            <div className="sum-card__title">TỔNG SỐ DƯ</div>
            <div className="sum-card__value">
              {formatMoney(
                showTotalAll ? totalAll : 0,
                currencyOfChoice || "VND"
              ).replace(
                /[\d,.]+/,
                showTotalAll
                  ? new Intl.NumberFormat("vi-VN", {
                      maximumFractionDigits:
                        (currencyOfChoice || "VND") === "VND" ? 0 : 2,
                    }).format(totalAll)
                  : "••••••"
              )}
              <i
                className={`bi ${
                  showTotalAll ? "bi-eye" : "bi-eye-slash"
                } money-eye`}
                onClick={toggleTotalAll}
              />
            </div>
            <div className="sum-card__desc">
              Tổng hợp tất cả số dư các ví (chỉ tính ví đang bật).
            </div>
          </div>
        </section>
      )}

      {/* ===== Hai cột ví ===== */}
      <div className="row g-4">
        {/* ===== Ví cá nhân ===== */}
        <div
          className={
            isPersonalExpanded
              ? "col-12"
              : isGroupExpanded
              ? "d-none"
              : "col-12 col-lg-6"
          }
        >
          <section
            className={`wallet-section card border-0 shadow-sm h-100 ${
              isPersonalExpanded ? "section-expanded" : ""
            }`}
          >
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0">
                  <i className="bi bi-person-fill me-2"></i>Ví cá nhân
                </h5>

                <button
                  type="button"
                  className="section-toggle"
                  aria-expanded={isPersonalExpanded}
                  onClick={() => toggleExpand("personal")}
                />
              </div>
              <span className="badge bg-light text-dark">
                {personalWallets.length} ví
              </span>
            </div>

            <div className="card-body">
              {/* ==== KHỐI MỞ RỘNG ==== */}
              <div ref={personalExpand.ref} {...personalExpand.props}>
                <div className="row gx-4">
                  {/* Tổng cá nhân */}
                  <div className="col-12">
                    <div className="sum-card sum-card--mini sum-card--personal mb-3">
                      <div className="sum-card__title">
                        TỔNG SỐ DƯ (CÁ NHÂN)
                      </div>
                      <div className="sum-card__value">
                        {formatMoney(
                          showTotalPersonal ? totalPersonal : 0,
                          currencyOfChoice || "VND"
                        ).replace(
                          /[\d,.]+/,
                          showTotalPersonal
                            ? new Intl.NumberFormat("vi-VN", {
                                maximumFractionDigits:
                                  (currencyOfChoice || "VND") === "VND" ? 0 : 2,
                              }).format(totalPersonal)
                            : "••••••"
                        )}
                        <i
                          className={`bi ${
                            showTotalPersonal ? "bi-eye" : "bi-eye-slash"
                          } money-eye`}
                          onClick={toggleTotalPersonal}
                        />
                      </div>
                      <div className="sum-card__desc">
                        Tổng hợp số dư của các ví cá nhân đang bật.
                      </div>
                    </div>
                  </div>

                  {/* Danh sách ví */}
                  <div className="col-12 col-lg-8">
                    {personalWallets.length === 0 ? (
                      <div className="alert alert-light border rounded-3 mb-0">
                        Chưa có ví nào. Nhấn <strong>Tạo ví mới</strong> để
                        thêm.
                      </div>
                    ) : (
                      <div className="wallet-grid wallet-grid--expanded-two wallet-grid--limit-6">
                        {defaultFirst(personalWallets).map((w) => (
                          <div
                            className={`wallet-grid__item ${
                              selectedWalletId === w.id ? "is-selected" : ""
                            }`}
                            key={w.id}
                            ref={setCardRef(w.id)}
                            role="button"
                            tabIndex={0}
                            onClickCapture={handleCardAreaClick("personal", w)}
                            onKeyDown={(e) =>
                              (e.key === "Enter" || e.key === " ") &&
                              handleCardClick("personal", w)
                            }
                          >
                            <WalletCard
                              wallet={w}
                              onToggleOverall={handleToggleOverall}
                              onToggleSection={handleToggleSection}
                              onEdit={setEditing}
                              onDelete={setConfirmDel}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inspector */}
                  <aside className="col-12 col-lg-4" ref={inspectorRef}>
                    <WalletInspector
                      wallet={selectedWallet}
                      wallets={wallets}
                      masked={false}
                      formatMoney={formatMoney}
                      maskMoney={(amount, cur, visible) =>
                        visible ? formatMoney(amount, cur || "VND") : "••••••"
                      }
                      onEdit={setEditing}
                      onDelete={(w) => setConfirmDel(w)}
                      onWithdraw={handleWithdraw}
                      onMerge={handleMerge}
                      onConvert={handleConvert}
                    />
                  </aside>
                </div>
              </div>

              {/* ==== KHỐI THU GỌN ==== */}
              {!isPersonalExpanded && (
                <>
                  {personalWallets.length === 0 ? (
                    <div className="alert alert-light border rounded-3 mb-0 mt-2">
                      Chưa có ví nào. Nhấn <strong>Tạo ví mới</strong> để thêm.
                    </div>
                  ) : (
                    <div className="wallet-grid wallet-grid--limit-6 mt-2">
                      {defaultFirst(personalWallets).map((w) => (
                        <div
                          className={`wallet-grid__item ${
                            selectedWalletId === w.id ? "is-selected" : ""
                          }`}
                          key={w.id}
                          ref={setCardRef(w.id)}
                          role="button"
                          tabIndex={0}
                          onClickCapture={handleCardAreaClick("personal", w)}
                          onKeyDown={(e) =>
                            (e.key === "Enter" || e.key === " ") &&
                            handleCardClick("personal", w)
                          }
                        >
                          <WalletCard
                            wallet={w}
                            onToggleOverall={handleToggleOverall}
                            onToggleSection={handleToggleSection}
                            onEdit={setEditing}
                            onDelete={setConfirmDel}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        {/* ===== Ví nhóm ===== */}
        <div
          className={
            isGroupExpanded
              ? "col-12"
              : isPersonalExpanded
              ? "d-none"
              : "col-12 col-lg-6"
          }
        >
          <section
            className={`wallet-section card border-0 shadow-sm h-100 ${
              isGroupExpanded ? "section-expanded" : ""
            }`}
          >
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0">
                  <i className="bi bi-people-fill me-2"></i>Ví nhóm
                </h5>
                <button
                  type="button"
                  className="section-toggle"
                  aria-expanded={isGroupExpanded}
                  onClick={() => toggleExpand("group")}
                />
              </div>
              <span className="badge bg-light text-dark">
                {groupWallets.length} ví
              </span>
            </div>

            <div className="card-body">
              <div ref={groupExpand.ref} {...groupExpand.props}>
                <div className="row gx-4">
                  {/* Tổng nhóm */}
                  <div className="col-12">
                    <div className="sum-card sum-card--mini sum-card--group mb-3">
                      <div className="sum-card__title">TỔNG SỐ DƯ (NHÓM)</div>
                      <div className="sum-card__value">
                        {formatMoney(
                          showTotalGroup ? totalGroup : 0,
                          currencyOfChoice || "VND"
                        ).replace(
                          /[\d,.]+/,
                          showTotalGroup
                            ? new Intl.NumberFormat("vi-VN", {
                                maximumFractionDigits:
                                  (currencyOfChoice || "VND") === "VND" ? 0 : 2,
                              }).format(totalGroup)
                            : "••••••"
                        )}
                        <i
                          className={`bi ${
                            showTotalGroup ? "bi-eye" : "bi-eye-slash"
                          } money-eye`}
                          onClick={toggleTotalGroup}
                        />
                      </div>
                      <div className="sum-card__desc">
                        Tổng hợp số dư của các ví nhóm đang bật.
                      </div>
                    </div>
                  </div>

                  {/* Grid ví nhóm */}
                  <div className="col-12 col-lg-8">
                    {groupWallets.length === 0 ? (
                      <div className="alert alert-light border rounded-3 mb-0">
                        Chưa có ví nhóm nào. Chọn <strong>Tạo ví nhóm</strong>{" "}
                        trong menu “Tạo ví mới”.
                      </div>
                    ) : (
                      <div className="wallet-grid wallet-grid--expanded-two wallet-grid--limit-6">
                        {defaultFirst(groupWallets).map((w) => (
                          <div
                            className={`wallet-grid__item ${
                              selectedWalletId === w.id ? "is-selected" : ""
                            }`}
                            key={w.id}
                            ref={setCardRef(w.id)}
                            role="button"
                            tabIndex={0}
                            onClickCapture={handleCardAreaClick("group", w)}
                            onKeyDown={(e) =>
                              (e.key === "Enter" || e.key === " ") &&
                              handleCardClick("group", w)
                            }
                          >
                            <WalletCard
                              wallet={w}
                              onToggleOverall={handleToggleOverall}
                              onToggleSection={handleToggleSection}
                              onEdit={setEditing}
                              onDelete={setConfirmDel}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inspector */}
                  <aside className="col-12 col-lg-4" ref={inspectorRef}>
                    <WalletInspector
                      wallet={selectedWallet}
                      wallets={wallets}
                      masked={false}
                      formatMoney={formatMoney}
                      maskMoney={(amount, cur, visible) =>
                        visible ? formatMoney(amount, cur || "VND") : "••••••"
                      }
                      onEdit={setEditing}
                      onDelete={(w) => setConfirmDel(w)}
                      onWithdraw={handleWithdraw}
                      onMerge={handleMerge}
                      onConvert={handleConvert}
                    />
                  </aside>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ===== Modals ===== */}
      <WalletCreatePersonalModal
        open={showPersonal}
        onClose={() => setShowPersonal(false)}
        currencies={CURRENCIES}
        existingNames={existingNames}
        onSubmit={handleCreatePersonal}
      />
      <WalletCreateGroupModal
        open={showGroup}
        onClose={() => setShowGroup(false)}
        currencies={CURRENCIES}
        onCreated={afterCreateGroupWallet}
      />

      {editing && (
        <WalletEditModal
          wallet={editing}
          currencies={CURRENCIES}
          existingNames={existingNames}
          onClose={() => setEditing(null)}
          onSubmit={handleSubmitEdit}
        />
      )}

      <ConfirmModal
        open={!!confirmDel}
        title="Xóa ví"
        message={confirmDel ? `Xóa ví "${confirmDel.walletName}"?` : ""}
        okText="Xóa"
        cancelText="Hủy"
        onOk={() => doDelete(confirmDel)}
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
