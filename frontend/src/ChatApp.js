import React, { useState } from "react";
import axios from "axios";

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { from: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await axios.post(
        "https://agrisaarthibackend.onrender.com/chat",
        {
          query: input,
          history: newMessages.map((msg) => msg.text),
        }
      );
      setMessages([...newMessages, { from: "bot", text: res.data.response }]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { from: "bot", text: "Error contacting chatbot." },
      ]);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🌾 AgriSaarthi Chatbot</h2>
      <div
        style={{
          height: "300px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: 10,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{ textAlign: msg.from === "user" ? "right" : "left" }}
          >
            <p>
              <strong>{msg.from === "user" ? "You" : "KrishiGPT"}:</strong>{" "}
              {msg.text}
            </p>
          </div>
        ))}
      </div>
      <input
        style={{ width: "70%", padding: "8px", marginTop: 10 }}
        type="text"
        value={input}
        placeholder="Ask something in Hindi or Marathi..."
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button
        onClick={sendMessage}
        style={{ padding: "8px 16px", marginLeft: 10 }}
      >
        Send
      </button>
    </div>
  );
}

export default ChatApp;
