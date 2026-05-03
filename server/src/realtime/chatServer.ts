import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { verifyAuthToken } from "../lib/authService.js";
import { findPublicUserById } from "../lib/userRepository.js";
import type { User } from "../types/user.js";

interface AuthedWebSocket extends WebSocket {
  user?: User;
  isAlive?: boolean;
}

type ClientMessage = {
  type: "chat:message";
  text: string;
};

type ServerMessage =
  | {
      type: "chat:history";
      messages: ChatMessage[];
    }
  | {
      type: "chat:message";
      message: ChatMessage;
    }
  | {
      type: "presence:update";
      onlineUsers: Array<Pick<User, "id" | "name" | "email">>;
    }
  | {
      type: "error";
      message: string;
    };

interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  user: Pick<User, "id" | "name" | "email">;
}

const MAX_HISTORY = 50;
const chatHistory: ChatMessage[] = [];

function sendJson(socket: WebSocket, message: ServerMessage) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function broadcast(wss: WebSocketServer, message: ServerMessage) {
  for (const client of wss.clients) {
    sendJson(client, message);
  }
}

function getOnlineUsers(wss: WebSocketServer) {
  const usersById = new Map<string, Pick<User, "id" | "name" | "email">>();

  for (const client of wss.clients) {
    const socket = client as AuthedWebSocket;

    if (socket.user) {
      usersById.set(socket.user.id, {
        id: socket.user.id,
        name: socket.user.name,
        email: socket.user.email,
      });
    }
  }

  return [...usersById.values()];
}

function broadcastPresence(wss: WebSocketServer) {
  broadcast(wss, {
    type: "presence:update",
    onlineUsers: getOnlineUsers(wss),
  });
}

function parseClientMessage(rawData: WebSocket.RawData): ClientMessage | null {
  try {
    const payload = JSON.parse(rawData.toString()) as Partial<ClientMessage>;

    if (payload.type !== "chat:message" || typeof payload.text !== "string") {
      return null;
    }

    const text = payload.text.trim();

    if (!text || text.length > 1000) {
      return null;
    }

    return { type: "chat:message", text };
  } catch {
    return null;
  }
}

async function authenticateRequest(request: IncomingMessage) {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const token = requestUrl.searchParams.get("token");

  if (!token) {
    return null;
  }

  try {
    const claims = verifyAuthToken(token);
    const user = await findPublicUserById(claims.sub);

    if (!user || user.email !== claims.email) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function attachChatWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/chat" });

  wss.on("connection", async (socket: AuthedWebSocket, request) => {
    const user = await authenticateRequest(request);

    if (!user) {
      socket.close(1008, "Authentication required");
      return;
    }

    socket.user = user;
    socket.isAlive = true;

    sendJson(socket, {
      type: "chat:history",
      messages: chatHistory,
    });
    broadcastPresence(wss);

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", (rawData) => {
      const message = parseClientMessage(rawData);

      if (!message || !socket.user) {
        sendJson(socket, {
          type: "error",
          message: "Invalid chat message",
        });
        return;
      }

      const chatMessage: ChatMessage = {
        id: randomUUID(),
        text: message.text,
        createdAt: new Date().toISOString(),
        user: {
          id: socket.user.id,
          name: socket.user.name,
          email: socket.user.email,
        },
      };

      chatHistory.push(chatMessage);

      if (chatHistory.length > MAX_HISTORY) {
        chatHistory.splice(0, chatHistory.length - MAX_HISTORY);
      }

      broadcast(wss, {
        type: "chat:message",
        message: chatMessage,
      });
    });

    socket.on("close", () => {
      broadcastPresence(wss);
    });
  });

  const interval = setInterval(() => {
    for (const client of wss.clients) {
      const socket = client as AuthedWebSocket;

      if (socket.isAlive === false) {
        socket.terminate();
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }
  }, 30_000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  console.log("WebSocket chat server listening on /ws/chat");

  return wss;
}
