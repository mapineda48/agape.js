/**
 * Public Socket Namespace: Global Chat
 *
 * Provides real-time communication for a public global chat.
 * Broadcasts messages to all connected clients without persistence.
 */

import { registerNamespace } from "#lib/socket/namespace";
import { CacheManager } from "#lib/infrastructure/CacheManager";
import logger from "#lib/log/logger";
import type { ConnectedSocket } from "#shared/socket";

// ============================================================================
// Event Types
// ============================================================================

/** Message structure */
export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

/**
 * Events emitted/received by this socket namespace.
 */
type ChatEvents = {
  /** Client sends a message to the server */
  "message:send": { text: string; sender: string };
  /** Server broadcasts message to all clients */
  "message:received": ChatMessage;
  /** Client notifies they are typing */
  "user:typing": { sender: string };
  /** Client notifies they stopped typing (e.g. sent message) */
  "user:typing:stop": { sender: string };
  /** Internal: socket connected */
  "socket:connect": Record<string, never>;
  /** Internal: socket disconnected */
  "socket:disconnect": Record<string, never>;
  /** Server broadcasts current online users count */
  "users:count": { count: number };
};

// ============================================================================
// Namespace Export & Logic
// ============================================================================

const socket = registerNamespace<ChatEvents>();

// Redis key for online users counter (stateless across replicas)
const ONLINE_USERS_KEY = "public:chat:online_users";

socket.on("socket:connect", async () => {
  const cache = CacheManager.get();
  const count = await cache.incr(ONLINE_USERS_KEY);
  socket.emit("users:count", { count });
});

socket.on("socket:disconnect", async () => {
  const cache = CacheManager.get();
  const count = await cache.decr(ONLINE_USERS_KEY);
  // Ensure count doesn't go below 0
  socket.emit("users:count", { count: Math.max(0, count) });
});

// Handle typing status
socket.on("user:typing", (payload) => {
  socket.emit("user:typing", payload);
});

socket.on("user:typing:stop", (payload) => {
  socket.emit("user:typing:stop", payload);
});

// Handle incoming chat messages
socket.on("message:send", (payload) => {
  logger.scope("Chat").info("Message received", payload);
  // Broadcast the message back to all clients
  socket.emit("message:received", {
    id: Math.random().toString(36).substring(2, 11),
    text: payload.text,
    sender: payload.sender,
    timestamp: Date.now(),
  });
});

export default socket as ConnectedSocket<ChatEvents>;
