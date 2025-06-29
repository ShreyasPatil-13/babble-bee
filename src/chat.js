import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { BsChatLeftQuoteFill } from "react-icons/bs";

const socket = io.connect("https://babble-server-t2re.onrender.com");

const COLOR_PAIRS = [
  { bg: "#e0f7fa", name: "#006064" }, // cyan
  { bg: "#fce4ec", name: "#880e4f" }, // pink
  { bg: "#f3e5f5", name: "#4a148c" }, // purple
  { bg: "#fff8e1", name: "#ff6f00" }, // orange
  { bg: "#f1f8e9", name: "#33691e" }, // green
  { bg: "#ede7f6", name: "#4527a0" }, // deep purple
  { bg: "#e8f5e9", name: "#1b5e20" }, // dark green
  { bg: "#fbe9e7", name: "#bf360c" }, // deep orange
];

function Chat() {
  const chatBoxRef = useRef(null);

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [userColors, setUserColors] = useState({});

  const [username, setUsername] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("send_message", {
        text: message,
        sender: socket.id,
        username: username,
      });
      setMessage("");
    }
  };

  const joinConversation = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsNameSet(true);
      socket.emit("user_joined", { username });
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setUserColors((prev) => {
        if (!prev[data.username]) {
          const randomPair =
            COLOR_PAIRS[Math.floor(Math.random() * COLOR_PAIRS.length)];
          return { ...prev, [data.username]: randomPair };
        }
        return prev;
      });

      setChat((prev) => [...prev, data]);
    });

    socket.on("user_joined", (data) => {
      setChat((prev) => [
        ...prev,
        {
          type: "system",
          text: `${data.username} joined the chat`,
        },
      ]);
    });

    socket.on("user_left", (data) => {
      setChat((prev) => [
        ...prev,
        {
          type: "system",
          text: `${data.username} left the chat`,
        },
      ]);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <div>
      <div className="header">
        <h2 className="title">
          BabbleBee
          <BsChatLeftQuoteFill style={{ color: "#6c63ff" }} />
        </h2>
        {!isNameSet && (
          <div className="user-box">
            <h2>Enter your name to join chat</h2>
            <form onSubmit={joinConversation}>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                required
              />
              <button type="submit">Join</button>
            </form>
          </div>
        )}
      </div>
      <div className="chat-container">
        <ul className="chat-box" ref={chatBoxRef}>
          {chat.map((msg, index) => {
            if (msg.type === "system") {
              return (
                <li key={index} className="system-message">
                  {msg.text}
                </li>
              );
            }

            const colorPair = userColors[msg.username] || {
              bg: "#e0e0e0",
              name: "#333",
            };

            const isOwn = msg.sender === socket.id;

            return (
              <li
                key={index}
                className={`message-box ${isOwn ? "own" : "other"}`}
              >
                <div
                  className={`message ${isOwn ? "own" : "other"}`}
                  style={{
                    backgroundColor: isOwn ? undefined : colorPair.bg,
                  }}
                >
                  {!isOwn ? (
                    <strong style={{ color: colorPair.name }}>
                      {msg.username || "Anonymous"}
                    </strong>
                  ) : (
                    <strong>You</strong>
                  )}
                  {msg.text}
                </div>
              </li>
            );
          })}
        </ul>

        {isNameSet && (
          <form onSubmit={sendMessage} className="message-form">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              required
            />
            <button type="submit">Send</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Chat;
