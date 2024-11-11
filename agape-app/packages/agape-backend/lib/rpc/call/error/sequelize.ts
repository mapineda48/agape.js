import error from "./error.json";
import { BaseError } from "sequelize";

export function isSequelizeError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

export function parseError(error: BaseError) {
  return [400, error.message] as const;
}
