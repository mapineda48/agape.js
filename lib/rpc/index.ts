/**
 * RPC Module
 *
 * A custom Remote Procedure Call (RPC) system for Express.js that enables
 * type-safe communication between frontend and backend using MessagePack
 * for efficient binary serialization.
 *
 * ## Architecture Overview
 *
 * ### Server Side (lib/rpc/)
 * - **middleware.ts**: Express router that auto-registers RPC endpoints
 * - **parseArgs.ts**: Parses MessagePack and multipart form requests
 * - **error.ts**: Normalizes database and application errors
 * - **path.ts**: Utilities for service discovery and URL generation
 *
 * ### Client Side (via Vite Plugin)
 * - **vite-plugin.ts**: Vite plugin providing virtual modules
 * - **virtual-module.ts**: Generates client RPC stubs
 *
 * ## Usage
 *
 * ### Server Registration
 * ```typescript
 * import rpc from "@/lib/rpc/middleware";
 * app.use("/api", rpc);
 * ```
 *
 * ### Frontend Import
 * ```typescript
 * import { getUsers, createUser } from "@agape/users";
 * ```
 *
 * @module lib/rpc
 */

// Re-export the main middleware for server-side use
export { default } from "./middleware";

// Re-export types for external use
export type { DatabaseError, UploadedFile, UploadedFileMetadata } from "./types";

// Re-export constants for configuration
export { CONTENT_TYPES, HTTP_STATUS, VIRTUAL_MODULE_NAMESPACE } from "./constants";
