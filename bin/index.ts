import path from "node:path";
import express from "express";
import logger from "morgan";
import compression from 'compression';
import auth from "../lib/access/middleware";
import findServices from "../lib/rpc/middleware"

/**
 * Enviroment variables
 */
const {
    NODE_ENV = "development",
    PORT = "3000",
    DATABASEURI = "postgresql://postgres:mypassword@localhost",
    AGAPE_SECRET = import.meta.filename,
    AGAPE_ADMIN = "admin",
    AGAPE_PASSWORD = "admin"
} = process.env;

const dev = NODE_ENV === "development";

/**
 * Vite Build
 * SPA React application
 */
const buildPath = path.resolve('build');
const spaEntry = path.resolve("build/index.html");


const app = express();

// Aplicamos configuracines que unicamente esta disponibles durante el desarrollo, as dependecias externas se importan con
// dinamic import ya que no estaran instalaran en produccion;
if (dev) {
    const { default: cors } = await import("cors");

    const corsOptions = {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,            // si necesitas cookies o auth
    };

    // Aplica CORS globalmente
    app.use(cors(corsOptions));

    app.get("/express", (req, res) => {
        res.send("express")
    })
}


app.use(logger(dev ? "dev" : "common"));

app.use(auth({
    sameSite: true,
    secret: AGAPE_SECRET,
    admin: {
        username: AGAPE_ADMIN,
        password: AGAPE_PASSWORD
    }
}));

app.use(await findServices());


app.use(compression());

// Serve JavaScript/CSS/images with long cache (1 year)
app.use(
    express.static(buildPath, {
        // maxAge acepta milisegundos o string parseable (“1d”, “1y”)
        maxAge: '1y',
        // Si tus assets están versionados en el nombre, puedes desactivar ETag
        etag: false,
        // Ya no necesitas last‑modified si los archivos cambian de nombre al build
        lastModified: false,
    })
)

// Para atrapar **todas** las rutas que no sean assets
// y devolver index.html (SPA fallback), usando un catch‑all válido:
// Para index.html (o el entry point) es mejor no cachearlo a 1 año:
app.get(/.*/, (_req, res) => {
    res.sendFile(spaEntry);
})

app.listen(3000, () => console.log("Backend Server: running at port 3000"))

