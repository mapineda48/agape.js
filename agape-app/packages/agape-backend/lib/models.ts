import cluster from "cluster";
import path from "path";
import { Sequelize, Model } from "sequelize";
import ms from "ms";
import debug from "./debug";

const unlockTime = cluster.isPrimary ? 1 : ms("20s");

/**
 * Consts
 */
const delimiter = "_";
const root = path.resolve("models");
const ext = path.extname(__filename);

export async function sync(sequelize: Sequelize, resetSchema = false) {
  try {
    // Crear la schema de bloqueo
    await sequelize.query('CREATE SCHEMA "lockAgape"');

    debug.info("Sync database");

    if (resetSchema) {
      await sequelize.dropSchema("public", {});
      await sequelize.createSchema("public", {});
    }

    await sequelize.sync();

    wait(unlockTime)
      .then(() => sequelize.dropSchema("lockAgape", {}))
      .catch(debug.primary);

    return true;
  } catch (error) {
    debug.info("Skip sync database");
    return false;
    //skip error
  }
}

export async function waitAuthenticate(seq: Sequelize): Promise<void> {
  try {
    await seq.authenticate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const code = error?.original?.code;

    if (code !== "57P03" && code !== "ECONNREFUSED") {
      throw error;
    }

    /**
     * In docker compose maybe database is not ready when try connect
     * try again
     */
    debug.info("the database system is starting up");
    await wait(500);
    return waitAuthenticate(seq);
  }
}

export async function wait(time: number) {
  return new Promise((res) => {
    setTimeout(res, time);
  });
}

export function toModelName(str: string) {
  return str
    .replace(root, "")            // Elimina la raíz del path, si está presente.
    .replace(/^[/\\]/, "")        // Elimina cualquier slash al inicio del string.
    .replace(/[/\\]/g, delimiter) // Reemplaza todos los slashes con el delimitador.
    .replace(ext, "")           // Elimina la extensión del archivo, si está presente.
    .replace(/_index$/, "");      // Elimina 'index' al final del string.
}

export function toPathModel(modelName: string) {
  return modelName.replace(delimiter, ".");
}

export function defineGet(target: unknown, key: string, value: unknown) {
  debug.primary(`db define property ${key}`);
  Object.defineProperty(target, key, {
    configurable: false,
    value,
  });
}

/**
 * Types
 */
export interface IRecord {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export type IModel<R extends IRecord> = Model<
  Omit<R, "createdAt" | "updatedAt">,
  Omit<R, "createdAt" | "updatedAt" | "id">
>;
