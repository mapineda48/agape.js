import path from "node:path";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import initDatabase from "#lib/db";
import auth from "#lib/access/middleware";
import rpc from "#lib/rpc/middleware";
import { verifyRootUser } from "#lib/db/root";
import bridge from "#lib/bridge/middleware";

// Load environment variables with default fallbacks (should be overridden in production via env or secrets manager)
const {
    NODE_ENV = import.meta.filename.endsWith(".ts") ? "development" : "test",
    PORT = "3000",

    AGAPE_HOOK = "admin",
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
await initDatabase(DATABASE_URI, isDevelopment);

await verifyRootUser(AGAPE_ADMIN, AGAPE_PASSWORD);

const app = express();

app.use(bridge(AGAPE_HOOK));

// HTTP request logging
app.use(morgan(isDevelopment ? "dev" : "common"));

// Support for raw MsgPack content
app.use(express.raw({ type: "application/msgpack", limit: "5mb" }));

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
                    "blob:"
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

app.use(auth(AGAPE_SECRET));
app.use(rpc);

if (!isDevelopment) {
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
}

app.listen(3000, () => {
    console.log(`listeng at port 3000`)
})