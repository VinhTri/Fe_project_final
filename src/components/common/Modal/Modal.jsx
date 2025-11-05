import React from "react";
import "./SuccessModal.css";

const Modal = ({ open, onClose, width = 480, children }) => {
  if (!open) return null;

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div
        className="modal__wrapper"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
