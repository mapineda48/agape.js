// Express-based backend entry point for Agape application
// This file sets up the Express server, middleware, environment, storage, and database for production-ready deployment

import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import compression from "compression";
import logger from "#lib/log/logger";
import initDatabase from "#lib/db";
import AzureBlobStorage from "#lib/services/storage/AzureBlobStorage";
import CacheMananger from "#lib/services/cache/CacheManager";

// Load environment variables with default fallbacks (should be overridden in production via env or secrets manager)
const {
    NODE_ENV = import.meta.filename.endsWith(".ts") ? "development" : "test",
    PORT = "3000",

    AGAPE_TENANT = "demo",
    AGAPE_SECRET = import.meta.filename,
    AGAPE_ADMIN = "admin",
    AGAPE_PASSWORD = "admin",
    AGAPE_CDN_HOST = "http://127.0.0.1:10000",

    DATABASE_URI = "postgresql://postgres:mypassword@localhost",
    AZURE_CONNECTION_STRING = "UseDevelopmentStorage=true",
    CACHE_URL = "redis://localhost:6379"
} = process.env;

const isProduction = NODE_ENV === "production";
const isTest = NODE_ENV === "test";
const isDevelopment = NODE_ENV === "development";

// Initialize DB connection and models (required before importing model-dependent logic like auth)
await initDatabase(DATABASE_URI, `${AGAPE_TENANT}_${NODE_ENV}`, isDevelopment);

// Ensure admin/root user exists for management access
await import("#lib/db/admin").then(({ verifyRootUser }) => verifyRootUser(AGAPE_ADMIN, AGAPE_PASSWORD));

// Initialize storage backend (e.g., Azure Blob or development emulator)
const blobStorageHost = await AzureBlobStorage.connect(AZURE_CONNECTION_STRING, AGAPE_TENANT, AGAPE_CDN_HOST);

await CacheMananger.init(CACHE_URL);

const app = express();

// Development-only settings (e.g., CORS for Vite dev server)
if (isDevelopment) {
    const { default: cors } = await import("cors");

    app.use(cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }));

    // Simple test endpoint to verify Express is running
    app.get("/express", (req, res) => { res.send("express") });
}

// Production-specific security hardening
if (isProduction) {
    // Allow Express to trust headers from Nginx or reverse proxies
    app.set("trust proxy", 1);

    // Enable Helmet with secure Content Security Policy (CSP)
    app.use(helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "img-src": [
                    ...helmet.contentSecurityPolicy.getDefaultDirectives()["img-src"],
                    "blob:",
                    blobStorageHost
                ]
            }
        }
    }));

    // Enable Permissions-Policy for restricting sensitive browser APIs
    app.use((_req, res, next) => {
        res.setHeader("Permissions-Policy", "geolocation=(self), camera=(self), microphone=(self), fullscreen=(self)");
        next();
    });
}

// Support for raw MsgPack content
app.use(express.raw({ type: "application/msgpack", limit: "5mb" }));

// HTTP request logging
app.use(morgan(isDevelopment ? "dev" : "common"));

// Dynamic imports of auth and RPC middleware (must happen after DB is ready)
const { default: authMiddleware } = await import("#lib/access/middleware");
const { default: serviceRouter } = await import("#lib/rpc/middleware");

// Inject dynamic service handlers (auto-routed RPC)
app.use(await serviceRouter());

// Authenticate requests using Agape middleware (based on AGAPE_SECRET)
app.use(authMiddleware(AGAPE_SECRET));

// Path to frontend Vite build output
const frontendRoot = path.resolve("web/www");
const indexHtml = path.resolve("web/index.html");

// Enable GZIP compression for all responses
app.use(compression());

// Serve static frontend assets with long cache headers
app.use(express.static(frontendRoot, {
    maxAge: "1y",
    etag: false,
    lastModified: false
}));

// Fallback to SPA entrypoint (for client-side routing)
app.get(/.*/, (_req, res) => {
    res.sendFile(indexHtml);
});

// Start the server
app.listen(parseInt(PORT), () => {
    logger.log(`[server] Backend Server running at port ${PORT} | Env: ${NODE_ENV}`);
});
