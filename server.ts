/**
 * Custom Next.js Server with Express RPC + Socket.IO
 *
 * Uses Express as middleware layer to handle:
 * - RPC endpoints (MessagePack, multipart) via existing middleware
 * - Auth (login, logout, session) via security middleware
 * - Socket.IO for real-time communication
 *
 * Next.js handles all page rendering and static assets.
 */

import http from "node:http";
import express from "express";
import next from "next";
import logger from "#lib/log/logger";
import { CacheManager } from "#lib/infrastructure/CacheManager";
import initDatabase from "#lib/db";
import AzureBlobStorage from "#lib/infrastructure/AzureBlobStorage";
import hashString from "#lib/hashString";
import {
  IsDevelopment,
  PORT,
  CACHE_URL,
  AGAPE_SECRET,
  DATABASE_URI,
  AGAPE_ADMIN,
  AGAPE_PASSWORD,
  AGAPE_TENANT,
  NODE_ENV,
  AZURE_CONNECTION_STRING,
  AGAPE_CDN_HOST,
} from "./bin/env";

// ============================================================================
// Infrastructure Initialization
// ============================================================================

await initDatabase(DATABASE_URI, {
  env: NODE_ENV,
  tenant: AGAPE_TENANT,
  rootUser: {
    username: AGAPE_ADMIN,
    password: AGAPE_PASSWORD,
  },
});

await AzureBlobStorage.connect(
  AZURE_CONNECTION_STRING,
  hashString(AGAPE_TENANT),
  AGAPE_CDN_HOST,
);

await CacheManager.init(CACHE_URL).connect();

// ============================================================================
// Express + RPC Middleware
// ============================================================================

const expressApp = express();

// RPC middleware (auto-discovers services, handles MessagePack requests)
// Only intercepts requests with Accept: application/msgpack + multipart content-type
// All other requests fall through to Next.js
await import("#lib/rpc/middleware").then(({ default: rpcMiddleware }) => {
  expressApp.use(rpcMiddleware);
  logger.scope("RPC").info("RPC middleware initialized");
});

// ============================================================================
// Next.js
// ============================================================================

const dev = IsDevelopment;
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

await nextApp.prepare();

// Fallback: everything not handled by Express goes to Next.js
expressApp.all(/.*/, (req, res) => {
  handle(req, res);
});

const httpServer = http.createServer(expressApp);

// ============================================================================
// Socket.IO
// ============================================================================

const socketOptions = {
  redisUrl: CACHE_URL,
  jwtSecret: AGAPE_SECRET,
};

await import("#lib/socket").then(({ default: createSocketServer }) => {
  createSocketServer(httpServer, socketOptions);
  logger.scope("Socket").info("Socket.IO server initialized");
});

// ============================================================================
// Start Server
// ============================================================================

httpServer.listen(PORT, () => {
  logger.scope("Server").info(`Server started on http://localhost:${PORT}`);
});
