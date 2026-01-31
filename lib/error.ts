/**
 * Errores de negocio personalizados.
 * Estos errores se usan para señalar condiciones específicas
 * que deben manejarse de forma particular en la capa RPC.
 */

/**
 * Error de regla de negocio.
 * Se lanza cuando una operación viola una regla de negocio invariante.
 *
 */
export class BusinessRuleError extends Error {
  public readonly code = "BUSINESS_RULE_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "BusinessRuleError";
    // Mantener el stack trace correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessRuleError);
    }
  }
}

/**
 * Error de recurso no encontrado.
 * Se lanza cuando se intenta operar sobre un recurso que no existe.
 *
 */
export class NotFoundError extends Error {
  public readonly code = "NOT_FOUND_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }
}

/**
 * Error de validación.
 * Se lanza cuando los datos de entrada no cumplen con las validaciones requeridas.
 *
 */
export class ValidationError extends Error {
  public readonly code = "VALIDATION_ERROR";
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Error de conflicto.
 * Se lanza cuando existe un conflicto con el estado actual (ej: unicidad).
 *
 */
export class ConflictError extends Error {
  public readonly code = "CONFLICT_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConflictError);
    }
  }
}

/**
 * Error de permiso denegado.
 * Se lanza cuando el usuario no tiene los permisos necesarios para una operación.
 *
 */
export class ForbiddenError extends Error {
  public readonly code = "FORBIDDEN_ERROR";
  public readonly requiredPermission?: string;

  constructor(message: string, requiredPermission?: string) {
    super(message);
    this.name = "ForbiddenError";
    this.requiredPermission = requiredPermission;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ForbiddenError);
    }
  }
}

/**
 * Error de autenticación.
 * Se lanza cuando el usuario no está autenticado y la operación lo requiere.
 *
 */
export class UnauthorizedError extends Error {
  public readonly code = "UNAUTHORIZED_ERROR";

  constructor(message: string = "Autenticación requerida") {
    super(message);
    this.name = "UnauthorizedError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnauthorizedError);
    }
  }
}
