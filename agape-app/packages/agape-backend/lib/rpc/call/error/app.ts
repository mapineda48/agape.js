import error from "./error.json";

export default function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

class AppError {
  constructor(public readonly code: number, public readonly message: string) {}
}

export class NotFound extends AppError {
  constructor(message: string) {
    super(error.NotFound, message);
  }
}

export class Unauthorized extends AppError {
  constructor(message: string) {
    super(error.Unauthorized, message);
  }
}

export class Forbidden extends AppError {
  constructor(message: string) {
    super(error.Forbidden, message);
  }
}

export class BadRequest extends AppError {
  constructor(message: string) {
    super(error.BadRequest, message);
  }
}
