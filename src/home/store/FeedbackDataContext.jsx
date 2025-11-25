// src/home/store/FeedbackDataContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAllFeedbacks, addAdminResponse as addAdminResponseAPI } from "../../services/admin-feedback.service";
import { useAuth } from "./AuthContext";

const FeedbackContext = createContext(null);

// Map API feedback to frontend review format
const mapFeedbackToReview = (apiFeedback) => {
  // Format createdAt from ISO to "YYYY-MM-DD HH:mm"
  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
      const yyyy = date.getFullYear();
      const MM = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const mm = pad(date.getMinutes());
      return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
    } catch {
      return isoString;
    }
  };

  // Map feedback type to source label
  const typeToSource = {
    FEEDBACK: "Feedback trong app",
    BUG: "Báo lỗi",
    FEATURE: "Đề xuất tính năng",
    OTHER: "Khác",
  };

  // Map adminResponse to adminReply format
  const adminReply = apiFeedback.adminResponse
    ? {
        author: "Admin",
        message: apiFeedback.adminResponse,
        date: formatDateTime(apiFeedback.reviewedAt || apiFeedback.updatedAt),
      }
    : null;

  return {
    id: apiFeedback.feedbackId,
    feedbackId: apiFeedback.feedbackId,
    user: apiFeedback.userName || apiFeedback.userEmail || "Người dùng",
    email: apiFeedback.userEmail || "",
    rating: null, // API không có rating, có thể tính từ type hoặc để null
    comment: apiFeedback.message || apiFeedback.subject || "",
    createdAt: formatDateTime(apiFeedback.createdAt),
    source: typeToSource[apiFeedback.type] || apiFeedback.type || "Feedback trong app",
    adminReply: adminReply,
    status: apiFeedback.status || "PENDING",
    type: apiFeedback.type,
    subject: apiFeedback.subject,
  };
};

export function FeedbackProvider({ children }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "ROLE_ADMIN";
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load feedbacks from API (only for admin)
  const loadFeedbacks = useCallback(async () => {
    if (!isAdmin) {
      setReviews([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const { response, data } = await getAllFeedbacks();
      
      if (response?.ok && data?.feedbacks) {
        const mapped = data.feedbacks.map(mapFeedbackToReview);
        setReviews(mapped);
      } else {
        console.error("Failed to load feedbacks:", data?.error);
        setReviews([]);
        if (data?.error) {
          setError(data.error);
        }
      }
    } catch (err) {
      console.error("Error loading feedbacks:", err);
      setReviews([]);
      setError("Không thể tải danh sách phản hồi.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Load feedbacks when component mounts or user changes
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && isAdmin) {
      loadFeedbacks();
    } else {
      setReviews([]);
      setLoading(false);
    }
  }, [loadFeedbacks, isAdmin]);

  // user gửi đánh giá mới (deprecated - use FeedbackPage API instead)
  const addReview = (payload) => {
    const now = new Date();
    const createdAt = now.toISOString().slice(0, 16).replace("T", " ");

    const newReview = {
      id: Date.now(),
      user: payload.user,
      email: payload.email || "user@example.com",
      rating: payload.rating,
      comment: payload.comment,
      createdAt,
      source: "Feedback trong app",
      adminReply: null,
    };

    setReviews((prev) => [newReview, ...prev]);
    return newReview;
  };

  // admin phản hồi - gọi API
  const addAdminReply = useCallback(async (reviewId, { author = "Admin", message, date }) => {
    try {
      const { response, data } = await addAdminResponseAPI(reviewId, message);
      
      if (response?.ok && data?.feedback) {
        // Update local state với feedback mới từ API
        const updatedReview = mapFeedbackToReview(data.feedback);
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId || r.feedbackId === reviewId ? updatedReview : r))
        );
        return updatedReview;
      } else {
        throw new Error(data?.error || "Thêm phản hồi thất bại");
      }
    } catch (err) {
      console.error("Error adding admin reply:", err);
      throw err;
    }
  }, []);

  return (
    <FeedbackContext.Provider value={{ 
      reviews, 
      loading, 
      error,
      addReview, 
      addAdminReply,
      reloadFeedbacks: loadFeedbacks,
    }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export const useFeedbackData = () => useContext(FeedbackContext);
