import React, { useState, useMemo } from "react";
import { Layout, Input } from "antd";
import {
  OpenAIOutlined,
  CopyOutlined,
  CheckOutlined,
  EditOutlined,
  CloseOutlined,
  FileTextOutlined,
  FolderOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import MessageActions from "./MessageActions";
import ImageModal from "./ImageModal";
import {
  copyToClipboard,
  annotateCodeBlockFilenames,
  extractCodeFiles,
  formatCodebase,
} from "./messageUtils";

const { Content } = Layout;
const { TextArea } = Input;

// Capitalizes a language tag for display, e.g. "javascript" -> "JavaScript",
// "js" -> "Js". Falls back to "Text" when no language was detected.
function formatLangLabel(language) {
  if (!language) return "Text";
  const known = { js: "JavaScript", jsx: "JSX", ts: "TypeScript", tsx: "TSX", py: "Python", sh: "Shell", bash: "Bash", json: "JSON", html: "HTML", css: "CSS" };
  const lower = language.toLowerCase();
  if (known[lower]) return known[lower];
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function CodeBlock({ language, filename, value }) {
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
        {filename ? (
          <span className="code-filename">
            <FileTextOutlined />
            {filename}
          </span>
        ) : (
          <span className="code-lang">
            <CodeOutlined />
            {formatLangLabel(language)}
          </span>
        )}
        <button className="copy-icon-btn" onClick={handleCopy} title={copied ? "Copied" : "Copy code"}>
          {copied ? <CheckOutlined /> : <CopyOutlined />}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: "0 0 10px 10px", fontSize: 13 }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

function CodebaseBar({ files }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopyAll = () => {
    copyToClipboard(formatCodebase(files)).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    });
  };

  const handleCopyOne = (index) => {
    copyToClipboard(files[index].code).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  };

  return (
    <div className="codebase-bar">
      <div className="codebase-bar-top">
        <span className="codebase-bar-label">
          <FolderOutlined /> {files.length} files
        </span>
        <button className="copy-icon-btn" onClick={handleCopyAll} title={copiedAll ? "Copied all files" : "Copy all files"}>
          {copiedAll ? <CheckOutlined /> : <CopyOutlined />}
        </button>
      </div>

      <ul className="codebase-file-list">
        {files.map((f, i) => (
          <li key={f.filename + i} className="codebase-file-item">
            <span className="codebase-file-name">
              <FileTextOutlined /> {f.filename}
            </span>
            <button className="copy-icon-btn" onClick={() => handleCopyOne(i)} title={`Copy ${f.filename}`}>
              {copiedIndex === i ? <CheckOutlined /> : <CopyOutlined />}
            </button>
          </li>
        ))}
      </ul>
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
        {imageUrl && (
          <div className="user-image-attachment" onClick={() => onImageClick?.(imageUrl)}>
            <img src={imageUrl} alt="attached" />
          </div>
        )}
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
    <Content className="chat-body" id="chat-container">
      <ImageModal src={modalImage} onClose={() => setModalImage(null)} />

      <div className="chat-column">
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
              </div>
            );
          }

          return (
            <div key={messageId} className="message-row bot">
              <div className="avatar bot-avatar">
                <OpenAIOutlined />
              </div>
              <div className="bot-message-wrap">
                {/* {(() => {
                  const codeFiles = extractCodeFiles(msg.message);
                  return codeFiles.length > 1 ? <CodebaseBar files={codeFiles} /> : null;
                })()} */}
                <div className="bot-text">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children }) {
                        // className looks like "language-json:package.json" when
                        // annotateCodeBlockFilenames() detected a filename, or
                        // just "language-json" otherwise.
                        const match = /language-([\w+-]+)(?::(.+))?/.exec(className || "");
                        const value = String(children).replace(/\n$/, "");
                        // Don't rely on the `inline` prop — react-markdown v9+
                        // stopped passing it. Instead: a fenced block always
                        // carries a "language-*" className OR spans multiple
                        // lines; a genuine inline `code` snippet has neither.
                        const isInline = !match && !value.includes("\n");
                        return isInline ? (
                          <code className="inline-code">{value}</code>
                        ) : (
                          <CodeBlock language={match?.[1]} filename={match?.[2]} value={value} />
                        );
                      },
                      img({ src, alt }) {
                        return <img src={src} alt={alt} onClick={() => setModalImage(src)} />;
                      },
                      table({ children }) {
                        return (
                          <div className="table-wrap">
                            <table>{children}</table>
                          </div>
                        );
                      },
                    }}
                  >
                    {annotateCodeBlockFilenames(msg.message)}
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
            <div className="bot-message-wrap">
              <div className="typing-indicator">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          </div>
        )}
      </div>
    </Content>
  );
}