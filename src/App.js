import { useEffect, useRef, useState } from "react";
import "./App.css";
import Googlelogo from "./assets/Google Logo.png";
import Logo from "./assets/large-removebg-preview.png";
import { Avatar, Button, Col, Dropdown, Flex, Layout } from "antd";
import { chatGpt, fetchChats, createChat, fetchChat, saveChatMessages, deleteChat } from "./services/api";
import { Content, Header } from "antd/es/layout/layout";
import { jwtDecode } from "jwt-decode";
import ChatMessages from "./ChatMessage";
import ChatInput from "./ChatInput";
import EmptyState from "./EmptyState";
import Sidebar from "./Sidebar";
import SettingsModal from "./SettingsModal";

const isExtension =
  typeof chrome !== "undefined" &&
  typeof chrome.runtime !== "undefined" &&
  typeof chrome.runtime.id !== "undefined";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/";

// Stable id per message so feedback (like/dislike) can reference a specific
// message even after edits/regenerations reshuffle the array.
const makeId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const containerRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");


  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // 🔥 Load token from storage
  useEffect(() => {
    if (isExtension && chrome.storage) {
      chrome.storage.local.get(["token", "user"], (res) => {
        if (res.token) {
          setToken(res.token);
          setUser(res.user);
        }
      });
    } else {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (token && user) {
        setToken(token);
        setUser(JSON.parse(user));
      }
    }
  }, []);

  // 🔥 Handle token from URL (web login)
  useEffect(() => {
    if (isExtension) return;

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    console.log("URL Params:", params.toString());
    console.log("URL Token:", urlToken);
    if (urlToken) {
      try {
        const decoded = jwtDecode(urlToken);

        const userData = decoded.user; // ✅ normalize

        localStorage.setItem("token", urlToken);
        localStorage.setItem("user", JSON.stringify(userData));

        setToken(urlToken);
        setUser(userData);

        window.history.replaceState({}, document.title, "/");
      } catch (err) {
        console.error("Token decode failed", err);
      }
    }
  }, []);

  // 🔥 Listen for extension OAuth response
  useEffect(() => {
    if (!isExtension) return;

    const listener = (event) => {
      if (event.data?.token) {
        const decoded = jwtDecode(event.data.token);
        const userData = decoded.user; // ✅ normalize

        chrome.storage.local.set({
          token: event.data.token,
          user: userData
        });

        setToken(event.data.token);
        setUser(userData);
      }
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  // 🔥 Auto scroll
  useEffect(() => {
    const chat = document.getElementById("chat-container");
    if (chat) chat.scrollTop = chat.scrollHeight;
  }, [messages]);

  useEffect(() => {
    document.body.className = isExtension ? "extension" : "web";
  }, []);

  // 🔹 Apply the chosen theme to <html data-theme="...">. "system" tracks
  // the OS preference live, updating if the user changes it mid-session.
  useEffect(() => {
    localStorage.setItem("theme", theme);

    const applySystemTheme = () => {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    };

    if (theme === "system") {
      applySystemTheme();
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", applySystemTheme);
      return () => mq.removeEventListener("change", applySystemTheme);
    }

    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // 🔹 Load the sidebar's chat list once logged in, and open the most
  // recent chat (or create a fresh one if this user has none yet).
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const chatList = await fetchChats();
        setChats(chatList);

        if (chatList.length > 0) {
          const mostRecent = chatList[0];
          setActiveChatId(mostRecent.id);
          const chat = await fetchChat(mostRecent.id);
          setMessages(chat.messages || []);
        } else {
          const chat = await createChat();
          setChats([{ id: chat.id, title: chat.title, updatedAt: chat.updatedAt }]);
          setActiveChatId(chat.id);
        }
      } catch (err) {
        console.error("Failed to load chats:", err);
      }
    })();
  }, [token]);

  // 🔹 LOGIN
  const login = () => {
    if (isExtension) {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError || !token) {
          console.error("Auth Error:", chrome.runtime.lastError);
          return;
        }

        try {
          // 🔹 Get user info
          const res = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          const user = await res.json();

          // 🔹 Save
          chrome.storage.local.set({ token, user });

          setToken(token);
          setUser(user);

        } catch (err) {
          console.error("User fetch failed:", err);
        }
      });
    } else {
      window.location.href = `${API_URL}api/auth/google`;
    }
  };

  // 🔹 LOGIN UI
  if (!token) {
    return (
      <Flex style={{
        width: isExtension ? "400px" : "100%",
        height: isExtension ? "600px" : "100vh", justifyContent: "center", alignItems: "center" }}>
        <Layout style={{ width: isExtension ? "400px" : "100%", background: "transparent" }}>
          <Content>
            <Flex justify="center" align="center">
              <Col style={{ textAlign: "center" }}>
                <img src={Logo} width={180} />
                <h3>Login to ChatHaven</h3>

                <Button onClick={login}>
                  <img src={Googlelogo} />
                  Continue with Google
                </Button>
              </Col>
            </Flex>
          </Content>
        </Layout>
      </Flex>
    );
  }

  // 🔹 CHAT LOGIC
  // NOTE: message is stored as raw markdown (no manual regex → HTML
  // formatting). ChatMessages renders markdown + code blocks itself via
  // react-markdown, so pre-formatting here would just fight with that.
  // `file` is passed through to chatGpt() so images actually reach the API.
  const sendPrompt = async (inputText, history, file) => {
    setLoading(true);
    try {
      const res = await chatGpt(inputText, file);

      const botMessage = { id: makeId(), type: "gpt", message: res.message };
      const finalMessages = [...history, botMessage];
      setMessages(finalMessages);
      persistMessages(finalMessages);
    } catch (error) {
      const finalMessages = [
        ...history,
        { id: makeId(), type: "gpt", message: "❌ Error fetching response" },
      ];
      setMessages(finalMessages);
      persistMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  // Saves the current message list to the backend under activeChatId, then
  // refreshes the sidebar list so titles/ordering stay up to date.
  const persistMessages = async (msgs) => {
    if (!activeChatId) return;
    try {
      await saveChatMessages(activeChatId, msgs);
      const updatedChats = await fetchChats();
      setChats(updatedChats);
    } catch (err) {
      console.error("Failed to save chat:", err);
    }
  };

  // 🔹 Sidebar: start a new empty chat
  const handleNewChat = async () => {
    try {
      const chat = await createChat();
      setChats((prev) => [{ id: chat.id, title: chat.title, updatedAt: chat.updatedAt }, ...prev]);
      setActiveChatId(chat.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  // 🔹 Sidebar: switch to a past chat, loading its full message history
  const handleSelectChat = async (chatId) => {
    try {
      const chat = await fetchChat(chatId);
      setActiveChatId(chatId);
      setMessages(chat.messages || []);
    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  };

  // 🔹 Sidebar: delete a chat; if it was the active one, fall back to another
  // existing chat or start a fresh one.
  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChat(chatId);
      const remaining = chats.filter((c) => c.id !== chatId);
      setChats(remaining);

      if (chatId === activeChatId) {
        if (remaining.length > 0) {
          handleSelectChat(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const submit = async () => {
    if (!q.trim() && !imageFile) return;

    // Local preview URL so the sent image shows up inline in the chat log.
    // Keep the actual File too (imageFile) so if this message gets edited
    // later, we can resend the same image instead of losing it.
    const imageUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;
    const userMessage = { id: makeId(), type: "user", message: q, imageUrl, imageFile };
    const updated = [...messages, userMessage];
    setMessages(updated);

    const inputText = q.trim() || "Describe this image.";
    const fileToSend = imageFile;
    setQ("");
    setImageFile(null);

    sendPrompt(inputText, updated, fileToSend);
  };

  // 🔹 Suggestion card clicked on the empty-state screen: sends that prompt
  // immediately, same as typing it and hitting send.
  const handleSuggestionClick = (promptText) => {
    const userMessage = { id: makeId(), type: "user", message: promptText };
    const updated = [...messages, userMessage];
    setMessages(updated);
    sendPrompt(promptText, updated);
  };

  // 🔹 Edit one of your own messages: truncate everything after it and
  // re-send the edited text, replacing the bot's original reply. If the
  // original message had an attached image, resend that same image too —
  // otherwise the edited request would silently lose it.
  const handleEditMessage = (index, newText) => {
    const original = messages[index];
    const truncated = messages.slice(0, index);
    const editedMessage = {
      id: makeId(),
      type: "user",
      message: newText,
      imageUrl: original?.imageUrl,
      imageFile: original?.imageFile,
    };
    const updated = [...truncated, editedMessage];
    setMessages(updated);
    sendPrompt(newText, updated, original?.imageFile);
  };

  // 🔹 Regenerate a bot reply: find the user message that produced it and
  // re-send it (including its image, if any), replacing this reply.
  const handleRegenerate = (index) => {
    const priorUserMsg = [...messages.slice(0, index)].reverse().find((m) => m.type === "user");
    if (!priorUserMsg) return;
    const truncated = messages.slice(0, index);
    sendPrompt(priorUserMsg.message, truncated, priorUserMsg.imageFile);
  };

  // 🔹 LOGOUT
  const logout = () => {
    if (isExtension) {
      chrome.storage.local.clear();
    } else {
      localStorage.clear();
    }

    setToken(null);
    setUser(null);
  };

  return (
    <Flex style={{ height: "100vh" }}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      <Layout style={{ width: "100%" }}>
        <Header className="app-header">
          <div className="app-brand">
            <img src={Logo} alt="ChatHaven" className="app-logo" />
            <h3 className="app-title">ChatHaven</h3>
          </div>

          <Dropdown
            menu={{
              items: [
                { key: "settings", label: "Settings" },
                { key: "logout", label: "Logout" },
              ],
              onClick: ({ key }) => {
                if (key === "settings") setSettingsOpen(true);
                if (key === "logout") logout();
              },
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <div className="app-user-trigger">
              <Avatar src={user?.picture} size={34} />
            </div>
          </Dropdown>
        </Header>

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          theme={theme}
          onThemeChange={setTheme}
        />

        <div ref={containerRef} style={{ flex: 1, overflowY: "auto" }}>
          {messages.length === 0 ? (
            <EmptyState userName={user?.name} onSuggestionClick={handleSuggestionClick} />
          ) : (
            <ChatMessages
              messages={messages}
              loading={loading}
              onEditMessage={handleEditMessage}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>

        <ChatInput
          value={q}
          onChange={setQ}
          onSend={submit}
          imageFile={imageFile}
          onImageSelect={setImageFile}
          onImageRemove={() => setImageFile(null)}
          loading={loading}
        />
      </Layout>
    </Flex>
  );
}

export default App;