// src/components/funds/ReminderBlock.jsx
import React, { useState } from "react";
import { useLanguage } from "../../home/store/LanguageContext";

export default function ReminderBlock({ reminderOn, setReminderOn, freq = "day" }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState("follow"); // follow | custom
  const [customType, setCustomType] = useState("day");

  const [followTime, setFollowTime] = useState("");
  const [followWeekDay, setFollowWeekDay] = useState("mon");
  const [followMonthDay, setFollowMonthDay] = useState(1);

  const [customTime, setCustomTime] = useState("");
  const [customWeekDay, setCustomWeekDay] = useState("mon");
  const [customMonthDay, setCustomMonthDay] = useState(1);

  const freqLabel =
    {
      day: t("funds.form.freq_day"),
      week: t("funds.form.freq_week"),
      month: t("funds.form.freq_month"),
      year: t("funds.form.freq_year"),
    }[freq] || t("funds.form.freq_day");

  const weekOptions = [
    { value: "mon", label: t("funds.form.week_mon") },
    { value: "tue", label: t("funds.form.week_tue") },
    { value: "wed", label: t("funds.form.week_wed") },
    { value: "thu", label: t("funds.form.week_thu") },
    { value: "fri", label: t("funds.form.week_fri") },
    { value: "sat", label: t("funds.form.week_sat") },
    { value: "sun", label: t("funds.form.week_sun") },
  ];

  const renderFollowContent = () => {
    if (freq === "day") {
      return (
        <div className="funds-field">
          <label>{t("funds.form.reminder_time_day")}</label>
          <input
            type="time"
            value={followTime}
            onChange={(e) => setFollowTime(e.target.value)}
          />
          <div className="funds-hint">
            {t("funds.form.reminder_hint_day")}
          </div>
        </div>
      );
    }

    if (freq === "week") {
      return (
        <div className="funds-field funds-field--inline">
          <div>
            <label>{t("funds.form.reminder_day_week")}</label>
            <select
              value={followWeekDay}
              onChange={(e) => setFollowWeekDay(e.target.value)}
            >
              {weekOptions.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>{t("funds.form.reminder_time_day")}</label>
            <input
              type="time"
              value={followTime}
              onChange={(e) => setFollowTime(e.target.value)}
            />
          </div>
          <div className="funds-hint">
            {t("funds.form.reminder_hint_week")}
          </div>
        </div>
      );
    }

    return (
      <div className="funds-field funds-field--inline">
        <div>
          <label>{t("funds.form.reminder_day_month")}</label>
          <input
            type="number"
            min={1}
            max={31}
            value={followMonthDay}
            onChange={(e) =>
              setFollowMonthDay(
                Math.max(1, Math.min(31, Number(e.target.value) || 1))
              )
            }
          />
        </div>
        <div>
          <label>{t("funds.form.reminder_time_day")}</label>
          <input
            type="time"
            value={followTime}
            onChange={(e) => setFollowTime(e.target.value)}
          />
        </div>
        <div className="funds-hint">
          {t("funds.form.reminder_hint_month")}
        </div>
      </div>
    );
  };

  const renderCustomContent = () => {
    if (customType === "day") {
      return (
        <div className="funds-field">
          <label>{t("funds.form.reminder_time_custom_day")}</label>
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
          />
          <div className="funds-hint">
            {t("funds.form.reminder_hint_custom_day")}
          </div>
        </div>
      );
    }

    if (customType === "week") {
      return (
        <div className="funds-field funds-field--inline">
          <div>
            <label>{t("funds.form.reminder_day_week")}</label>
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
            <label>{t("funds.form.reminder_time_day")}</label>
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
            />
          </div>
          <div className="funds-hint">
            {t("funds.form.reminder_hint_custom_week")}
          </div>
        </div>
      );
    }

    return (
      <div className="funds-field funds-field--inline">
        <div>
          <label>{t("funds.form.reminder_day_month")}</label>
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
          <label>{t("funds.form.reminder_time_day")}</label>
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
          />
        </div>
        <div className="funds-hint">
          {t("funds.form.reminder_hint_custom_month")}
        </div>
      </div>
    );
  };

  return (
    <div className="funds-fieldset">
      <div className="funds-fieldset__legend">{t("funds.form.reminder_legend")}</div>

      <div className="funds-toggle-line">
        <span>{t("funds.form.reminder_toggle")}</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={reminderOn}
            onChange={(e) => setReminderOn(e.target.checked)}
          />
          <span className="switch__slider" />
        </label>
      </div>

      {!reminderOn && (
        <div className="funds-hint">
          {t("funds.form.reminder_off_hint")}
        </div>
      )}

      {reminderOn && (
        <>
          <div className="funds-reminder-mode">
            <button
              type="button"
              className={
                "funds-pill-toggle" +
                (mode === "follow" ? " funds-pill-toggle--active" : "")
              }
              onClick={() => setMode("follow")}
            >
              {t("funds.form.reminder_mode_follow").replace("{freq}", freqLabel)}
            </button>
            <button
              type="button"
              className={
                "funds-pill-toggle" +
                (mode === "custom" ? " funds-pill-toggle--active" : "")
              }
              onClick={() => setMode("custom")}
            >
              {t("funds.form.reminder_mode_custom")}
            </button>
          </div>

          {mode === "follow" && (
            <>
              <div className="funds-hint" dangerouslySetInnerHTML={{ __html: t("funds.form.reminder_follow_hint") }} />
              {renderFollowContent()}
            </>
          )}

          {mode === "custom" && (
            <>
              <div className="funds-field">
                <label>{t("funds.form.reminder_type_label")}</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                >
                  <option value="day">{t("funds.form.reminder_type_day")}</option>
                  <option value="week">{t("funds.form.reminder_type_week")}</option>
                  <option value="month">{t("funds.form.reminder_type_month")}</option>
                </select>
                <div className="funds-hint">
                  {t("funds.form.reminder_custom_hint")}
                </div>
              </div>

              {renderCustomContent()}
            </>
          )}
        </>
      )}
    </div>
  );
}
