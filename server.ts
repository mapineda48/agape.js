import express from "express";
import next from "next";
import prepareBackend from "./lib";


const port = parseInt(process.env.PORT || "3000", 10);
const dev = __filename.endsWith("server.ts");
const web = next({ dev });
const log = `> Server listening at http://localhost:${port} as ${dev ? "development" : process.env.NODE_ENV}`;

(async () => {
    const service = await prepareBackend({
        secret: __filename,
        admin: {
            username: "admin", password: "admin"
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