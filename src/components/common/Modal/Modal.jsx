import React from "react";
import { createPortal } from "react-dom";
import "./SuccessModal.css";

const Modal = ({ open, onClose, width = 480, children }) => {
  if (!open) return null;

  const resolvedWidth = typeof width === "number" ? `${width}px` : width;

  const modalContent = (
    <div className="modal__backdrop" onClick={onClose}>
      <div
        className="modal__wrapper"
        style={{
          width: resolvedWidth,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default Modal;
