import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import "./SuccessModal.css";


const Modal = ({ open, onClose, width = 480, children }) => {
  useEffect(() => {
    if (!open) return;

    // add a dim/blur overlay element right below modals
    const dim = document.createElement("div");
    dim.className = "modal-dim";
    document.body.appendChild(dim);

    return () => {
      // cleanup dim
      if (dim && dim.parentNode) dim.parentNode.removeChild(dim);
    };
  }, [open]);

  if (!open) return null;

  const node = (
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

  return ReactDOM.createPortal(node, document.body);
};

export default Modal;
