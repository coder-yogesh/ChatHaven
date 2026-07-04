import React, { useState } from "react";
import { Layout, Input } from "antd";
import {
  OpenAIOutlined,
  UserOutlined,
  CopyOutlined,
  CheckOutlined,
  EditOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import MessageActions from "./MessageActions";
import ImageModal from "./ImageModal";
import { copyToClipboard } from "./messageUtils";

const { Content } = Layout;
const { TextArea } = Input;

function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copyToClipboard(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-lang">{language || "text"}</span>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? <CheckOutlined /> : <CopyOutlined />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "javascript"}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: "0 0 8px 8px", fontSize: 13 }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

function UserBubble({ message, imageUrl, onSave, onImageClick }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const save = () => {
    if (draft.trim() && draft !== message) onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bubble user-bubble editing">
        <TextArea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 8 }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") {
              setDraft(message);
              setEditing(false);
            }
          }}
        />
        <div className="edit-actions">
          <button className="msg-action-btn" onClick={() => { setDraft(message); setEditing(false); }}>
            <CloseOutlined /> Cancel
          </button>
          <button className="msg-action-btn primary" onClick={save}>
            <CheckOutlined /> Save & send
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-message-wrap">
      {imageUrl && (
        <div className="user-image-attachment" onClick={() => onImageClick?.(imageUrl)}>
          <img src={imageUrl} alt="attached" />
        </div>
      )}
      {message && <div className="bubble user-bubble">{message}</div>}
      <div className="msg-actions user-actions">
        <button className="msg-action-btn" title="Edit" onClick={() => setEditing(true)}>
          <EditOutlined />
        </button>
        <button className="msg-action-btn" title="Copy" onClick={handleCopy}>
          {copied ? <CheckOutlined /> : <CopyOutlined />}
        </button>
      </div>
    </div>
  );
}

export default function ChatMessages({ messages, loading, onEditMessage, onRegenerate }) {
  const [modalImage, setModalImage] = useState(null);

  return (
    <Content style={{ padding: 16, overflowY: "auto" }} className="chat-body" id="chat-container">
      <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
      {messages.map((msg, i) => {
        const isBot = msg.type === "gpt";
        const messageId = msg.id ?? `msg-${i}`;

        if (!isBot) {
          return (
            <div key={messageId} className="message-row user">
              <UserBubble
                message={msg.message}
                imageUrl={msg.imageUrl}
                onSave={(newText) => onEditMessage && onEditMessage(i, newText)}
                onImageClick={setModalImage}
              />
              <div className="avatar user-avatar">
                <UserOutlined />
              </div>
            </div>
          );
        }

        return (
          <div key={messageId} className="message-row bot">
            <div className="avatar bot-avatar">
              <OpenAIOutlined />
            </div>
            <div className="bot-message-wrap">
              <div className="bubble bot-bubble">
                <ReactMarkdown
                  components={{
                    code({ inline, className, children }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const value = String(children).replace(/\n$/, "");
                      return inline ? (
                        <code className="inline-code">{value}</code>
                      ) : (""
                        // <CodeBlock language={match?.[1]} value={value} />
                      );
                    },
                    img({ src, alt }) {
                      return (
                        <img
                          src={src}
                          alt={alt}
                          onClick={() => setModalImage(src)}
                        />
                      );
                    },
                  }}
                >
                  {msg.message}
                </ReactMarkdown>
              </div>
              <MessageActions
                messageId={messageId}
                rawMessage={msg.message}
                onRegenerate={onRegenerate ? () => onRegenerate(i) : undefined}
              />
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="message-row bot">
          <div className="avatar bot-avatar">
            <OpenAIOutlined />
          </div>
          <div className="bubble bot-bubble typing-bubble">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      )}
    </Content>
  );
}