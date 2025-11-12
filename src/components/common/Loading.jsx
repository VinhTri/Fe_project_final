import React from "react";

export default function Loading({ message = "Đang tải..." }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        minHeight: 300,
      }}
    >
      <div className="spinner-border text-primary" role="status" style={{ width: 48, height: 48 }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 text-muted">{message}</p>
    </div>
  );
}

// Inline loading (nhỏ hơn)
export function InlineLoading({ message = "Đang tải..." }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}>
      <div className="spinner-border spinner-border-sm text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <span className="text-muted">{message}</span>
    </div>
  );
}

// Overlay loading (toàn màn hình)
export function OverlayLoading({ message = "Đang xử lý..." }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 32,
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        <div className="spinner-border text-primary" role="status" style={{ width: 48, height: 48 }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 mb-0">{message}</p>
      </div>
    </div>
  );
}

