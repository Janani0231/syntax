const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000"
).replace(/\/$/, "");

function toWebSocketUrl(httpUrl: string) {
  const url = new URL(httpUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString().replace(/\/$/, "");
}

export function createChatSocket(token: string) {
  const url = new URL(`${toWebSocketUrl(API_BASE_URL)}/ws/chat`);
  url.searchParams.set("token", token);
  return new WebSocket(url.toString());
}
