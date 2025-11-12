import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8f9fa",
          }}
        >
          <div
            style={{
              maxWidth: 600,
              background: "#fff",
              borderRadius: 12,
              padding: 32,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ marginBottom: 16, color: "#dc3545" }}>
              Đã xảy ra lỗi
            </h2>
            <p style={{ color: "#6c757d", marginBottom: 24 }}>
              Hệ thống gặp sự cố. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu lỗi vẫn tiếp tục.
            </p>
            
            {process.env.NODE_ENV === "development" && (
              <details style={{ textAlign: "left", marginBottom: 24 }}>
                <summary style={{ cursor: "pointer", color: "#007bff", marginBottom: 8 }}>
                  Chi tiết lỗi (Development only)
                </summary>
                <pre
                  style={{
                    background: "#f1f3f5",
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 12,
                    overflow: "auto",
                    color: "#dc3545",
                  }}
                >
                  {this.state.error && this.state.error.toString()}
                  {"\n"}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Tải lại trang
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => (window.location.href = "/home")}
              >
                <i className="bi bi-house me-2"></i>
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

