import isAppError from "./app";
import { isSequelizeError, parseError } from "./sequelize";
import type { ErrorRequestHandler as OnError } from "express";

export const onErrorMiddleware: OnError = (error, req, res, next) => {
  if (isAppError(error)) {
     res.status(error.code).json({ message: error.message });
     return;
  }

  if (isSequelizeError(error)) {
    const [status, message] = parseError(error);
    res.status(status).json({ message });
    return
  }

  console.error(error);
  res.status(500).json({ message: "Ups... Something Wrong" });
};

export default onErrorMiddleware;
