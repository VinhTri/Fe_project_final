// src/components/funds/AutoTopupBlock.jsx
import React, { useEffect, useState } from "react";
import { useLanguage } from "../../home/store/LanguageContext";

export default function AutoTopupBlock({
  autoTopupOn,
  setAutoTopupOn,
  dependsOnReminder,
  reminderFreq = "day",
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState(dependsOnReminder ? "follow" : "custom");
  const [customType, setCustomType] = useState("day");

  const [customTime, setCustomTime] = useState("");
  const [customWeekDay, setCustomWeekDay] = useState("mon");
  const [customMonthDay, setCustomMonthDay] = useState(1);
  const [customAmount, setCustomAmount] = useState("");

  const canFollowReminder = dependsOnReminder;

  const freqLabel =
    {
      day: t("funds.form.freq_day"),
      week: t("funds.form.freq_week"),
      month: t("funds.form.freq_month"),
      year: t("funds.form.freq_year"),
    }[reminderFreq] || t("funds.form.freq_day");

  const weekOptions = [
    { value: "mon", label: t("funds.form.week_mon") },
    { value: "tue", label: t("funds.form.week_tue") },
    { value: "wed", label: t("funds.form.week_wed") },
    { value: "thu", label: t("funds.form.week_thu") },
    { value: "fri", label: t("funds.form.week_fri") },
    { value: "sat", label: t("funds.form.week_sat") },
    { value: "sun", label: t("funds.form.week_sun") },
  ];

  useEffect(() => {
    if (!canFollowReminder && mode === "follow") {
      setMode("custom");
    }
  }, [canFollowReminder, mode]);

  const renderCustomContent = () => {
    if (customType === "day") {
      return (
        <div className="funds-field">
          <label>{t("funds.form.auto_topup_time_day")}</label>
          <div className="funds-field--inline">
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
            />
            <input
              type="number"
              min={0}
              placeholder={t("funds.form.auto_topup_amount_day")}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
          </div>
          <div className="funds-hint">
            {t("funds.form.auto_topup_hint_day")}
          </div>
        </div>
      );
    }

    if (customType === "week") {
      return (
        <div className="funds-field">
          <label>{t("funds.form.auto_topup_time_week")}</label>
          <div className="funds-field--inline">
            <div>
              <select
                value={customWeekDay}
                onChange={(e) => setCustomWeekDay(e.target.value)}
              >
                {weekOptions.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
              />
            </div>
          </div>
          <div className="funds-field">
            <input
              type="number"
              min={0}
              placeholder={t("funds.form.auto_topup_amount_week")}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
          </div>
          <div className="funds-hint">
            {t("funds.form.auto_topup_hint_week")}
          </div>
        </div>
      );
    }

    return (
      <div className="funds-field">
        <label>{t("funds.form.auto_topup_time_month")}</label>
        <div className="funds-field--inline">
          <div>
            <input
              type="number"
              min={1}
              max={31}
              value={customMonthDay}
              onChange={(e) =>
                setCustomMonthDay(
                  Math.max(1, Math.min(31, Number(e.target.value) || 1))
                )
              }
            />
          </div>
          <div>
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
            />
          </div>
        </div>
        <div className="funds-field">
          <input
            type="number"
            min={0}
            placeholder={t("funds.form.auto_topup_amount_month")}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />
        </div>
        <div className="funds-hint">
          {t("funds.form.auto_topup_hint_month")}
        </div>
      </div>
    );
  };

  return (
    <div className="funds-fieldset">
      <div className="funds-fieldset__legend">{t("funds.form.auto_topup_legend")}</div>

      <div className="funds-toggle-line">
        <span>{t("funds.form.auto_topup_toggle")}</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={autoTopupOn}
            onChange={(e) => setAutoTopupOn(e.target.checked)}
          />
          <span className="switch__slider" />
        </label>
      </div>

      {!autoTopupOn && (
        <div className="funds-hint">
          {t("funds.form.auto_topup_off_hint")}
        </div>
      )}

      {autoTopupOn && (
        <>
          <div className="funds-reminder-mode">
            <button
              type="button"
              className={
                "funds-pill-toggle" +
                (mode === "follow" ? " funds-pill-toggle--active" : "")
              }
              onClick={() => canFollowReminder && setMode("follow")}
              disabled={!canFollowReminder}
            >
              {t("funds.form.auto_topup_mode_follow")}
            </button>
            <button
              type="button"
              className={
                "funds-pill-toggle" +
                (mode === "custom" ? " funds-pill-toggle--active" : "")
              }
              onClick={() => setMode("custom")}
            >
              {t("funds.form.auto_topup_mode_custom")}
            </button>
          </div>

          {!canFollowReminder && (
            <div className="funds-hint" dangerouslySetInnerHTML={{ __html: t("funds.form.auto_topup_no_reminder_hint") }} />
          )}

          {mode === "follow" && canFollowReminder && (
            <div className="funds-field">
              <label>{t("funds.form.auto_topup_mode_follow_label")}</label>
              <div className="funds-hint" dangerouslySetInnerHTML={{ __html: t("funds.form.auto_topup_mode_follow_hint").replace("{freq}", freqLabel) }} />
            </div>
          )}

          {mode === "custom" && (
            <>
              <div className="funds-field">
                <label>{t("funds.form.auto_topup_type_label")}</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                >
                  <option value="day">{t("funds.form.auto_topup_type_day")}</option>
                  <option value="week">{t("funds.form.auto_topup_type_week")}</option>
                  <option value="month">{t("funds.form.auto_topup_type_month")}</option>
                </select>
                <div className="funds-hint" dangerouslySetInnerHTML={{ __html: t("funds.form.auto_topup_custom_hint") }} />
              </div>

              {renderCustomContent()}
            </>
          )}
        </>
      )}
    </div>
  );
}
