import { useEffect, useRef, useState } from "react";
import "./App.css";
import Googlelogo from "./assets/Google Logo.png";
import Logo from "./assets/large-removebg-preview.png";
import smallLogo from "./assets/large.png";
import { Avatar, Button, Col, Dropdown, Flex, Layout } from "antd";
import { chatGpt } from "./services/api";
import { Content, Header } from "antd/es/layout/layout";
import { jwtDecode } from "jwt-decode";
import ChatMessages from "./ChatMessage";
import ChatInput from "./ChatInput";
import EmptyState from "./EmptyState";

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
      setMessages([...history, botMessage]);
    } catch (error) {
      setMessages([
        ...history,
        { id: makeId(), type: "gpt", message: "❌ Error fetching response" },
      ]);
    } finally {
      setLoading(false);
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
    <Flex style={{ height: "100vh" }} justify="center">
      <Layout style={{ width: "100%" }}>
        <Header className="app-header">
          <div className="app-brand">
            <img src={smallLogo} alt="ChatHaven" className="app-logo" />
            <h2 className="app-title">ChatHaven</h2>
          </div>

          <Dropdown
            menu={{
              items: [{ key: "logout", label: "Logout" }],
              onClick: logout
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <div className="app-user-trigger">
              <Avatar src={user?.picture} size={34} />
            </div>
          </Dropdown>
        </Header>

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