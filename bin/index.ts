import http from "node:http";
import express from "express";
import morgan from "morgan";
import rpcMiddleware from "#lib/rpc/middleware";
import logger from "#lib/log/logger";
import { CacheManager } from "#lib/infrastructure/CacheManager";
import createSocketServer from "#lib/socket";
import { DEVELOPMENT, PORT, CACHE_URL, AGAPE_SECRET } from "./env";

// Initialize cache backend (e.g., Redis)
await CacheManager.init(CACHE_URL).connect();

const app = express();
const httpServer = http.createServer(app);

// HTTP request logging
app.use(morgan(DEVELOPMENT ? "dev" : "common"));

// Development-only settings (e.g., CORS for Vite dev server)
if (DEVELOPMENT) {
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

// RPC middleware
app.use(rpcMiddleware);

// Initialize Socket.IO server with Redis adapter for horizontal scaling
const socketOptions = {
  redisUrl: CACHE_URL,
  jwtSecret: AGAPE_SECRET,
  ...(DEVELOPMENT && {
    cors: { origin: "http://localhost:5173", credentials: true },
  }),
};
await createSocketServer(httpServer, socketOptions);
logger.scope("Socket").info("Socket.IO server initialized");

httpServer.listen(PORT, () => {
  logger.scope("Server").info(`Server started on port ${PORT}`);
});
