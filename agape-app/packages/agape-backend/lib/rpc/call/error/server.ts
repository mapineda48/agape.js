import isAppError from "./app";
import { isSequelizeError, parseError } from "./sequelize";
import type { ErrorRequestHandler as OnError } from "express";

export const onErrorMiddleware: OnError = (error, req, res, next) => {
  if (isAppError(error)) {
    return res.status(error.code).json({ message: error.message });
  }

  if (isSequelizeError(error)) {
    const [status, message] = parseError(error);
    return res.status(status).json({ message });
  }

  console.error(error);
  res.status(500).json({ message: "Ups... Something Wrong" });
};

export default onErrorMiddleware;
