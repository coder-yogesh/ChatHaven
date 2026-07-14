import React, { useState } from "react";
import { PlusOutlined, SearchOutlined, MessageOutlined, DeleteOutlined, CloseOutlined } from "@ant-design/icons";

// Wraps the first match of `query` inside `text` in <mark>, so a result
// visibly shows *why* it matched instead of just that it did.
function highlightMatch(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/**
 * Left sidebar: "New chat" / "Search chats" actions + a scrollable list of
 * past conversations, grouped implicitly by recency (backend returns them
 * pre-sorted newest first).
 *
 * Search covers both the chat title (matched instantly, client-side) and
 * the chat's message content. Title matching happens here; content
 * matching is resolved by the parent (App.js), which lazily fetches +
 * caches each chat's messages as you type and reports back the matching
 * line per chat id via `contentMatches`. `chats` is expected to already be
 * filtered down to the matching set by the parent.
 *
 * Props:
 *  chats            - [{ id, title, updatedAt }], pre-filtered when searchQuery is set
 *  activeChatId
 *  onNewChat()
 *  onSelectChat(id)
 *  onDeleteChat(id)
 *  searchQuery      - controlled search text ("" when not searching)
 *  onSearchChange(query)
 *  contentMatches   - { [chatId]: matchingMessageText } for chats that matched by content, not title
 *  searching        - true while a content search is still resolving (shows "Searching…")
 */
export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  searchQuery,
  onSearchChange,
  contentMatches = {},
  searching,
  open,
  onClose,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const isSearching = searchOpen || !!searchQuery;

  const closeSearch = () => {
    onSearchChange?.("");
    setSearchOpen(false);
  };

  return (
    <>
      {/* Mobile-only backdrop — tapping it closes the drawer. Invisible/inert on desktop via CSS. */}
      {open && <div className="sidebar-backdrop" onClick={onClose} />}

      <div className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top">
          <button className="sidebar-action" onClick={onNewChat}>
            <PlusOutlined /> New chat
          </button>

          {isSearching ? (
            <div className="sidebar-search-row">
              <SearchOutlined className="sidebar-search-icon" />
              <input
                autoFocus
                className="sidebar-search-input"
                placeholder="Search titles and messages..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onBlur={() => !searchQuery && setSearchOpen(false)}
              />
              {searchQuery && (
                <button className="sidebar-search-clear" onClick={closeSearch} title="Clear search">
                  <CloseOutlined />
                </button>
              )}
            </div>
          ) : (
            <button className="sidebar-action" onClick={() => setSearchOpen(true)}>
              <SearchOutlined /> Search chats
            </button>
          )}
        </div>

        <div className="sidebar-section-label">
          {searchQuery
            ? searching
              ? "Searching…"
              : `${chats.length} result${chats.length === 1 ? "" : "s"} for "${searchQuery}"`
            : "Chats"}
        </div>

        <div className="sidebar-list">
          {chats.length === 0 && (
            <div className="sidebar-empty">
              {searchQuery ? "No chats match your search" : "No chats yet"}
            </div>
          )}

          {chats.map((chat) => {
            const titleHit = searchQuery
              ? chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
              : false;
            // Only show a message snippet when the chat matched because of
            // its *content*, not its title — otherwise every result would
            // redundantly show a random line under an already-matching title.
            const snippet = searchQuery && !titleHit ? contentMatches[chat.id] : null;

            return (
              <div
                key={chat.id}
                className={`sidebar-item ${chat.id === activeChatId ? "active" : ""} ${snippet ? "has-snippet" : ""}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <MessageOutlined className="sidebar-item-icon" />
                <div className="sidebar-item-text">
                  <span className="sidebar-item-title">
                    {highlightMatch(chat.title || "New chat", searchQuery)}
                  </span>
                  {snippet && (
                    <span className="sidebar-item-snippet">{highlightMatch(snippet, searchQuery)}</span>
                  )}
                </div>
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
            );
          })}
        </div>
      </div>
    </>
  );
}