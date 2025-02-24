import express from "express";
import { glob } from "glob";
import _ from "lodash";
import rpc, { onErrorMiddleware } from "./call";
import path from "path";

const service = path.resolve("agape");
const extname = path.extname(__filename);
const root = path.resolve(__dirname, "../..")

export default async function connectService() {
  const router = express.Router();

  const paths = await LoadRoutePaths();

  const tasks = paths.map(toPosix).map(async (file) => {
    if (file.includes(".d.")) {
      return;
    }

    const exports = await import$(file);

    if (!exports.length) {
      return;
    }

    const serviceModule = toServiceEndpoint(file);

    exports.forEach(([exportName, fn]) => {
      const endpoint = path.posix.join(serviceModule, (exportName !== "default" ? exportName : ""));

      router.post(endpoint, rpc(fn));
    });
  });

  await Promise.all(tasks);

  router.use(onErrorMiddleware);

  return router;
}

export function toServiceEndpoint(file: string) {
  return path.posix.join("/service", file.replace(extname, "").replace(/\/index$/, ""));
}

async function import$(mod: string) {
  const module = await import(path.join(service, mod));

  return Object.entries(module).filter(
    ([, fn]) => typeof fn === "function"
  ) as Export[];
}

export function toPosix(path: string) {
  return path.replace(/\\/g, "/");
}

export function LoadRoutePaths() {
  return glob("**/*" + extname, { cwd: service })
}

/**
 * Types
 */
type Export = [string, (...args: unknown[]) => unknown];
