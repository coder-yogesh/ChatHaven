import React, { useRef, useState } from "react";
import { PlusOutlined, AudioOutlined, ArrowUpOutlined, CloseOutlined } from "@ant-design/icons";
import ImageModal from "./ImageModal";

/**
 * ChatGPT-style input bar:
 * - "+" button opens a native file picker for image attachment
 * - attached image shows as a thumbnail card (with an X to remove) above the input
 * - dark pill-shaped textarea with a mic icon and a round send button
 *
 * Props:
 *  value, onChange(text)        - the text input
 *  onSend()                     - called on send click / Enter
 *  imageFile, onImageSelect(file), onImageRemove()
 *  loading                      - disables send while a request is in flight
 */
export default function ChatInput({
  value,
  onChange,
  onSend,
  imageFile,
  onImageSelect,
  onImageRemove,
  loading,
}) {
  const fileInputRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onImageSelect(file);
    e.target.value = ""; // allow re-selecting the same file later
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-input-wrap">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="chat-input-bar">
        {previewUrl && (
          <div className="image-preview-row">
            <div className="image-preview-card">
              <img
                src={previewUrl}
                alt="attachment preview"
                onClick={() => setPreviewOpen(true)}
                style={{ cursor: "zoom-in" }}
              />
              <button className="image-preview-close" onClick={onImageRemove} title="Remove image">
                <CloseOutlined />
              </button>
            </div>
          </div>
        )}

        <div className="chat-input-row">
          <button
            className="chat-icon-btn"
            title="Attach image"
            onClick={() => fileInputRef.current?.click()}
          >
            <PlusOutlined />
          </button>

          <textarea
            className="chat-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            rows={1}
          />

          <button className="chat-icon-btn" title="Voice input">
            <AudioOutlined />
          </button>

          <button
            className="chat-send-btn"
            onClick={onSend}
            disabled={loading || (!value.trim() && !imageFile)}
            title="Send"
          >
            <ArrowUpOutlined />
          </button>
        </div>
      </div>

      <ImageModal src={previewOpen ? previewUrl : null} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}