/**
 * Service Contract: Global Chat
 *
 * Contract for the public chat socket namespace.
 * The actual implementation lives in backend/services/chat.ts.
 */

import { socketContract } from "./contract";

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
export type ChatEvents = {
  /** Client sends a message to the server */
  "message:send": { text: string; sender: string };
  /** Server broadcasts message to all clients */
  "message:received": ChatMessage;
  /** Client notifies they are typing */
  "user:typing": { sender: string };
  /** Client notifies they stopped typing */
  "user:typing:stop": { sender: string };
  /** Internal: socket connected */
  "socket:connect": Record<string, never>;
  /** Internal: socket disconnected */
  "socket:disconnect": Record<string, never>;
  /** Server broadcasts current online users count */
  "users:count": { count: number };
};

const socket = socketContract<ChatEvents>();
export default socket;
