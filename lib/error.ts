/**
 * Errores de negocio personalizados.
 * Estos errores se usan para señalar condiciones específicas
 * que deben manejarse de forma particular en la capa RPC.
 */

/**
 * Error de regla de negocio.
 * Se lanza cuando una operación viola una regla de negocio invariante.
 *
 * @example
 * ```ts
 * throw new BusinessRuleError("No se puede deshabilitar porque tiene ítems activos");
 * ```
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
 * @example
 * ```ts
 * throw new NotFoundError("Categoría con ID 123 no encontrada");
 * ```
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
 * @example
 * ```ts
 * throw new ValidationError("El código es requerido");
 * ```
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
 * @example
 * ```ts
 * throw new ConflictError("Ya existe una categoría con ese nombre");
 * ```
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
