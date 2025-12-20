/**
 * Socket.IO RPC Module
 *
 * A custom Socket.IO RPC system that enables type-safe real-time
 * communication between frontend and backend using MessagePack
 * for efficient binary serialization.
 *
 * ## Architecture Overview
 *
 * ### Server Side (lib/socket/)
 * - **handler.ts**: Socket.IO server that auto-registers namespace handlers
 * - **path.ts**: Utilities for socket discovery and namespace generation
 * - **types.ts**: Type definitions for contracts
 *
 * ### Client Side (via Vite Plugin)
 * - Uses same @agape/* namespace with /socket suffix
 * - Generates typed Socket.IO client stubs
 *
 * ## Usage
 *
 * ### Service Definition (svc/notifications/socket.ts)
 * ```typescript
 * // Events the server can emit to clients
 * export const events = {
 *   onNewNotification: (data: NotificationDTO) => {},
 *   onUserStatusChange: (data: UserStatus) => {},
 * };
 *
 * // Methods clients can call (RPC)
 * export async function markAsRead(notificationId: string): Promise<boolean> {
 *   // implementation
 * }
 *
 * export async function getUnreadCount(): Promise<number> {
 *   // implementation
 * }
 * ```
 *
 * ### Frontend Import
 * ```typescript
 * import notificationSocket from "@agape/notifications/socket";
 *
 * const { disconnect, on, markAsRead } = notificationSocket.connect();
 * on("onNewNotification", (data) => console.log(data));
 * await markAsRead("123");
 * disconnect();
 * ```
 *
 * @module lib/socket
 */

// Re-export types for external use
export type {
    EventMap,
    MethodMap,
    SocketContract,
    SocketClient,
    ConnectedSocket,
    SocketModuleExport,
} from "./types";

// Re-export utilities
export { isSocketContract } from "./types";

// Re-export constants
export { SOCKET_FILE_SUFFIX, RPC_METHOD_PREFIX } from "./constants";

// Re-export path utilities
export { toNamespace, toPublicUrl, sockets, cwd } from "./path";
