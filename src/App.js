import { useEffect, useState } from "react";
import "./App.css";
import Googlelogo from "./assets/Google Logo.png";
import Logo from "./assets/large-removebg-preview.png";
import { Avatar, Button, Col, Dropdown, Flex, Layout } from "antd";
import { chatGpt } from "./services/api";
import { Content, Footer, Header } from "antd/es/layout/layout";
import { OpenAIOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { jwtDecode } from "jwt-decode";

const isExtension =
  typeof chrome !== "undefined" &&
  typeof chrome.runtime !== "undefined" &&
  typeof chrome.runtime.id !== "undefined";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/";

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

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
  const submit = async () => {
    if (!q.trim()) return;

    setLoading(true);

    const userMessage = { type: "user", message: q };
    setMessages((prev) => [...prev, userMessage]);

    const inputText = q;
    setQ("");

    try {
      const res = await chatGpt(inputText);

      const formattedMessage = res.message
        .replace(/^\d+\.\s*/gm, "")
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/```([\s\S]+?)```/g, (match, code) => {
          return `<pre><code>${code}</code></pre>`;
        });

      const botMessage = {
        type: "gpt",
        message: formattedMessage,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "gpt", message: "❌ Error fetching response" }
      ]);
    } finally {
      setLoading(false);
    }
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
        <Header style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>
            <img src={Logo} width={35} />
            <h3>ChatHaven</h3>
          </div>

          <Dropdown
            menu={{
              items: [{ key: "logout", label: "Logout" }],
              onClick: logout
            }}
          >
            {/* ✅ FIXED IMAGE */}
            <Avatar src={user?.picture} />
          </Dropdown>
        </Header>

        <Content
          style={{ padding: 10, overflowY: "auto" }}
          className="chat-body"
          id="chat-container"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.type === "gpt" ? "bot" : "user"}`}>
              {msg.type === "gpt" ? (
                <div style={{ display: "flex" }}>
                  <OpenAIOutlined style={{ marginRight: "5px" }} />
                  <div
                    className="bubble"
                    dangerouslySetInnerHTML={{ __html: msg.message }}
                  />
                </div>
              ) : (
                <div className="bubble" style={{ textAlign: "right" }}>
                  {msg.message}
                </div>
              )}
            </div>
          ))}

          {loading && <div className="typing">Typing...</div>}
        </Content>

        <Footer>
          <div className="chat-footer">
            <TextArea
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Message ChatHaven"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </div>
        </Footer>
      </Layout>
    </Flex>
  );
}

export default App;