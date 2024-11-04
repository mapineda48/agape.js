import express from "express";
import logger from "morgan";
import db from "../models";
import Storage from "../lib/storage";
import rcp from "../lib/rpc";
import spa from "../lib/spa";
import debug from "../lib/debug";
import origin from "../lib/origin";

/**
 * Enviroment
 */
const isDev = process.env.NODE_ENV !== "production";

const {
  AGAPE_PORT = "5000",
  AGAPE_POSTGRES_URI = "postgresql://agape:mi_contraseña@127.0.0.1",
  AGAPE_STORAGE_URI = "http://minio:minio123@127.0.0.1:9000",
  AGAPE_JWT_SECRET = isDev ? __filename : process.exit(1),
  AGEPE_ROOT_USER = "admin",
  AGAPE_ROOT_PASSWORD = "admin",
} = process.env;

/**
 * Boot App
 */
(async function bootApp() {
  // Debug
  await debug.env(isDev);

  //Database
  await db.Init(AGAPE_POSTGRES_URI, isDev);

  //Storage
  //const storageHost = await Storage.Init(AGAPE_STORAGE_URI);

  //App
  const app = express();

  // Origin
  
  app.use(origin(isDev, /*storageHost*/ ''));

  // Logs
  app.use(logger(isDev ? "dev" : "common"));

  //Agape Middlewares
  app.use(await rcp(AGAPE_JWT_SECRET));
  app.use(await spa(isDev));

  app.listen(parseInt(AGAPE_PORT), () =>
    debug.info(`server at port ${AGAPE_PORT}`)
  );
})().catch((error) => {
  throw error;
});
