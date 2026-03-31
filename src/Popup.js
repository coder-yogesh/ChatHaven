import { useState, useEffect } from "react";

const API_URL = "http://localhost:4000";

export default function Popup() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { type: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    const token = await getToken();

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: input })
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { type: "bot", text: data.message }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error connecting server" }
      ]);
    }

    setInput("");
  };

  const getToken = () => {
    return new Promise((resolve) => {
      chrome.storage.local.get(["token"], (res) => {
        resolve(res.token);
      });
    });
  };

  return (
    <div className="container">
      <div className="header">ChatHaven</div>

      <div className="chat">
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.type}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="inputBox">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}