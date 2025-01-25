import _ from "lodash";
import { Request, Response, NextFunction } from "express";
import { ApiKey, ApiKeyHeader } from "./config";
import parseFormData from "../../form/server";
import { extractInstances } from "../../form/server";
import { Model } from "sequelize";

export { onErrorMiddleware } from "./error/server";

export default function factoryMiddleware(cb: (...args: unknown[]) => unknown) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isRpcApiKey(req)) return next();

    try {
      const args = await parseFormData(req);

      let payload = cb.call(req, ...args);

      if (payload instanceof Promise) {
        payload = await payload;
      }

      if (payload instanceof Model) {
        payload = payload.get();
      }

      const dates = extractInstances(payload, Date);

      res.json([payload, dates]);
    } catch (error) {
      next(error);
    }
  };
}

export function isRpcApiKey(req: Request) {
  return req.headers[ApiKeyHeader] === ApiKey;
}
