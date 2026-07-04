// MessageActions.jsx
import React, { useState } from "react";
import { Dropdown, message as antMessage } from "antd";
import {
  CopyOutlined,
  CheckOutlined,
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  ShareAltOutlined,
  RedoOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { splitContent, copyToClipboard } from "./messageUtils";
import { sendFeedback } from "./services/api";

export default function MessageActions({ messageId, rawMessage, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null

  const { text, codeBlocks } = splitContent(rawMessage);
  const hasCode = codeBlocks.length > 0;

  const flashCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const copyEverything = () => copyToClipboard(rawMessage).then(flashCopied);
  const copyTextOnly = () => copyToClipboard(text).then(flashCopied);
  const copyAllCode = () =>
    copyToClipboard(codeBlocks.map((b) => b.code).join("\n\n")).then(flashCopied);
  const copyOneBlock = (i) => copyToClipboard(codeBlocks[i].code).then(flashCopied);

  const copyMenuItems = hasCode
    ? [
        { key: "all", label: "Copy full message", onClick: copyEverything },
        { key: "text", label: "Copy text only", onClick: copyTextOnly },
        ...(codeBlocks.length > 1
          ? [{ key: "code-all", label: `Copy all code (${codeBlocks.length} blocks)`, onClick: copyAllCode }]
          : [{ key: "code-all", label: "Copy code only", onClick: copyAllCode }]),
        ...(codeBlocks.length > 1
          ? codeBlocks.map((b, i) => ({
              key: `code-${i}`,
              label: `Copy code block ${i + 1} (${b.lang})`,
              onClick: () => copyOneBlock(i),
            }))
          : []),
      ]
    : null;

  const CopyButton = () =>
    hasCode ? (
      <Dropdown menu={{ items: copyMenuItems }} trigger={["click"]} placement="topLeft">
        <button className="msg-action-btn" title="Copy options">
          {copied ? <CheckOutlined /> : <CopyOutlined />}
        </button>
      </Dropdown>
    ) : (
      <button className="msg-action-btn" title="Copy" onClick={copyEverything}>
        {copied ? <CheckOutlined /> : <CopyOutlined />}
      </button>
    );

  // Actually persists feedback via /feedback instead of only local state.
  // Clicking an already-active choice clears it (sends type: null).
  const handleFeedback = async (type) => {
    const next = feedback === type ? null : type;
    setFeedback(next); // optimistic update
    try {
      await sendFeedback(messageId, next);
    } catch (err) {
      console.error("Failed to send feedback:", err);
      setFeedback(feedback); // revert on failure
      antMessage.error("Couldn't save feedback, try again.");
    }
  };

  const moreItems = [
    { key: "report", label: "Report an issue" },
    { key: "view-raw", label: "View raw markdown", onClick: () => antMessage.info(rawMessage) },
  ];

  return (
    <div className="msg-actions">
      <CopyButton />

      <button
        className={`msg-action-btn ${feedback === "up" ? "active" : ""}`}
        title="Good response"
        onClick={() => handleFeedback("up")}
      >
        {feedback === "up" ? <LikeFilled /> : <LikeOutlined />}
      </button>

      <button
        className={`msg-action-btn ${feedback === "down" ? "active" : ""}`}
        title="Bad response"
        onClick={() => handleFeedback("down")}
      >
        {feedback === "down" ? <DislikeFilled /> : <DislikeOutlined />}
      </button>

      <button className="msg-action-btn" title="Share" onClick={copyEverything}>
        <ShareAltOutlined />
      </button>

      {onRegenerate && (
        <button className="msg-action-btn" title="Regenerate" onClick={onRegenerate}>
          <RedoOutlined />
        </button>
      )}

      <Dropdown menu={{ items: moreItems }} trigger={["click"]}>
        <button className="msg-action-btn" title="More">
          <MoreOutlined />
        </button>
      </Dropdown>
    </div>
  );
}