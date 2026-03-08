import fs from "node:fs";
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
};

await import("#lib/socket").then(({ default: createSocketServer }) => {
  createSocketServer(httpServer, socketOptions);
  logger.scope("Socket").info("Socket.IO server initialized");
});

// SSR middleware (works in both dev and prod)
const { createSSRMiddleware } = await import("#lib/ssr/middleware");

if (IsDevelopment) {
  // Development: embed Vite dev server as middleware (single process, no CORS needed)
  const { createServer: createViteServer } = await import("vite");

  const viteDevServer = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom", // We handle HTML serving ourselves for SSR
  });

  logger.scope("Server").info("Vite dev server running in middleware mode");

  // Vite middleware handles static assets and HMR
  app.use(viteDevServer.middlewares);

  // SSR middleware intercepts SSR pages (after Vite serves static assets)
  app.use(createSSRMiddleware({ vite: viteDevServer }));

  // SPA fallback for non-SSR pages (appType: "custom" doesn't serve index.html)
  app.use(async (req, res, next) => {
    if (req.method !== "GET") return next();
    const url = req.originalUrl;
    if (url.startsWith("/api/") || url.includes(".")) return next();

    try {
      const rawHtml = fs.readFileSync(path.resolve("web/index.html"), "utf-8");
      const html = await viteDevServer.transformIndexHtml(url, rawHtml);
      res.setHeader("Content-Type", "text/html");
      res.status(200).end(html);
    } catch (error) {
      next(error);
    }
  });
} else {
  // Path to frontend Vite build output
  const frontendRoot = path.resolve("web/www");
  const indexHtml = path.resolve("web/index.html");

  // Enable GZIP compression for responses
  app.use(compression());

  // Serve static frontend assets with aggressive caching
  // Vite includes content hash in filenames, safe to cache for 1 year
  // HTML files are excluded from immutable caching (they change between deployments)
  app.use(
    express.static(frontendRoot, {
      setHeaders(res, filePath) {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "public, max-age=0");
        } else {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  // SSR middleware for server-rendered pages
  app.use(createSSRMiddleware({}));

  // Fallback to SPA entrypoint (for client-side routing)
  app.get(/.*/, (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=0");
    res.sendFile(indexHtml);
  });
}

httpServer.listen(PORT, () => {
  logger.scope("Server").info(`Server started on port ${PORT}`);
});
