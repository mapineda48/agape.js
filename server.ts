import express from "express";
import next from "next";
import prepareBackend from "./lib";
import models from "./models";

const {
    NODE_ENV,
    PORT = "3000",
    DATABASEURI = "postgresql://postgres:mypassword@localhost",
    AGAPE_SECRET = __filename,
    AGAPE_ADMIN = "admin",
    AGAPE_PASSWORD = "admin" 
} = process.env;

const port = parseInt(PORT, 10);
const dev = __filename.endsWith("server.ts");
const web = next({ dev });
const log = `> Server listening at http://localhost:${PORT} as ${dev ? "development" : NODE_ENV}`;

(async () => {
    await models.Init(DATABASEURI, dev);

    const service = await prepareBackend({
        secret: AGAPE_SECRET,
        admin: {
            username: AGAPE_ADMIN, 
            password: AGAPE_PASSWORD
        }
    });

    await web.prepare();
    const www = web.getRequestHandler();

    const app = express();

    app.use(service);
    app.use((req, res) => www(req, res));

    app.listen(port, () => console.log(log));
})().catch((err) => {
    throw err;
});