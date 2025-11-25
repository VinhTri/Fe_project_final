import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../styles/admin/AdminReviewsPage.css";

import { useFeedbackData } from "../../home/store/FeedbackDataContext";
import { useNotifications } from "../../home/store/NotificationContext";
import { useToast } from "../../components/common/Toast/ToastContext";
import { useLanguage } from "../../home/store/LanguageContext";

function RatingStars({ value }) {
  return (
    <span className="text-warning">
      {Array.from({ length: 5 }).map((_, i) => (
        <i
          key={i}
          className={"bi " + (i < value ? "bi-star-fill" : "bi-star")}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const { t } = useLanguage();
  const { reviews, loading: reviewsLoading, error: reviewsError, addAdminReply } = useFeedbackData();
  const { pushNotification } = useNotifications();
  const { showToast } = useToast();
  const location = useLocation();

  const focusReviewId = location.state?.focusReviewId || null;

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [expandedIds, setExpandedIds] = useState(
    focusReviewId ? [focusReviewId] : []
  );

  const summary = useMemo(() => {
    if (!reviews.length)
      return { avgRating: 0, total: 0, replied: 0, unreplied: 0 };

    const total = reviews.length;
    const avgRating =
      reviews.reduce((s, r) => s + (r.rating || 0), 0) / total;
    const replied = reviews.filter((r) => r.adminReply).length;
    const unreplied = total - replied;

    return {
      avgRating: Number(avgRating.toFixed(1)),
      total,
      replied,
      unreplied,
    };
  }, [reviews]);

  const filtered = useMemo(() => {
    let data = [...reviews];

    if (statusFilter === "unreplied") data = data.filter((r) => !r.adminReply);
    if (statusFilter === "replied") data = data.filter((r) => !!r.adminReply);

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((r) => {
        const user = (r.user || r.userName || "").toLowerCase();
        const email = (r.email || r.userEmail || "").toLowerCase();
        const comment = (r.comment || r.message || r.subject || "").toLowerCase();
        const source = (r.source || "").toLowerCase();
        return (
          user.includes(q) ||
          email.includes(q) ||
          comment.includes(q) ||
          source.includes(q)
        );
      });
    }

    data.sort((a, b) => {
      const ta = new Date(a.createdAt.replace(" ", "T")).getTime();
      const tb = new Date(b.createdAt.replace(" ", "T")).getTime();
      return sortOrder === "desc" ? tb - ta : ta - tb;
    });

    return data;
  }, [reviews, statusFilter, search, sortOrder]);

  const groupedByDate = useMemo(() => {
    const groups = {};
    filtered.forEach((r) => {
      const day = r.createdAt.substring(0, 10);
      if (!groups[day]) groups[day] = [];
      groups[day].push(r);
    });

    const days = Object.keys(groups).sort((a, b) => {
      const ta = new Date(a).getTime();
      const tb = new Date(b).getTime();
      return sortOrder === "desc" ? tb - ta : ta - tb;
    });

    return days.map((d) => ({ day: d, items: groups[d] }));
  }, [filtered, sortOrder]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleChangeDraft = (id, value) => {
    setReplyDrafts((drafts) => ({ ...drafts, [id]: value }));
  };

  const handleSubmitReply = async (id) => {
    const content = (replyDrafts[id] || "").trim();
    if (!content) return;

    try {
      // 1) Gọi API để lưu phản hồi
      await addAdminReply(id, {
        author: "Admin",
        message: content,
      });

      // 2) Gửi notification cho user
      const review = reviews.find((r) => r.id === id || r.feedbackId === id);

      pushNotification({
        role: "user",
        type: "admin_reply",
        reviewId: id,
        title: t("admin.reviews.notification.title"),
        desc: review
          ? (review.comment || review.message || "").length > 60
            ? (review.comment || review.message || "").slice(0, 60) + "..."
            : review.comment || review.message || ""
          : "",
        timeLabel: t("admin.reviews.notification.time"),
      });

      // 3) Xoá draft
      setReplyDrafts((drafts) => {
        const next = { ...drafts };
        delete next[id];
        return next;
      });

      // 4) Thu gọn panel
      setExpandedIds((prev) => prev.filter((x) => x !== id));

      // 5) Toast
      showToast(t("admin.reviews.toast.success"));

      // 6) Scroll tới review
      setTimeout(() => {
        const el = document.getElementById("review-" + id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    } catch (error) {
      console.error("Error submitting admin reply:", error);
      showToast(error.message || "Không thể gửi phản hồi. Vui lòng thử lại.", "error");
    }
  };

  // Map focusReviewId to feedbackId if needed
  useEffect(() => {
    if (focusReviewId && reviews.length > 0) {
      const review = reviews.find((r) => r.id === focusReviewId || r.feedbackId === focusReviewId);
      if (review) {
        const reviewId = review.id || review.feedbackId;
        if (!expandedIds.includes(reviewId)) {
          setExpandedIds((prev) => [...prev, reviewId]);
        }
      }
    }
  }, [focusReviewId, reviews, expandedIds]);

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <div className="dashboard-page__header-box">
        <div className="dashboard-page__header">
          <div>
            <h2 className="dashboard-page__title">
              {t("admin.reviews.title")}
            </h2>
            <p className="feedback-summary-subtitle">
              {t("admin.reviews.subtitle")}
            </p>
          </div>

          <div className="d-flex flex-column align-items-end">
            <div className="fw-semibold">
              {t("admin.reviews.average")}{" "}
              <span className="text-warning">
                {summary.avgRating} / 5 <i className="bi bi-star-fill" />
              </span>
            </div>
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              {t("admin.reviews.total")} {summary.total}
            </div>
            <div className="text-muted" style={{ fontSize: "0.8rem" }}>
              {t("admin.reviews.replied")} {summary.replied} • {t("admin.reviews.unreplied")} {summary.unreplied}
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <div className="btn-group">
          <button
            className={
              "btn btn-sm " +
              (statusFilter === "all" ? "btn-primary" : "btn-outline-secondary")
            }
            onClick={() => setStatusFilter("all")}
          >
            {t("admin.reviews.filter.all")}
          </button>
          <button
            className={
              "btn btn-sm " +
              (statusFilter === "unreplied"
                ? "btn-primary"
                : "btn-outline-secondary")
            }
            onClick={() => setStatusFilter("unreplied")}
          >
            {t("admin.reviews.filter.unreplied")}
          </button>
          <button
            className={
              "btn btn-sm " +
              (statusFilter === "replied"
                ? "btn-primary"
                : "btn-outline-secondary")
            }
            onClick={() => setStatusFilter("replied")}
          >
            {t("admin.reviews.filter.replied")}
          </button>
        </div>

        <div className="btn-group btn-group-sm ms-2">
          <button
            className={
              "btn " +
              (sortOrder === "desc"
                ? "btn-outline-primary"
                : "btn-outline-secondary")
            }
            onClick={() => setSortOrder("desc")}
          >
            {t("admin.reviews.sort.newest")}
          </button>
          <button
            className={
              "btn " +
              (sortOrder === "asc"
                ? "btn-outline-primary"
                : "btn-outline-secondary")
            }
            onClick={() => setSortOrder("asc")}
          >
            {t("admin.reviews.sort.oldest")}
          </button>
        </div>

        <div className="ms-auto" style={{ minWidth: 260 }}>
          <div className="input-group input-group-sm">
            <span className="input-group-text">
              <i className="bi bi-search" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder={t("admin.reviews.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="card">
        <div className="card-body p-0">
          {groupedByDate.length === 0 ? (
            <div className="p-3 text-center text-muted">
              {t("admin.reviews.empty")}
            </div>
          ) : (
            groupedByDate.map((group) => (
              <div key={group.day} className="border-bottom">
                <div className="px-3 py-2 bg-light border-bottom">
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#6b7280",
                    }}
                  >
                    {t("admin.reviews.date_prefix")} {group.day}
                  </span>
                </div>

                {group.items.map((r) => {
                  const reviewId = r.id || r.feedbackId;
                  const expanded = expandedIds.includes(reviewId);
                  const unreplied = !r.adminReply;

                  return (
                    <div
                      key={reviewId}
                      id={"review-" + reviewId}
                      className="list-group-item border-0 border-bottom d-flex flex-column gap-2"
                    >
                      <div className="d-flex flex-column flex-md-row align-items-md-center gap-2">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            {r.rating && <RatingStars value={r.rating} />}
                            <span className="fw-semibold">
                              {r.user || r.userName || "Người dùng"}{" "}
                              <span
                                className="text-muted"
                                style={{ fontSize: "0.85rem" }}
                              >
                                ({r.email || r.userEmail || ""})
                              </span>
                            </span>
                          </div>

                          <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                            {(() => {
                              const comment = r.comment || r.message || r.subject || "";
                              return expanded
                                ? comment
                                : comment.length > 80
                                ? comment.slice(0, 80) + "..."
                                : comment;
                            })()}
                          </div>
                        </div>

                        <div className="d-flex flex-column align-items-md-end">
                          <span
                            className={
                              "badge mb-1 " +
                              (unreplied
                                ? "bg-danger-subtle text-danger"
                                : "bg-success-subtle text-success")
                            }
                          >
                            {unreplied ? t("admin.reviews.filter.unreplied") : t("admin.reviews.filter.replied")}
                          </span>

                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => toggleExpand(reviewId)}
                          >
                            {expanded ? t("admin.reviews.btn.collapse") : t("admin.reviews.btn.view_details")}
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="mt-2">
                          <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                            {t("admin.reviews.time")} {r.createdAt} • {t("admin.reviews.source")} {r.source}
                          </div>

                          {r.adminReply && (
                            <div className="mt-2 p-2 rounded bg-light border">
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "#2563eb",
                                }}
                              >
                                {t("admin.reviews.reply_from")} {r.adminReply.author}
                              </div>
                              <div style={{ fontSize: "0.85rem", marginTop: 2 }}>
                                {r.adminReply.message}
                              </div>
                              <div
                                className="text-muted mt-1"
                                style={{ fontSize: "0.75rem" }}
                              >
                                {t("admin.reviews.reply_time")} {r.adminReply.date}
                              </div>
                            </div>
                          )}

                          {!r.adminReply && (
                            <div className="mt-3">
                              <label
                                className="form-label"
                                style={{ fontSize: "0.85rem" }}
                              >
                                {t("admin.reviews.reply_label")}
                              </label>
                              <textarea
                                rows={3}
                                className="form-control form-control-sm"
                                value={replyDrafts[reviewId] || ""}
                                onChange={(e) =>
                                  handleChangeDraft(reviewId, e.target.value)
                                }
                                placeholder={t("admin.reviews.reply_placeholder")}
                              />
                              <div className="d-flex justify-content-end gap-2 mt-2">
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => handleChangeDraft(reviewId, "")}
                                >
                                  {t("admin.reviews.btn.clear")}
                                </button>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleSubmitReply(reviewId)}
                                >
                                  {t("admin.reviews.btn.send")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
