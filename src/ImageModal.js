import React, { useEffect } from "react";
import { CloseOutlined } from "@ant-design/icons";

/**
 * Full-screen image lightbox. Closes on backdrop click, the X button, or Esc.
 * Props:
 *  src   - image url to show full-size (null/undefined = hidden)
 *  onClose()
 */
export default function ImageModal({ src, onClose }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div className="image-modal-backdrop" onClick={onClose}>
      <button className="image-modal-close" onClick={onClose} title="Close">
        <CloseOutlined />
      </button>
      <img
        src={src}
        alt="Full size preview"
        className="image-modal-img"
        onClick={(e) => e.stopPropagation()} // clicking the image itself shouldn't close it
      />
    </div>
  );
}