import express from "express";
import { glob } from "glob";
import _ from "lodash";
import rpc, { onErrorMiddleware } from "./call";
import path from "path";

const extname = path.extname(__filename);
const root = path.resolve(__dirname, "../..")

export default async function connectService() {
  const router = express.Router();

  const paths = await glob("service/**/*" + extname, { cwd: root });

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
  return path.posix.join("/", file.replace(extname, "").replace(/\/index$/, ""));
}

async function import$(filename: string) {
  const module = await import(path.join(root, filename));

  return Object.entries(module).filter(
    ([, fn]) => typeof fn === "function"
  ) as Export[];
}

export function toPosix(path: string) {
  return path.replace(/\\/g, "/");
}

/**
 * Types
 */
type Export = [string, (...args: unknown[]) => unknown];
