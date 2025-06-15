import express from "express";
import morgan from "morgan";
import path from "node:path";
import compression from "compression";
import logger from "#lib/log/logger";
import initDatabase from "#lib/db";
import AzureBlobStorage from "#lib/services/storage/AzureBlobStorage";

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
 * Es importante realizar la sincronizacion de la base de datos con el antes de cualquier logica que dependa de los modelos del ORM para el funcionamiento de multitenat
 */
await initDatabase(DATABASE_URI, `${AGAPE_TENANT}_${NODE_ENV}`, isDevelopment);


/**
 * Sincronizamos el usuario administrador
 */
await import("#lib/db/admin").then(({ verifyRootUser }) => verifyRootUser(AGAPE_ADMIN, AGAPE_PASSWORD));


/**
 * Storage
 */
await AzureBlobStorage.connect(AZURE_CONNECTION_STRING, AGAPE_TENANT, isProduction);


const app = express();

// Middleware para leer buffer crudo
app.use(express.raw({ type: 'application/msgpack', limit: "5mb" }));

app.use(morgan(isDevelopment ? "dev" : "common"));

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


// Es importante realizar el dinamic import dado que es necesario que la base de datos este sincronizada con el ORM para el correcto funcionamiento
const { default: auth } = await import("#lib/access/middleware");
const { default: findServices } = await import("#lib/rpc/middleware")

// RPC services middleware
app.use(await findServices());

app.use(auth(AGAPE_SECRET));



/**
 * Vite build / SPA React application
 */
const buildPath = path.resolve('web');
const spaEntry = path.resolve("web/index.html");


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


/**
 * Listen server app
 */
app.listen(parseInt(PORT), () => {
    logger.log(
        `[server] Backend Server: running at port ${PORT} | Env: ${NODE_ENV}`
    );
});