import path from "node:path";
import express from "express";
import cors from "cors";
import logger from "morgan";
import findServices from "../lib/rpc"
import foo from "../lib/rpc/foo"

const buildPath = path.resolve('build');
const spaEntry = path.resolve("build/index.html");

console.log(foo);

const app = express();

app.use(logger("dev"))
app.use(express.json());

// Sólo permitimos el origen de tu frontend en Vitee
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,            // si necesitas cookies o auth
};

// Aplica CORS globalmente
app.use(cors(corsOptions));

findServices().then(service => {
    app.use(service);

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
}
).catch(console.error)