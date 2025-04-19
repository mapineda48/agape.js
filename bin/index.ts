import express from "express";
import cors from "cors";
import logger from "morgan";
import findServices from "../lib/rpc"
import foo from "../lib/rpc/foo"

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

    app.get("/", (req, res) => {
        console.log("foo")
        res.send("Hello World");
    })

    app.use(express.static("build"))

    app.listen(3000, () => console.log("Backend Server: running at port 3000"))
}
).catch(console.error)