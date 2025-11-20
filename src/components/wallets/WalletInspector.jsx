import React, { useMemo, useState, useEffect, useRef } from "react";
import { useLanguage } from "../../home/store/LanguageContext";

export default function WalletInspector({
  wallet,
  wallets = [],
  formatMoney,
  onEdit,
  onDelete,
  onWithdraw,
  onMerge,
  onConvert,
  onTransfer,
  onSelectWallet,
  accent,
  heroBg,
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("details");
  const [wAmount, setWAmount] = useState("");
  const [mergeMode, setMergeMode] = useState("this_to_other");
  const [otherId, setOtherId] = useState("");

  // ===== helpers =====
  const decimalsOf = (c) => (["VND", "JPY"].includes(String(c)) ? 0 : 2);
  const roundTo = (n, d = 0) => {
    const p = 10 ** d;
    return Math.round((Number(n) + Number.EPSILON) * p) / p;
  };

  useEffect(() => {
    setTab("details");
    setWAmount("");
    setMergeMode("this_to_other");
    setOtherId("");
  }, [wallet?.id]);

  const accentColor = wallet?.color || accent || "#6C7EE1";
  const heroBgCss = heroBg || wallet?.gradient || wallet?.color || accentColor;

  const heroRef = useRef(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.style.removeProperty("background");
    if (heroBgCss) {
      el.style.setProperty("background", heroBgCss, "important");
      el.style.setProperty("background-size", "cover");
      el.style.setProperty("border", "1px solid transparent", "important");
    }
  }, [heroBgCss, tab]);

  const walletId = wallet?.id ?? null;

  const getRate = (from, to) => {
    if (!from || !to || from === to) return 1;
    if (from === "USD" && to === "VND") return 24350;
    if (from === "VND" && to === "USD") return 1 / 24350;
    if (from === "EUR" && to === "VND") return 26400;
    if (from === "VND" && to === "EUR") return 1 / 26400;
    if (from === "JPY" && to === "VND") return 170;
    if (from === "VND" && to === "JPY") return 1 / 170;
    return 1;
  };

  // ===== RÚT TIỀN =====
  const canWithdraw =
    !!wallet && +wAmount > 0 && +wAmount <= +(wallet?.balance || 0);

  // ======================== MERGE ========================
  const [mStep, setMStep] = useState(1);
  const [keepCurrency, setKeepCurrency] = useState(null); // "TARGET" | "SOURCE"
  const [agree, setAgree] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);

  const mergeCandidates = useMemo(
    () => (wallets || []).filter((w) => w && String(w.id) !== String(walletId)),
    [wallets, walletId]
  );
  const pickedWallet = useMemo(
    () => mergeCandidates.find((x) => String(x.id) === String(otherId)) || null,
    [mergeCandidates, otherId]
  );

  const src = mergeMode === "this_to_other" ? wallet : pickedWallet;
  const dst = mergeMode === "this_to_other" ? pickedWallet : wallet;

  const currenciesDiffer =
    !!src && !!dst && (src.currency || "VND") !== (dst.currency || "VND");

  const rateST = useMemo(
    () => (src && dst ? getRate(src.currency, dst.currency) : 1),
    [src?.currency, dst?.currency]
  );

  const preview = useMemo(() => {
    if (!src || !dst) return null;
    const sBal = +src.balance || 0;
    const dBal = +dst.balance || 0;
    const sTx = +src.txCount || 0;
    const dTx = +dst.txCount || 0;

    if (!currenciesDiffer || keepCurrency === "TARGET") {
      // giữ tiền của ví đích
      const convertedRaw = sBal * rateST;
      const converted = roundTo(convertedRaw, decimalsOf(dst.currency));
      return {
        currency: dst.currency,
        newBalance: roundTo(dBal + converted, decimalsOf(dst.currency)),
        totalTx: sTx + dTx,
        rateUsed: currenciesDiffer
          ? `1 ${src.currency} = ${new Intl.NumberFormat("vi-VN", {
              maximumFractionDigits: 6,
            }).format(rateST)} ${dst.currency}`
          : null,
        convertedFrom: currenciesDiffer
          ? `${formatMoney(sBal, src.currency)} → ${formatMoney(
              converted,
              dst.currency
            )}`
          : null,
      };
    }
    // giữ tiền của ví nguồn
    const rateTS = rateST ? 1 / rateST : 0;
    const convertedRaw = dBal * rateTS;
    const converted = roundTo(convertedRaw, decimalsOf(src.currency));
    return {
      currency: src.currency,
      newBalance: roundTo(sBal + converted, decimalsOf(src.currency)),
      totalTx: sTx + dTx,
      rateUsed: `1 ${dst.currency} = ${new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 6,
      }).format(rateTS)} ${src.currency}`,
      convertedFrom: `${formatMoney(dBal, dst.currency)} → ${formatMoney(
        converted,
        src.currency
      )}`,
    };
  }, [src, dst, currenciesDiffer, keepCurrency, rateST, formatMoney]);

  useEffect(() => {
    setMStep(1);
    setKeepCurrency(null);
    setAgree(false);
    setMergeLoading(false);
  }, [wallet?.id]);

  // ======================== TRANSFER ========================
  const [tStep, setTStep] = useState(1);
  const [transferMode, setTransferMode] = useState("this_to_other");
  const [tOtherId, setTOtherId] = useState("");
  const [tAmount, setTAmount] = useState("");
  const [tAgree, setTAgree] = useState(false);
  const [tLoading, setTLoading] = useState(false);

  const transferCandidates = mergeCandidates;
  const tPickedWallet = useMemo(
    () =>
      transferCandidates.find((x) => String(x.id) === String(tOtherId)) || null,
    [transferCandidates, tOtherId]
  );

  const tSrc = transferMode === "this_to_other" ? wallet : tPickedWallet;
  const tDst = transferMode === "this_to_other" ? tPickedWallet : wallet;

  const tCurrenciesDiffer =
    !!tSrc && !!tDst && (tSrc.currency || "VND") !== (tDst.currency || "VND");

  const tRate = useMemo(
    () => (tSrc && tDst ? getRate(tSrc.currency, tDst.currency) : 1),
    [tSrc?.currency, tDst?.currency]
  );

  const tAmountNum = +tAmount || 0;
  const tCanTransfer =
    !!tSrc && !!tDst && tAmountNum > 0 && tAmountNum <= (+tSrc.balance || 0);

  const tConverted = useMemo(() => {
    if (!tSrc || !tDst) return 0;
    const raw = tCurrenciesDiffer ? tAmountNum * tRate : tAmountNum;
    return roundTo(raw, decimalsOf(tDst?.currency));
  }, [tAmountNum, tRate, tCurrenciesDiffer, tDst?.currency, tSrc]);

  const tPreview = useMemo(() => {
    if (!tSrc || !tDst || !tCanTransfer) return null;
    const sBal = +tSrc.balance || 0;
    const dBal = +tDst.balance || 0;
    const srcAfter = roundTo(sBal - tAmountNum, decimalsOf(tSrc.currency));
    const dstAfter = roundTo(dBal + tConverted, decimalsOf(tDst.currency));
    return {
      src: {
        id: tSrc.id,
        name: tSrc.name,
        currency: tSrc.currency,
        before: sBal,
        after: srcAfter,
        change: -tAmountNum,
      },
      dst: {
        id: tDst.id,
        name: tDst.name,
        currency: tDst.currency,
        before: dBal,
        after: dstAfter,
        change: tConverted,
      },
      rateUsed: tCurrenciesDiffer
        ? `1 ${tSrc.currency} = ${new Intl.NumberFormat("vi-VN", {
            maximumFractionDigits: 6,
          }).format(tRate)} ${tDst.currency}`
        : null,
      convertedFrom: tCurrenciesDiffer
        ? `${formatMoney(tAmountNum, tSrc.currency)} → ${formatMoney(
            tConverted,
            tDst.currency
          )}`
        : null,
    };
  }, [
    tSrc,
    tDst,
    tAmountNum,
    tConverted,
    tRate,
    tCurrenciesDiffer,
    tCanTransfer,
    formatMoney,
  ]);

  useEffect(() => {
    setTStep(1);
    setTransferMode("this_to_other");
    setTOtherId("");
    setTAmount("");
    setTAgree(false);
    setTLoading(false);
  }, [wallet?.id]);

  // ===== util: ép reload bằng reselect =====
  const forceReselect = (id) => {
    // Bỏ chọn rồi chọn lại để parent refetch/cập nhật số dư
    onSelectWallet?.(null);
    setTimeout(() => onSelectWallet?.(id ?? null), 0);
  };

  // ======================== UI ========================
  return (
    <div
      className="inspector card border-0 shadow-sm"
      style={{ "--wi-accent": accentColor }}
    >
      {/* Tabs */}
      <div className="inspector__tabs">
        <button
          className={`itab ${tab === "details" ? "active" : ""}`}
          onClick={() => setTab("details")}
          disabled={!wallet}
        >
          <i className="bi bi-card-text me-1" /> {t("wallets.inspector.tab.details")}
        </button>
        <button
          className={`itab ${tab === "withdraw" ? "active" : ""}`}
          onClick={() => setTab("withdraw")}
          disabled={!wallet}
        >
          <i className="bi bi-wallet2 me-1" /> {t("wallets.inspector.tab.withdraw")}
        </button>
        <button
          className={`itab ${tab === "transfer" ? "active" : ""}`}
          onClick={() => setTab("transfer")}
          disabled={!wallet}
        >
          <i className="bi bi-arrow-left-right me-1" /> {t("wallets.inspector.tab.transfer")}
        </button>
        <button
          className={`itab ${tab === "merge" ? "active" : ""}`}
          onClick={() => setTab("merge")}
          disabled={!wallet}
        >
          <i className="bi bi-intersect me-1" /> {t("wallets.inspector.tab.merge")}
        </button>
        <button
          className={`itab ${tab === "convert" ? "active" : ""}`}
          onClick={() => setTab("convert")}
          disabled={!wallet}
        >
          <i className="bi bi-arrow-left-right me-1" /> {t("wallets.inspector.tab.convert")}
        </button>
      </div>

      {/* Body */}
      <div className="card-body">
        {!wallet && (
          <>
            <h6 className="mb-2">{t("wallets.inspector.no_wallet_selected")}</h6>
            <p className="text-muted mb-0">
              {t("wallets.inspector.select_hint")}
            </p>
          </>
        )}

        {/* ===== Chi tiết ===== */}
        {wallet && tab === "details" && (
          <>
            <div
              ref={heroRef}
              className="inspector__hero mb-3 d-flex align-items-start justify-content-between gap-2"
            >
              <div>
                <div className="inspector__title">{wallet.name}</div>
                <div className="inspector__desc">
                  {t("wallets.inspector.details_desc")}
                </div>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-accent-soft"
                  title={t("common.edit")}
                  onClick={() => onEdit?.(wallet)}
                >
                  <i className="bi bi-pencil" />
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  title={t("wallets.modal.delete_title")}
                  onClick={() => onDelete?.(wallet)}
                >
                  <i className="bi bi-trash3" />
                </button>
              </div>
            </div>

            <div className="info-row">
              <div className="label">{t("wallets.inspector.current_balance")}</div>
              <div className="value">
                {formatMoney(wallet.balance, wallet.currency)}
              </div>
            </div>
            <div className="info-row">
              <div className="label">{t("wallets.inspector.spent")}</div>
              <div className="value">
                {formatMoney(+wallet.spent || 0, wallet.currency)}
              </div>
            </div>
            <div className="info-row">
              <div className="label">{t("wallets.inspector.remaining")}</div>
              <div className="value">
                {formatMoney(
                  (+wallet.balance || 0) - (+wallet.spent || 0),
                  wallet.currency
                )}
              </div>
            </div>

            <div className="mt-3 small text-muted">
              {t("wallets.inspector.type_info")}{" "}
              <strong>{wallet.isShared ? t("wallets.group_wallet") : t("wallets.personal_wallet")}</strong>, {t("wallets.inspector.currency_unit")} <strong>{wallet.currency}</strong>.{" "}
              {wallet.includeOverall === false
                ? t("wallets.inspector.exclude_overall")
                : t("wallets.inspector.include_overall")}
            </div>

            <div className="info-row mt-3">
              <div className="label">{t("wallets.inspector.note")}</div>
              <div className="value">{wallet.note || "-"}</div>
            </div>
            <div className="info-row">
              <div className="label">{t("wallets.inspector.created_at")}</div>
              <div className="value">
                {wallet.createdAt
                  ? new Date(wallet.createdAt).toLocaleString("vi-VN")
                  : "-"}
              </div>
            </div>
          </>
        )}

        {/* ===== Rút ví ===== */}
        {wallet && tab === "withdraw" && (
          <>
            <div className="mb-2">
              <label className="form-label">{t("wallets.inspector.withdraw_amount")}</label>
              <input
                type="number"
                className="form-control"
                min={0}
                value={wAmount}
                onChange={(e) => setWAmount(e.target.value)}
                placeholder={t("wallets.inspector.withdraw_amount_placeholder")}
              />
              <div className="form-text">
                {t("wallets.inspector.current_balance")}:{" "}
                <strong>
                  {formatMoney(wallet.balance, wallet.currency || "VND")}
                </strong>
              </div>
            </div>
            {!canWithdraw && wAmount && (
              <div className="text-danger small mb-2">
                {t("wallets.inspector.withdraw_invalid")}
              </div>
            )}

            <button
              disabled={!canWithdraw}
              className="btn btn-accent"
              onClick={() => {
                if (!canWithdraw) return;
                const v = roundTo(+wAmount, decimalsOf(wallet.currency));
                onWithdraw?.(wallet, v);
                setWAmount("");
                // Reload nhanh: bỏ chọn rồi chọn lại ví hiện tại
                forceReselect(wallet.id);
                setTab("details");
              }}
            >
              <i className="bi bi-check2-circle me-1" />
              {t("wallets.inspector.withdraw_confirm")}
            </button>
          </>
        )}

        {/* ===== Chuyển tiền ===== */}
        {wallet && tab === "transfer" && (
          <>
            <div className="mb-3">
              <div className="progress" style={{ height: 6 }}>
                <div
                  className="progress-bar"
                  style={{ width: `${(tStep - 1) * 33.33}%` }}
                />
              </div>
            </div>

            {tStep === 1 && (
              <>
                <div className="mb-3">
                  <label className="form-label">{t("wallets.inspector.transfer_direction")}</label>
                  <select
                    className="form-select"
                    value={transferMode}
                    onChange={(e) => {
                      setTransferMode(e.target.value);
                      setTOtherId("");
                      setTAmount("");
                      setTAgree(false);
                    }}
                  >
                    <option value="this_to_other">
                      {t("wallets.inspector.transfer_this_to_other")}
                    </option>
                    <option value="other_to_this">
                      {t("wallets.inspector.transfer_other_to_this")}
                    </option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    {transferMode === "this_to_other"
                      ? t("wallets.inspector.select_target_wallet")
                      : t("wallets.inspector.select_source_wallet")}
                  </label>
                  <select
                    className="form-select"
                    value={tOtherId}
                    onChange={(e) => setTOtherId(e.target.value)}
                  >
                    <option value="">{t("wallets.inspector.select_wallet_placeholder")}</option>
                    {transferCandidates.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.currency})
                      </option>
                    ))}
                  </select>
                  {!!tPickedWallet &&
                    tPickedWallet.currency !== wallet.currency && (
                      <div className="form-text text-warning">
                        {t("wallets.inspector.currency_diff_warning")}
                      </div>
                    )}
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setTab("details")}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    className="btn btn-accent"
                    disabled={!tPickedWallet}
                    onClick={() => setTStep(2)}
                  >
                    {t("common.next")} →
                  </button>
                </div>
              </>
            )}

            {tStep === 2 && (
              <>
                <div className="mb-2">
                  <label className="form-label">
                    {t("wallets.inspector.transfer_amount")} ({tSrc?.currency || "-"} →{" "}
                    {tDst?.currency || "-"})
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    value={tAmount}
                    onChange={(e) => setTAmount(e.target.value)}
                    placeholder={`${t("wallets.inspector.enter_amount_in")} ${tSrc?.currency || t("wallets.inspector.source")}`}
                  />
                  <div className="form-text">
                    {t("wallets.inspector.source_balance")}:{" "}
                    <strong>
                      {formatMoney(
                        tSrc?.balance || 0,
                        tSrc?.currency || "VND"
                      )}
                    </strong>
                  </div>
                  {tCurrenciesDiffer && (
                    <div className="small text-muted mt-1">
                      {t("wallets.inspector.exchange_rate")}: 1 {tSrc?.currency} ={" "}
                      {new Intl.NumberFormat("vi-VN", {
                        maximumFractionDigits: 6,
                      }).format(tRate)}{" "}
                      {tDst?.currency}
                    </div>
                  )}
                </div>
                {!tCanTransfer && tAmount && (
                  <div className="text-danger small mb-2">
                    {t("wallets.inspector.transfer_invalid")}
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setTStep(1)}
                  >
                    ← {t("common.back")}
                  </button>
                  <button
                    className="btn btn-accent"
                    onClick={() => setTStep(3)}
                    disabled={!tCanTransfer}
                  >
                    {t("common.preview")} →
                  </button>
                </div>
              </>
            )}

            {tStep === 3 && (
              <>
                <div className="mb-3 p-3 rounded border bg-light">
                  <div className="fw-semibold mb-1">{t("wallets.inspector.source_wallet")}: {tSrc?.name}</div>
                  <div className="small">
                    {t("wallets.inspector.before")}:{" "}
                    {formatMoney(tPreview?.src?.before || 0, tSrc?.currency)} ·{" "}
                    {t("wallets.inspector.after")}: {formatMoney(tPreview?.src?.after || 0, tSrc?.currency)}{" "}
                    · {t("wallets.inspector.change")}:{" "}
                    {formatMoney(tPreview?.src?.change || 0, tSrc?.currency)}
                  </div>
                </div>
                <div className="mb-3 p-3 rounded border bg-light">
                  <div className="fw-semibold mb-1">{t("wallets.inspector.target_wallet")}: {tDst?.name}</div>
                  <div className="small">
                    {t("wallets.inspector.before")}:{" "}
                    {formatMoney(tPreview?.dst?.before || 0, tDst?.currency)} ·{" "}
                    {t("wallets.inspector.after")}: {formatMoney(tPreview?.dst?.after || 0, tDst?.currency)}{" "}
                    · {t("wallets.inspector.change")}:{" "}
                    {formatMoney(tPreview?.dst?.change || 0, tDst?.currency)}
                  </div>
                </div>
                {(tPreview?.rateUsed || tPreview?.convertedFrom) && (
                  <div className="mb-3 p-3 rounded border">
                    {tPreview?.rateUsed && (
                      <div className="small text-muted mb-1">
                        {t("wallets.inspector.exchange_rate")}: {tPreview.rateUsed}
                      </div>
                    )}
                    {tPreview?.convertedFrom && (
                      <div className="small text-muted">
                        {t("wallets.inspector.conversion")}: {tPreview.convertedFrom}
                      </div>
                    )}
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setTStep(2)}
                  >
                    ← {t("common.back")}
                  </button>
                  <button
                    className="btn btn-accent"
                    onClick={() => setTStep(4)}
                  >
                    {t("common.continue")} →
                  </button>
                </div>
              </>
            )}

            {tStep === 4 && (
              <>
                <div className="alert alert-warning">
                  <ul className="m-0 ps-3 small">
                    <li>{t("wallets.inspector.transfer_warning_1")}</li>
                    {tCurrenciesDiffer && (
                      <li>
                        {t("wallets.inspector.transfer_warning_2")}
                      </li>
                    )}
                    <li>{t("wallets.inspector.transfer_warning_3")}</li>
                  </ul>
                </div>
                <label className="d-flex gap-2 align-items-start mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input mt-1"
                    checked={tAgree}
                    onChange={(e) => setTAgree(e.target.checked)}
                  />
                  <span>{t("wallets.inspector.i_agree")}</span>
                </label>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setTStep(3)}
                  >
                    ← {t("common.back")}
                  </button>
                  <button
                    className="btn btn-success"
                    disabled={!tAgree || !tCanTransfer || !tPreview || tLoading}
                    onClick={async () => {
                      if (!tPreview) return;
                      try {
                        setTLoading(true);
                        const amountRounded = roundTo(
                          tAmountNum,
                          decimalsOf(tSrc?.currency)
                        );
                        const convertedRounded = roundTo(
                          tConverted,
                          decimalsOf(tDst?.currency)
                        );

                        await onTransfer?.({
                          mode: transferMode,
                          sourceId: tSrc?.id,
                          targetId: tDst?.id,
                          amount: amountRounded, // số trừ ở nguồn
                          currencyFrom: tSrc?.currency,
                          currencyTo: tDst?.currency,
                          rateUsed: tRate,
                          convertedAmount: convertedRounded, // số cộng vào đích
                          preview: tPreview,
                        });

                        // Ép parent cập nhật số dư hai ví
                        if (transferMode === "this_to_other") {
                          // hiển thị ví nhận sau khi chuyển
                          forceReselect(tDst?.id);
                        } else {
                          // hiển thị ví gửi (là ví hiện tại)
                          forceReselect(tSrc?.id);
                        }

                        // Reset về chi tiết
                        setTab("details");
                        setTStep(1);
                        setTOtherId("");
                        setTAmount("");
                        setTAgree(false);
                      } finally {
                        setTLoading(false);
                      }
                    }}
                  >
                    {tLoading ? t("common.processing") : t("wallets.inspector.transfer_confirm")}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== Gộp ví ===== */}
        {wallet && tab === "merge" && (
          <>
            <div className="mb-3">
              <div className="progress" style={{ height: 6 }}>
                <div
                  className="progress-bar"
                  style={{ width: `${(mStep - 1) * 33.33}%` }}
                />
              </div>
            </div>

            {mStep === 1 && (
              <>
                <div className="mb-3">
                  <label className="form-label">{t("wallets.inspector.merge_mode")}</label>
                  <select
                    className="form-select"
                    value={mergeMode}
                    onChange={(e) => {
                      setMergeMode(e.target.value);
                      setOtherId("");
                      setKeepCurrency(null);
                    }}
                  >
                    <option value="this_to_other">{t("wallets.inspector.merge_this_to_other")}</option>
                    <option value="other_to_this">{t("wallets.inspector.merge_other_to_this")}</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    {mergeMode === "this_to_other"
                      ? t("wallets.inspector.select_target_wallet")
                      : t("wallets.inspector.select_source_wallet")}
                  </label>
                  <select
                    className="form-select"
                    value={otherId}
                    onChange={(e) => setOtherId(e.target.value)}
                  >
                    <option value="">{t("wallets.inspector.select_wallet_placeholder")}</option>
                    {mergeCandidates.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.currency})
                      </option>
                    ))}
                  </select>
                  {!!pickedWallet &&
                    pickedWallet.currency !== wallet.currency && (
                      <div className="form-text text-warning">
                        {t("wallets.inspector.currency_diff_warning")}
                      </div>
                    )}
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setTab("details")}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    className="btn btn-accent"
                    disabled={!pickedWallet}
                    onClick={() => setMStep(2)}
                  >
                    {t("common.next")} →
                  </button>
                </div>
              </>
            )}

            {mStep === 2 && (
              <>
                {currenciesDiffer ? (
                  <div className="list-group mb-3">
                    <label className="list-group-item d-flex gap-3">
                      <input
                        type="radio"
                        className="form-check-input mt-1"
                        checked={keepCurrency === "TARGET"}
                        onChange={() => setKeepCurrency("TARGET")}
                      />
                      <div>
                        <div className="fw-semibold">
                          {t("wallets.inspector.keep_currency")} {dst?.currency} ({t("wallets.inspector.target_wallet")})
                        </div>
                        <div className="small text-muted">
                          {t("wallets.inspector.convert")} {src?.currency} → {dst?.currency} · 1{" "}
                          {src?.currency} ={" "}
                          {new Intl.NumberFormat("vi-VN", {
                            maximumFractionDigits: 6,
                          }).format(rateST)}{" "}
                          {dst?.currency}
                        </div>
                      </div>
                    </label>

                    <label className="list-group-item d-flex gap-3">
                      <input
                        type="radio"
                        className="form-check-input mt-1"
                        checked={keepCurrency === "SOURCE"}
                        onChange={() => setKeepCurrency("SOURCE")}
                      />
                      <div>
                        <div className="fw-semibold">
                          {t("wallets.inspector.keep_currency")} {src?.currency} ({t("wallets.inspector.source_wallet")})
                        </div>
                        <div className="small text-muted">
                          {t("wallets.inspector.convert")} {dst?.currency} → {src?.currency} · 1{" "}
                          {dst?.currency} ≈{" "}
                          {new Intl.NumberFormat("vi-VN", {
                            maximumFractionDigits: 6,
                          }).format(1 / rateST)}{" "}
                          {src?.currency}
                        </div>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <span dangerouslySetInnerHTML={{ __html: t("wallets.inspector.same_currency_info", { currency: dst?.currency }) }} />
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setMStep(1)}
                  >
                    ← {t("common.back")}
                  </button>
                  <button
                    className="btn btn-accent"
                    onClick={() => setMStep(3)}
                    disabled={currenciesDiffer && !keepCurrency}
                  >
                    {t("common.preview")} →
                  </button>
                </div>
              </>
            )}

            {mStep === 3 && (
              <>
                <div className="mb-3 p-3 rounded border bg-light">
                  <div className="fw-semibold mb-1">{t("wallets.inspector.source_wallet")}: {src?.name}</div>
                  <div className="small">
                    {t("wallets.inspector.balance")}: {formatMoney(src?.balance, src?.currency)} · {t("wallets.inspector.transactions")}:{" "}
                    {src?.txCount || 0}
                  </div>
                </div>
                <div className="mb-3 p-3 rounded border bg-light">
                  <div className="fw-semibold mb-1">{t("wallets.inspector.merge_into")}: {dst?.name}</div>
                  <div className="small">
                    {t("wallets.inspector.balance")}: {formatMoney(dst?.balance, dst?.currency)} · {t("wallets.inspector.transactions")}:{" "}
                    {dst?.txCount || 0}
                  </div>
                </div>
                <div className="mb-3 p-3 rounded border">
                  <div className="fw-semibold mb-2">{t("wallets.inspector.after_merge")}</div>
                  {preview?.rateUsed && (
                    <div className="small text-muted mb-1">
                      {t("wallets.inspector.exchange_rate")}: {preview.rateUsed}
                    </div>
                  )}
                  {preview?.convertedFrom && (
                    <div className="small text-muted mb-2">
                      {t("wallets.inspector.conversion")}: {preview.convertedFrom}
                    </div>
                  )}
                  <div>
                    {t("wallets.inspector.currency_type")}: <b>{preview?.currency || dst?.currency}</b>
                  </div>
                  <div>
                    {t("wallets.inspector.new_balance")}:{" "}
                    <b>
                      {formatMoney(
                        preview?.newBalance ?? 0,
                        preview?.currency || dst?.currency
                      )}
                    </b>
                  </div>
                  <div>
                    {t("wallets.inspector.total_transactions")}: <b>{preview?.totalTx ?? 0}</b>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setMStep(2)}
                  >
                    ← {t("common.back")}
                  </button>
                  <button
                    className="btn btn-accent"
                    onClick={() => setMStep(4)}
                  >
                    {t("common.continue")} →
                  </button>
                </div>
              </>
            )}

            {mStep === 4 && (
              <>
                <div className="alert alert-warning">
                  <ul className="m-0 ps-3 small">
                    <li>
                      <span dangerouslySetInnerHTML={{ __html: t("wallets.inspector.merge_warning_1") }} />
                    </li>
                    <li>{t("wallets.inspector.merge_warning_2")}</li>
                    {currenciesDiffer && (
                      <li>
                        {t("wallets.inspector.merge_warning_3")}
                      </li>
                    )}
                    <li>{t("wallets.inspector.merge_warning_4")}</li>
                  </ul>
                </div>
                <label className="d-flex gap-2 align-items-start mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input mt-1"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  <span>{t("wallets.inspector.i_agree")}</span>
                </label>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setMStep(3)}
                  >
                    ← {t("common.back")}
                  </button>
                  <button
                    className="btn btn-success"
                    disabled={!agree || !src || !dst || mergeLoading}
                    onClick={async () => {
                      try {
                        setMergeLoading(true);
                        await onMerge?.({
                          mode: mergeMode,
                          baseWallet: wallet,
                          otherWallet: pickedWallet,
                          sourceId: src.id,
                          targetId: dst.id,
                          // nếu khác tiền tệ và chọn SOURCE -> parent phải đổi currency ví đích = currency ví nguồn
                          keepCurrency: currenciesDiffer
                            ? keepCurrency || "TARGET"
                            : "TARGET",
                          preview,
                        });

                        // YÊU CẦU: Sau khi gộp, quay về Chi tiết và KHÔNG chọn ví
                        setTab("details");
                        // Bỏ chọn để parent reload lại toàn bộ state ví
                        onSelectWallet?.(null);

                        // reset state
                        setMStep(1);
                        setKeepCurrency(null);
                        setAgree(false);
                        setOtherId("");
                      } finally {
                        setMergeLoading(false);
                      }
                    }}
                  >
                    {mergeLoading ? t("wallets.inspector.merging") : t("wallets.inspector.merge_confirm")}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== Chuyển đổi cá nhân/nhóm ===== */}
        {wallet && tab === "convert" && (
          <>
            <div className="mb-3">
              {t("wallets.inspector.current_status")}:{" "}
              <strong>{wallet.isShared ? t("wallets.group_wallet") : t("wallets.personal_wallet")}</strong>
            </div>
            <button
              className="btn btn-accent"
              onClick={async () => {
                await onConvert?.(wallet, !wallet.isShared);
                // ép reload chi tiết ví hiện tại
                forceReselect(wallet.id);
                setTab("details");
              }}
            >
              <i className="bi bi-arrow-left-right me-1" />
              {t("wallets.inspector.convert_to")} {!wallet.isShared ? t("wallets.group_wallet") : t("wallets.personal_wallet")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
