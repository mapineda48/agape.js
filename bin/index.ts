import path from "node:path";
import express from "express";
import morgan from "morgan";
import compression from 'compression';
import initDatabase from "#lib/db";
import logger from "#logger";
import { BlobStorage } from "#lib/storage";

/**
 * Environment variables
 */
const {
  PORT = "3000",
  AGAPE_TENANT = "demo",
  AGAPE_SECRET = import.meta.filename,
  AGAPE_ADMIN = "admin",
  AGAPE_PASSWORD = "admin",
  NODE_ENV = import.meta.filename.endsWith(".ts") ? "development" : "test",
  DATABASE_URI = "postgresql://postgres:mypassword@localhost",
  AZURE_CONNECTION_STRING = "UseDevelopmentStorage=true"
} = process.env;

const isProduction = NODE_ENV === "production";
const isTest = NODE_ENV === "test";
const isDevelopment = NODE_ENV === "development";

/**
 * Database connection
 */
await initDatabase(DATABASE_URI, `${AGAPE_TENANT}_${NODE_ENV}`, isDevelopment);

await import("#lib/db/admin").then(({ verifyRootUser }) => verifyRootUser(AGAPE_ADMIN, AGAPE_PASSWORD));


/**
 * Storage
 */
await BlobStorage.connect(AZURE_CONNECTION_STRING, AGAPE_TENANT);

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


// Es importante realizar el dinamic import dado que es necesario que la base de datos este sincronizada con el ORM para el correcto funcionamiento
const { default: auth } = await import("#lib/access/middleware");
const { default: findServices } = await import("#lib/rpc/middleware")

// Authentication middleware
app.use(auth(AGAPE_SECRET));

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
