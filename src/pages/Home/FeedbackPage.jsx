import React, { useState, useEffect } from "react";
import { createFeedback, getUserFeedbacks } from "../../services/feedback.service";
import Toast from "../../components/common/Toast/Toast";
import "../../styles/home/FeedbackPage.css";

const FEEDBACK_TYPES = {
  FEEDBACK: "FEEDBACK",
  BUG: "BUG",
  FEATURE: "FEATURE",
  OTHER: "OTHER",
};

const FEEDBACK_TYPE_LABELS = {
  FEEDBACK: "Phản hồi chung",
  BUG: "Báo lỗi",
  FEATURE: "Đề xuất tính năng",
  OTHER: "Khác",
};

const FEEDBACK_STATUS_LABELS = {
  PENDING: "Đang chờ",
  REVIEWED: "Đã xem",
  RESOLVED: "Đã xử lý",
  CLOSED: "Đã đóng",
};

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState("FEEDBACK");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setLoadingFeedbacks(true);
      const { response, data } = await getUserFeedbacks();
      if (response.ok && data.feedbacks) {
        setMyFeedbacks(data.feedbacks || []);
      }
    } catch (error) {
      console.error("Error loading feedbacks:", error);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject.trim()) {
      setToast({ open: true, message: "Vui lòng nhập tiêu đề", type: "error" });
      return;
    }

    if (!message.trim()) {
      setToast({ open: true, message: "Vui lòng nhập nội dung phản hồi", type: "error" });
      return;
    }

    if (subject.length > 200) {
      setToast({ open: true, message: "Tiêu đề không được vượt quá 200 ký tự", type: "error" });
      return;
    }

    if (message.length > 5000) {
      setToast({ open: true, message: "Nội dung không được vượt quá 5000 ký tự", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const { response, data } = await createFeedback({
        type: feedbackType,
        subject: subject.trim(),
        message: message.trim(),
        contactEmail: contactEmail.trim() || null,
      });

      if (response.ok && data.message) {
        setToast({ open: true, message: data.message || "Gửi phản hồi thành công!", type: "success" });
        // Reset form
        setSubject("");
        setMessage("");
        setContactEmail("");
        setFeedbackType("FEEDBACK");
        // Reload feedbacks
        await loadFeedbacks();
      } else {
        setToast({ open: true, message: data.error || "Gửi phản hồi thất bại", type: "error" });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setToast({ open: true, message: "Lỗi kết nối khi gửi phản hồi", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="feedback-page container py-4">
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h2 className="mb-3">
            <i className="bi bi-chat-left-text me-2" />
            Đánh giá ứng dụng
          </h2>
          <p className="text-muted mb-4">Góp ý của bạn giúp MyWallet tốt hơn mỗi ngày.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Loại phản hồi</label>
              <select
                className="form-select"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                required
              >
                {Object.entries(FEEDBACK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Tiêu đề <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập tiêu đề phản hồi (tối đa 200 ký tự)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                required
              />
              <small className="text-muted">{subject.length}/200 ký tự</small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Nội dung <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                rows="6"
                placeholder="Mô tả chi tiết phản hồi của bạn (tối đa 5000 ký tự)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={5000}
                required
              />
              <small className="text-muted">{message.length}/5000 ký tự</small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Email liên hệ (tùy chọn)</label>
              <input
                type="email"
                className="form-control"
                placeholder="Email để chúng tôi liên hệ lại (nếu khác email đăng nhập)"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2" />
                    Gửi phản hồi
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowHistory(!showHistory)}
              >
                <i className="bi bi-clock-history me-2" />
                {showHistory ? "Ẩn lịch sử" : "Xem lịch sử"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showHistory && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <h5 className="mb-3">Lịch sử phản hồi của tôi</h5>
            {loadingFeedbacks ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 text-muted">Đang tải...</p>
              </div>
            ) : myFeedbacks.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-2" />
                <p>Bạn chưa gửi phản hồi nào</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Loại</th>
                      <th>Tiêu đề</th>
                      <th>Trạng thái</th>
                      <th>Ngày gửi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myFeedbacks.map((feedback) => (
                      <tr key={feedback.feedbackId}>
                        <td>
                          <span className="badge bg-secondary">
                            {FEEDBACK_TYPE_LABELS[feedback.type] || feedback.type}
                          </span>
                        </td>
                        <td>{feedback.subject}</td>
                        <td>
                          <span
                            className={`badge ${
                              feedback.status === "RESOLVED"
                                ? "bg-success"
                                : feedback.status === "REVIEWED"
                                  ? "bg-info"
                                  : feedback.status === "CLOSED"
                                    ? "bg-secondary"
                                    : "bg-warning"
                            }`}
                          >
                            {FEEDBACK_STATUS_LABELS[feedback.status] || feedback.status}
                          </span>
                        </td>
                        <td>{formatDate(feedback.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
