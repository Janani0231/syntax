import { useEffect, useMemo, useRef, useState } from "react";
import { createChatSocket } from "@/api/realtime";
import type { ChatMessage, ChatServerEvent, ChatUser, User } from "@/types";

interface LiveChatProps {
  currentUser: User;
  token: string;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

function formatChatTime(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default function LiveChat({ currentUser, token }: LiveChatProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [draft, setDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const statusLabel = useMemo(() => {
    switch (status) {
      case "connected":
        return "Live";
      case "connecting":
        return "Connecting";
      case "error":
        return "Connection issue";
      case "disconnected":
        return "Offline";
    }
  }, [status]);

  useEffect(() => {
    setStatus("connecting");
    setErrorMessage("");

    const socket = createChatSocket(token);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setStatus("connected");
    });

    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data as string) as ChatServerEvent;

      switch (payload.type) {
        case "chat:history":
          setMessages(payload.messages);
          break;
        case "chat:message":
          setMessages((current) => [...current, payload.message]);
          break;
        case "presence:update":
          setOnlineUsers(payload.onlineUsers);
          break;
        case "error":
          setErrorMessage(payload.message);
          break;
      }
    });

    socket.addEventListener("close", () => {
      setStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      setStatus("error");
      setErrorMessage("Unable to connect to live chat");
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();

    if (!text || socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "chat:message",
        text,
      }),
    );
    setDraft("");
  }

  return (
    <section className="chat-card">
      <div className="chat-heading">
        <div>
          <h2>Team Chat</h2>
          <p>Real-time WebSocket chat for your note workspace.</p>
        </div>
        <span className={`chat-status ${status}`}>{statusLabel}</span>
      </div>

      <div className="chat-presence">
        {onlineUsers.length ? (
          <span>{onlineUsers.length} online</span>
        ) : (
          <span>No one online yet</span>
        )}
      </div>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

      <div className="chat-messages" aria-live="polite">
        {messages.length ? (
          messages.map((message) => {
            const isMine = message.user.id === currentUser.id;
            return (
              <article
                className={`chat-message${isMine ? " mine" : ""}`}
                key={message.id}
              >
                <div className="chat-message-meta">
                  <strong>{isMine ? "You" : message.user.name}</strong>
                  <span>{formatChatTime(message.createdAt)}</span>
                </div>
                <p>{message.text}</p>
              </article>
            );
          })
        ) : (
          <p className="empty-message">No messages yet. Start the conversation.</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a live message..."
          maxLength={1000}
          disabled={status !== "connected"}
        />
        <button
          type="submit"
          className="button button-primary"
          disabled={status !== "connected" || !draft.trim()}
        >
          Send
        </button>
      </form>
    </section>
  );
}
