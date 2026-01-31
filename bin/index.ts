import http from "node:http";
import path from "node:path";
import express from "express";
import morgan from "morgan";
import compression from "compression";
import logger from "#lib/log/logger";
import { CacheManager } from "#lib/infrastructure/CacheManager";
import initDatabase from "#lib/db";
import AzureBlobStorage from "#lib/infrastructure/AzureBlobStorage";
import hashString from "#lib/hashString";
import {
  IsDevelopment,
  IsProduction,
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
} from "./env";

// Initialize DB connection and models (required before importing model-dependent logic like auth)
await initDatabase(DATABASE_URI, {
  env: NODE_ENV,
  tenant: AGAPE_TENANT,
  rootUser: {
    username: AGAPE_ADMIN,
    password: AGAPE_PASSWORD,
  },
});

// Initialize storage backend (e.g., Azure Blob or development emulator)
await AzureBlobStorage.connect(
  AZURE_CONNECTION_STRING,
  hashString(AGAPE_TENANT),
  AGAPE_CDN_HOST,
);

// Initialize cache backend (e.g., Redis)
await CacheManager.init(CACHE_URL).connect();

const app = express();
const httpServer = http.createServer(app);

// HTTP request logging
app.use(morgan(IsDevelopment ? "dev" : "common"));

// Production-specific settings
if (IsProduction) {
  // Allow Express to trust headers from Nginx reverse proxy
  // Required for req.ip, req.protocol, req.secure to work correctly
  app.set("trust proxy", 1);

  // Remove X-Powered-By header (security: don't expose server info)
  app.disable("x-powered-by");
}

// Development-only settings (e.g., CORS for Vite dev server)
if (IsDevelopment) {
  const { default: cors } = await import("cors");

  logger.scope("Server").info("Enabled CORS for http://localhost:5173");

  const corsConfig = cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204, // OK para preflight
  });

  app.use(corsConfig);

  // Simple test endpoint to verify Express is running
  app.get("/express", (req, res) => {
    res.send("express");
  });
}

/**
 * Dynamic imports for middleware after the database is initialized
 * Importing middleware before the database is initialized will throw an error
 */

// RPC middleware
await import("#lib/rpc/middleware").then(({ default: rpcMiddleware }) => {
  app.use(rpcMiddleware);
});

// Initialize Socket.IO server with Redis adapter for horizontal scaling
const socketOptions = {
  redisUrl: CACHE_URL,
  jwtSecret: AGAPE_SECRET,
  ...(IsDevelopment && {
    cors: { origin: "http://localhost:5173", credentials: true },
  }),
};

await import("#lib/socket").then(({ default: createSocketServer }) => {
  createSocketServer(httpServer, socketOptions);
  logger.scope("Socket").info("Socket.IO server initialized");
});

if (!IsDevelopment) {
  // Path to frontend Vite build output
  const frontendRoot = path.resolve("web/www");
  const indexHtml = path.resolve("web/index.html");

  // Enable GZIP compression for responses
  app.use(compression());

  // Serve static frontend assets with aggressive caching
  // Vite includes content hash in filenames, safe to cache for 1 year
  app.use(
    express.static(frontendRoot, {
      maxAge: "1y",
      immutable: true,
    }),
  );

  // Fallback to SPA entrypoint (for client-side routing)
  app.get(/.*/, (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=0");
    res.sendFile(indexHtml);
  });
}

httpServer.listen(PORT, () => {
  logger.scope("Server").info(`Server started on port ${PORT}`);
});
