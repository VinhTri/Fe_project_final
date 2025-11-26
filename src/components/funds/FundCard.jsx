// src/components/funds/FundCard.jsx
import React from "react";

/**
 * Format số tiền - giống formatMoney trong WalletsPage và TransactionsPage
 */
function formatMoney(amount = 0, currency = "VND") {
  const numAmount = Number(amount) || 0;
  if (currency === "USD") {
    if (Math.abs(numAmount) < 0.01 && numAmount !== 0) {
      const formatted = numAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      });
      return `$${formatted}`;
    }
    const formatted =
      numAmount % 1 === 0
        ? numAmount.toLocaleString("en-US")
        : numAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
          });
    return `$${formatted}`;
  }
  if (currency === "VND") {
    return `${numAmount.toLocaleString("vi-VN")} VND`;
  }
  if (Math.abs(numAmount) < 0.01 && numAmount !== 0) {
    return `${numAmount.toLocaleString("vi-VN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })} ${currency}`;
  }
  return `${numAmount.toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })} ${currency}`;
}

export default function FundCard({ fund, onClick }) {
  const { name, current, target, currency } = fund;
  const pct = target ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className="fund-card" onClick={onClick}>
      <div className="fund-card__top">
        <div className="fund-card__title">{name}</div>
        <div className="fund-card__amount">
          {formatMoney(current, currency)}
          {target && (
            <span className="fund-card__target">
              {" "}
              / {formatMoney(target, currency)}
            </span>
          )}
        </div>
      </div>
      {target && (
        <div className="fund-card__progress">
          <div className="fund-card__progress-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
          <div className="fund-card__progress-text">{pct}% hoàn thành</div>
        </div>
      )}
    </div>
  );
}
