/**
 * Public Socket Namespace: Global Chat
 *
 * Provides real-time communication for a public global chat.
 * Broadcasts messages to all connected clients without persistence.
 */

import { registerNamespace } from "#lib/socket/namespace";
import { CacheManager } from "#lib/infrastructure/CacheManager";
import logger from "#lib/log/logger";
import type { ConnectedSocket } from "@mapineda48/agape/socket";
import type { ChatEvents } from "@mapineda48/agape/services/chat";

export type { ChatMessage, ChatEvents } from "@mapineda48/agape/services/chat";

// ============================================================================
// Namespace Export & Logic
// ============================================================================

/**
 * Public chat namespace - no authentication required.
 * @public
 */
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
