/**
 * Public Socket Namespace: Global Chat
 *
 * Provides real-time communication for a public global chat.
 * Broadcasts messages to all connected clients without persistence.
 */

import { registerNamespace } from "#lib/socket/namespace";

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
};

// ============================================================================
// Namespace Export & Logic
// ============================================================================

const socket = registerNamespace<ChatEvents>();

// Handle incoming chat messages
socket.on("message:send", (payload) => {
    // Broadcast the message back to all clients
    socket.emit("message:received", {
        id: Math.random().toString(36).substring(2, 11),
        text: payload.text,
        sender: payload.sender,
        timestamp: Date.now(),
    });
});

export default socket;