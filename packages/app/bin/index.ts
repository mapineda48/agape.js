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
} from "./env.js";

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
  app.set("trust proxy", 1);

  // Remove X-Powered-By header (security: don't expose server info)
  app.disable("x-powered-by");
}

/**
 * Initialize RPC system via @mapineda48/agape-rpc facade
 */
import { initRpc, type AuthPayload } from "@mapineda48/agape-rpc/server/index";
import { runContext, type IContext } from "#lib/context";
import { validateEndpointPermission } from "#lib/rpc/rbac/authorization";

const servicesDir = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../services",
);

const rpc = await initRpc(servicesDir, {
  runContext: runContext as <T>(ctx: unknown, callback: () => T | Promise<T>) => T | Promise<T>,
  createContext: (authPayload?: AuthPayload) => {
    const context: IContext = authPayload
      ? {
          id: authPayload.id,
          tenant: authPayload.tenant,
          permissions: authPayload.permissions,
          session: new Map(),
          source: "http",
        }
      : {
          id: 0,
          tenant: "",
          permissions: [],
          session: new Map(),
          source: "http",
        };
    return context;
  },
  permissionValidator: validateEndpointPermission,
  logger: {
    error: (...args: unknown[]) => logger.scope("RPC").error(args.map(String).join(" ")),
    warn: (...args: unknown[]) => logger.scope("RPC").warn(args.map(String).join(" ")),
  },
});

app.use(rpc.middleware);

// Initialize Socket.IO server with Redis adapter for horizontal scaling
const socketOptions = {
  redisUrl: CACHE_URL,
  jwtSecret: AGAPE_SECRET,
  discovery: rpc.discovery,
};

await import("#lib/socket").then(({ default: createSocketServer }) => {
  createSocketServer(httpServer, socketOptions);
  logger.scope("Socket").info("Socket.IO server initialized");
});

if (IsDevelopment) {
  // Development: import frontend facades (Vite dev server, SSR middleware)
  const { createViteServer, createSSRMiddleware, frontendPkgRoot } =
    await import("@mapineda48/agape-web/server");

  const viteDevServer = await createViteServer();

  logger.scope("Server").info("Vite dev server running in middleware mode");

  // Vite middleware handles static assets and HMR
  app.use(viteDevServer.middlewares);

  // SSR middleware intercepts SSR pages (after Vite serves static assets)
  app.use(
    createSSRMiddleware({ vite: viteDevServer, frontendRoot: frontendPkgRoot }),
  );

  // SPA fallback for non-SSR pages (appType: "custom" doesn't serve index.html)
  app.use(async (req, res, next) => {
    if (req.method !== "GET") return next();
    const url = req.originalUrl;
    if (url.startsWith("/api/") || url.includes(".")) return next();

    try {
      const rawHtml = fs.readFileSync(
        path.resolve(frontendPkgRoot, "index.html"),
        "utf-8",
      );
      const html = await viteDevServer.transformIndexHtml(url, rawHtml);
      res.setHeader("Content-Type", "text/html");
      res.status(200).end(html);
    } catch (error) {
      next(error);
    }
  });
} else {
  // Production: resolve web assets and SSR middleware from @mapineda48/agape-web
  const { wwwRoot, indexHtml, distRoot } = await import(
    "@mapineda48/agape-web/paths"
  );
  const { createSSRMiddleware } = await import("@mapineda48/agape-web/server");

  // Enable GZIP compression for responses
  app.use(compression());

  // Serve static frontend assets with aggressive caching
  app.use(
    express.static(wwwRoot, {
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
  app.use(createSSRMiddleware({ frontendRoot: distRoot }));

  // Fallback to SPA entrypoint (for client-side routing)
  app.get(/.*/, (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=0");
    res.sendFile(indexHtml);
  });
}

httpServer.listen(PORT, () => {
  logger.scope("Server").info(`Server started on port ${PORT}`);
});
