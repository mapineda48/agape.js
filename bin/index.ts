import path from "node:path";
import express from "express";
import morgan from "morgan";
import compression from 'compression';
import auth from "../lib/access/middleware";
import findServices from "../lib/rpc/middleware";
import initDatabase from "#lib/db";
import logger from "#logger";

/**
 * Environment variables
 */
const {
  NODE_ENV = import.meta.filename.endsWith(".ts") ? "development" : "test",
  PORT = "3000",
  DATABASE_URI = "postgresql://postgres:mypassword@localhost",
  AGAPE_TENANT = "demo",
  AGAPE_SECRET = import.meta.filename,
  AGAPE_ADMIN = "admin",
  AGAPE_PASSWORD = "admin"
} = process.env;

const isProduction = NODE_ENV === "production";
const isTest = NODE_ENV === "test";
const isDevelopment = NODE_ENV === "development";

/**
 * Database connection
 */
await initDatabase(DATABASE_URI, `${AGAPE_TENANT}_${NODE_ENV}`, isDevelopment);

await import("#lib/db/admin").then(mod => mod.default(AGAPE_ADMIN, AGAPE_PASSWORD));

/**
 * Vite build / SPA React application
 */
const buildPath = path.resolve('www');
const spaEntry = path.resolve("www/index.html");

const app = express();

// Development-only middleware
if (isDevelopment) {
  const { default: cors } = await import("cors");

  const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };

  app.use(cors(corsOptions));

  app.get("/express", (_req, res) => {
    res.send("express");
  });
}

// HTTP request logging
app.use(morgan(isDevelopment ? "dev" : "common"));

// Authentication middleware
app.use(
  auth({
    sameSite: true,
    secret: AGAPE_SECRET,
    admin: {
      username: AGAPE_ADMIN,
      password: AGAPE_PASSWORD,
    },
  })
);

// RPC services middleware
app.use(await findServices());

// Response compression
app.use(compression());

// Static asset serving with long cache
app.use(
  express.static(buildPath, {
    maxAge: '1y',
    etag: false,
    lastModified: false,
  })
);

// SPA fallback
app.get(/.*/, (_req, res) => {
  res.sendFile(spaEntry);
});

// Start server
app.listen(parseInt(PORT), () => {
  logger.log(
    `[server] Backend Server: running at port ${PORT} | Env: ${NODE_ENV}`
  );
});
