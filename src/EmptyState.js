import React from "react";
import {
  BulbOutlined,
  CodeOutlined,
  EditOutlined,
  CompassOutlined,
} from "@ant-design/icons";
import Logo from "./assets/large-removebg-preview.png";

const SUGGESTIONS = [
  {
    icon: <BulbOutlined />,
    title: "Explain a concept",
    prompt: "Explain how async/await works in JavaScript",
  },
  {
    icon: <CodeOutlined />,
    title: "Write some code",
    prompt: "Write a function that debounces user input",
  },
  {
    icon: <EditOutlined />,
    title: "Help me write",
    prompt: "Help me write a polite follow-up email",
  },
  {
    icon: <CompassOutlined />,
    title: "Get recommendations",
    prompt: "Suggest a weekend trip near me",
  },
];

/**
 * Shown before the first message is sent. Replaces the empty gray canvas
 * with a welcome message + clickable suggestion cards.
 * Props:
 *  userName        - shown in the greeting, if available
 *  onSuggestionClick(promptText)
 */
export default function EmptyState({ userName, onSuggestionClick }) {
  return (
    <div className="empty-state">
      <img src={Logo} alt="ChatHaven" className="empty-state-logo" />
      <h2 className="empty-state-title">
        {userName ? `Welcome back, ${userName.split(" ")[0]}` : "Welcome to ChatHaven"}
      </h2>
      <p className="empty-state-subtitle">Ask anything, attach an image, or try one of these</p>

      <div className="suggestion-grid">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            className="suggestion-card"
            onClick={() => onSuggestionClick(s.prompt)}
          >
            <span className="suggestion-icon">{s.icon}</span>
            <span className="suggestion-title">{s.title}</span>
            <span className="suggestion-prompt">{s.prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}