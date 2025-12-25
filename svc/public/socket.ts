/**
 * Public Socket Namespace
 *
 * Provides real-time communication for public-facing features
 * that don't require authentication.
 *
 * @example
 * // Client usage:
 * import socket from "@agape/public/socket";
 *
 * const connection = socket.connect();
 *
 * connection.on("user:created", ({ id, name }) => {
 *     console.log(`New user: ${name} (${id})`);
 * });
 */

import { registerNamespace } from "#lib/socket/namespace";

// ============================================================================
// Event Types
// ============================================================================

/**
 * Events emitted by this socket namespace.
 * Define the payload structure for each event.
 */
type ServerEvents = {
    /** Emitted when a new user is created */
    "user:created": { id: string; name: string };
};

// ============================================================================
// Namespace Export
// ============================================================================

export default registerNamespace<ServerEvents>();