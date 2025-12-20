/**
 * Demo Socket Module
 *
 * Example socket module demonstrating the Socket.IO RPC pattern.
 * Import from frontend: import demoSocket from "@agape/demo/socket";
 */

// ============================================================================
// Events (Server → Client)
// ============================================================================

/**
 * Events that the server can emit to connected clients.
 * These are typed stubs - the actual implementation is on the server.
 */
export const events = {
    /** Emitted when a new message is received */
    onMessage: (data: { id: string; text: string; timestamp: Date }) => { },
    /** Emitted when connection status changes */
    onStatusChange: (status: "connected" | "disconnected" | "reconnecting") => { },
};

// ============================================================================
// RPC Methods (Client → Server)
// ============================================================================

import { getSocketServer, emitToNamespace } from "#lib/socket/handler";

/**
 * Sends a message through the socket.
 */
export async function sendMessage(text: string): Promise<{ id: string; timestamp: Date }> {
    const id = `msg-${Date.now()}`;
    const timestamp = new Date();

    // Broadcast to all clients in this namespace
    const io = getSocketServer();
    emitToNamespace(io, "/demo", "onMessage", { id, text, timestamp });

    return { id, timestamp };
}

/**
 * Gets the current connection count for this namespace.
 */
export async function getConnectionCount(): Promise<number> {
    // This is a demo - in real implementation you'd use io.of("/demo").sockets.size
    return 1;
}

/**
 * Pings the server and returns the round-trip time.
 */
export async function ping(): Promise<{ pong: true; serverTime: Date }> {
    return {
        pong: true,
        serverTime: new Date(),
    };
}
