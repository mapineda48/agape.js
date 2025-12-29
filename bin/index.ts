import path from "node:path";
import http from "node:http";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import initDatabase from "#lib/db";
import bridge from "#lib/bridge/middleware";
import logger from "#lib/log/logger";
import AzureBlobStorage from "#lib/services/storage/AzureBlobStorage";
import hashString from "#lib/hashString";
import { CacheManager } from "#lib/services/cache/CacheManager";
import MailManager from "#lib/services/mail/MailManager";

// Load environment variables with default fallbacks (should be overridden in production via env or secrets manager)
const {
  NODE_ENV = import.meta.filename.endsWith(".ts") ? "development" : "test",
  PORT = "3000",

  AGAPE_HOOK = "admin",
  AGAPE_SECRET = import.meta.filename,
  AGAPE_ADMIN = "admin",
  AGAPE_PASSWORD = "admin",
  AGAPE_TENANT = import.meta.filename.endsWith(".ts") ? "agape_app_development_demo" : "agape_app_test_demo",
  AGAPE_CDN_HOST = "http://127.0.0.1:10000",

  DATABASE_URI = "postgresql://postgres:mypassword@localhost",
  AZURE_CONNECTION_STRING = "UseDevelopmentStorage=true",
  CACHE_URL = "redis://localhost:6379",
  RESEND_API_KEY,

} = process.env;

const isProduction = NODE_ENV === "production";
const isDevelopment = NODE_ENV === "development";

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
  AGAPE_CDN_HOST
);

// Initialize cache backend (e.g., Redis)
await CacheManager.init(CACHE_URL).connect();

// Initialize mail service (optional - if RESEND_API_KEY is not set, mail will be disabled)
MailManager.init(RESEND_API_KEY);

const app = express();
const httpServer = http.createServer(app);

app.use(bridge(AGAPE_HOOK));

// HTTP request logging
app.use(morgan(isDevelopment ? "dev" : "common"));

// Support for raw MsgPack content
app.use(express.raw({ type: "application/msgpack", limit: "5mb" }));

// Production-specific settings
if (isProduction) {
  // Allow Express to trust headers from Nginx reverse proxy
  // Required for req.ip, req.protocol, req.secure to work correctly
  app.set("trust proxy", 1);
}


// Development-only settings (e.g., CORS for Vite dev server)
if (isDevelopment) {
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
const { default: auth } = await import("#lib/access/middleware");
const { default: rpc } = await import("#lib/rpc/middleware");
const { default: createSocketServer } = await import("#lib/socket");


app.use(auth(AGAPE_SECRET));
app.post("/*path", rpc);

// Initialize Socket.IO server with Redis adapter for horizontal scaling
const socketOptions = {
  redisUrl: CACHE_URL,
  jwtSecret: AGAPE_SECRET,
  ...(isDevelopment && { cors: { origin: "http://localhost:5173", credentials: true } }),
};
await createSocketServer(httpServer, socketOptions);
logger.scope("Socket").info("Socket.IO server initialized");

if (!isDevelopment) {
  // Path to frontend Vite build output
  const frontendRoot = path.resolve("web/www");
  const indexHtml = path.resolve("web/index.html");

  // Enable GZIP compression for responses (backup for nginx)
  app.use(compression());

  // Serve static frontend assets
  // Note: Cache headers are handled by nginx in production
  app.use(express.static(frontendRoot));

  // Fallback to SPA entrypoint (for client-side routing)
  app.get(/.*/, (_req, res) => {
    res.sendFile(indexHtml);
  });
}

httpServer.listen(PORT, () => {
  logger.scope("Server").info(`Listening at port ${PORT}`);
});
