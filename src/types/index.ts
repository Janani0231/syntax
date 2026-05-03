// ─── Domain Types ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppFile {
  name: string;
  size: number;
  modifiedAt: string;
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  user: ChatUser;
}

export type ChatServerEvent =
  | { type: "chat:history"; messages: ChatMessage[] }
  | { type: "chat:message"; message: ChatMessage }
  | { type: "presence:update"; onlineUsers: ChatUser[] }
  | { type: "error"; message: string };

export type ChatClientEvent = { type: "chat:message"; text: string };

// ─── API Payload Shapes ───────────────────────────────────────────────────────

export interface CreateNoteInput {
  title: string;
  content: string;
}

export interface UpdateNoteInput {
  title: string;
  content: string;
}

export interface CreateFileInput {
  name: string;
  content: string;
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

export interface ToolbarAction {
  label: string;
  command: string;
  value?: string;
  title: string;
}

// ─── Status Slice ─────────────────────────────────────────────────────────────

export type LoadStatus = "idle" | "loading" | "succeeded" | "failed";
