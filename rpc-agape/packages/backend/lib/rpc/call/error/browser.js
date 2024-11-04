import codeError from "./error.json";

export function isBadRequest(error) {
  return error instanceof BadRequest;
}

export function isNotFound(error) {
  return error instanceof NotFound;
}

export function isForbidden(error) {
  return error instanceof Forbidden;
}

export function isUnauthorized(error) {
  return error instanceof Unauthorized;
}

export function onErrorRPC(response) {
  const { code, data } = response;

  switch (code) {
    case codeError.BadRequest:
      throw new BadRequest(data.message);
      break;

    case codeError.NotFound:
      throw new NotFound(data.message);
      break;

    case codeError.Forbidden:
      throw new Forbidden(data.message);
      break;

    case codeError.Unauthorized:
      throw new Unauthorized(data.message);
      break;

    default:
      console.error(response);
      throw response;
      break;
  }
}

class BadRequest extends Error {}
class NotFound extends Error {}
class Forbidden extends Error {}
class Unauthorized extends Error {}
