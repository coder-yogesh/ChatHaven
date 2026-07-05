import React, { useState } from "react";
import { PlusOutlined, SearchOutlined, MessageOutlined, DeleteOutlined } from "@ant-design/icons";

/**
 * Left sidebar: "New chat" / "Search chats" actions + a scrollable list of
 * past conversations, grouped implicitly by recency (backend returns them
 * pre-sorted newest first).
 *
 * Props:
 *  chats            - [{ id, title, updatedAt }]
 *  activeChatId
 *  onNewChat()
 *  onSelectChat(id)
 *  onDeleteChat(id)
 *  onSearch(query)  - optional, wires the search box
 */
export default function Sidebar({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat, onSearch, open, onClose }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const filtered = query.trim()
    ? chats.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    : chats;

  return (
    <>
      {/* Mobile-only backdrop — tapping it closes the drawer. Invisible/inert on desktop via CSS. */}
      {open && <div className="sidebar-backdrop" onClick={onClose} />}

      <div className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-top">
        <button className="sidebar-action" onClick={onNewChat}>
          <PlusOutlined /> New chat
        </button>

        {searching ? (
          <input
            autoFocus
            className="sidebar-search-input"
            placeholder="Search chats..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
            onBlur={() => !query && setSearching(false)}
          />
        ) : (
          <button className="sidebar-action" onClick={() => setSearching(true)}>
            <SearchOutlined /> Search chats
          </button>
        )}
      </div>

      <div className="sidebar-section-label">Chats</div>

      <div className="sidebar-list">
        {filtered.length === 0 && (
          <div className="sidebar-empty">No chats yet</div>
        )}

        {filtered.map((chat) => (
          <div
            key={chat.id}
            className={`sidebar-item ${chat.id === activeChatId ? "active" : ""}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <MessageOutlined className="sidebar-item-icon" />
            <span className="sidebar-item-title">{chat.title || "New chat"}</span>
            <button
              className="sidebar-item-delete"
              title="Delete chat"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
            >
              <DeleteOutlined />
            </button>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}