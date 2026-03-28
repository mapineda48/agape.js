/**
 * Error Parsing Module
 *
 * Normalizes various error types (PostgreSQL, Drizzle ORM, application errors)
 * into user-friendly error messages for RPC responses.
 */

import { PG_ERROR_CODES, type DatabaseError } from "./types.ts";

// ============================================================================
// Logger Interface
// ============================================================================

export interface RpcLogger {
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
}

const defaultLogger: RpcLogger = {
  error: console.error,
  warn: console.warn,
};

let activeLogger: RpcLogger = defaultLogger;

/**
 * Sets the logger used by the error module.
 */
export function setErrorLogger(logger: RpcLogger): void {
  activeLogger = logger;
}

// ============================================================================
// Database Error Detection
// ============================================================================

/** Regex pattern for PostgreSQL SQLSTATE codes (5 alphanumeric chars) */
const SQLSTATE_PATTERN = /^[0-9A-Z]{5}$/i;

/**
 * Checks if the given error is a PostgreSQL database error.
 */
function isDatabaseError(error: unknown): error is DatabaseError {
  if (!(error instanceof Error)) return false;

  const dbError = error as DatabaseError;
  return typeof dbError.code === "string" && SQLSTATE_PATTERN.test(dbError.code);
}

/**
 * Checks if an object has the structure of a PostgreSQL database error.
 */
function hasDatabaseErrorShape(obj: unknown): obj is DatabaseError {
  if (obj === null || typeof obj !== "object") return false;

  const maybeDbError = obj as Record<string, unknown>;
  return (
    typeof maybeDbError.code === "string" &&
    SQLSTATE_PATTERN.test(maybeDbError.code)
  );
}

/**
 * Extracts the PostgreSQL database error from an error chain.
 */
function extractDatabaseError(
  error: unknown,
  maxDepth = 5
): DatabaseError | null {
  if (maxDepth <= 0) return null;

  if (isDatabaseError(error)) {
    return error;
  }

  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;

    if (hasDatabaseErrorShape(cause)) {
      return createDatabaseErrorFromShape(cause);
    }

    if (cause !== undefined) {
      return extractDatabaseError(cause, maxDepth - 1);
    }
  }

  return null;
}

/**
 * Creates a DatabaseError instance from a plain object with DB error shape.
 */
function createDatabaseErrorFromShape(cause: DatabaseError): DatabaseError {
  return Object.assign(new Error(cause.message || ""), {
    code: cause.code,
    detail: cause.detail,
    constraint: cause.constraint,
    table: cause.table,
    column: cause.column,
    schema: cause.schema,
    severity: cause.severity,
    hint: cause.hint,
  }) as DatabaseError;
}

// ============================================================================
// Field Name Extraction
// ============================================================================

/** Common constraint name suffixes to strip when extracting field names */
const CONSTRAINT_SUFFIXES = [
  "key",
  "fkey",
  "pkey",
  "check",
  "null",
  "unique",
  "idx",
  "index",
];

/**
 * Extracts a human-readable field name from database error metadata.
 */
function extractFieldName(error: DatabaseError): string | null {
  if (error.column) {
    return formatFieldName(error.column);
  }

  const constraintField = extractFromConstraintName(error.constraint);
  if (constraintField) {
    return constraintField;
  }

  const detailField = extractFromDetailMessage(error.detail);
  if (detailField) {
    return detailField;
  }

  return null;
}

function extractFromConstraintName(constraint: string | undefined): string | null {
  if (!constraint) return null;

  const parts = constraint.split("_");

  while (
    parts.length > 1 &&
    CONSTRAINT_SUFFIXES.includes(parts[parts.length - 1].toLowerCase())
  ) {
    parts.pop();
  }

  if (parts.length > 1) {
    parts.shift();
  }

  return parts.length > 0 ? formatFieldName(parts.join("_")) : null;
}

function extractFromDetailMessage(detail: string | undefined): string | null {
  if (!detail) return null;

  const keyMatch = detail.match(/Key \(([^)]+)\)/i);
  if (keyMatch) {
    return formatFieldName(keyMatch[1]);
  }

  const columnMatch = detail.match(/column "([^"]+)"/i);
  if (columnMatch) {
    return formatFieldName(columnMatch[1]);
  }

  return null;
}

function formatFieldName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ============================================================================
// Error Normalization
// ============================================================================

const ERROR_MESSAGES = {
  uniqueViolation: {
    withField: (field: string) =>
      `The value for "${field}" already exists. Please use a different value.`,
    generic: "A record with this value already exists. Please use a different value.",
  },
  notNullViolation: {
    withField: (field: string) =>
      `The field "${field}" is required and cannot be empty.`,
    generic: "A required field is missing. Please fill in all required fields.",
  },
  foreignKeyViolation: {
    referenced: "This record cannot be deleted because it is referenced by other records.",
    withField: (field: string) =>
      `The selected value for "${field}" does not exist. Please select a valid option.`,
    generic: "The referenced record does not exist. Please select a valid option.",
  },
  checkViolation: {
    withField: (field: string) =>
      `The value for "${field}" is not valid. Please check the allowed values.`,
    generic: "The provided value does not meet the required conditions.",
  },
  numericOutOfRange: {
    withField: (field: string) =>
      `The value for "${field}" is out of the allowed range.`,
    generic: "A numeric value is out of the allowed range.",
  },
  stringTooLong: {
    withField: (field: string) =>
      `The value for "${field}" is too long. Please shorten it.`,
    generic: "A text value is too long. Please shorten it.",
  },
  invalidDatetime: {
    withField: (field: string) =>
      `The date/time value for "${field}" is not valid.`,
    generic: "An invalid date or time value was provided.",
  },
  invalidFormat: {
    withField: (field: string) =>
      `The format of "${field}" is not valid.`,
    generic: "The format of a provided value is not valid.",
  },
  connectionError: "Unable to connect to the database. Please try again later.",
  configError: "Database configuration error. Please contact support.",
  schemaError: "Database schema error. Please contact support.",
  genericDbError: "A database error occurred. Please try again or contact support.",
  unknownError: "Ups... Something went wrong!",
} as const;

function normalizeDatabaseError(error: DatabaseError): Error {
  const fieldName = extractFieldName(error);

  switch (error.code) {
    case PG_ERROR_CODES.UNIQUE_VIOLATION:
      return new Error(
        fieldName
          ? ERROR_MESSAGES.uniqueViolation.withField(fieldName)
          : ERROR_MESSAGES.uniqueViolation.generic
      );

    case PG_ERROR_CODES.NOT_NULL_VIOLATION:
      return new Error(
        fieldName
          ? ERROR_MESSAGES.notNullViolation.withField(fieldName)
          : ERROR_MESSAGES.notNullViolation.generic
      );

    case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION: {
      const isReferencedByOther = error.detail?.includes("is still referenced");
      if (isReferencedByOther) {
        return new Error(ERROR_MESSAGES.foreignKeyViolation.referenced);
      }
      return new Error(
        fieldName
          ? ERROR_MESSAGES.foreignKeyViolation.withField(fieldName)
          : ERROR_MESSAGES.foreignKeyViolation.generic
      );
    }

    case PG_ERROR_CODES.CHECK_VIOLATION:
      return new Error(
        fieldName
          ? ERROR_MESSAGES.checkViolation.withField(fieldName)
          : ERROR_MESSAGES.checkViolation.generic
      );

    case PG_ERROR_CODES.NUMERIC_VALUE_OUT_OF_RANGE:
      return new Error(
        fieldName
          ? ERROR_MESSAGES.numericOutOfRange.withField(fieldName)
          : ERROR_MESSAGES.numericOutOfRange.generic
      );

    case PG_ERROR_CODES.STRING_DATA_RIGHT_TRUNCATION:
      return new Error(
        fieldName
          ? ERROR_MESSAGES.stringTooLong.withField(fieldName)
          : ERROR_MESSAGES.stringTooLong.generic
      );

    case PG_ERROR_CODES.DATETIME_FIELD_OVERFLOW:
      return new Error(
        fieldName
          ? ERROR_MESSAGES.invalidDatetime.withField(fieldName)
          : ERROR_MESSAGES.invalidDatetime.generic
      );

    case PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION:
      return new Error(
        fieldName
          ? ERROR_MESSAGES.invalidFormat.withField(fieldName)
          : ERROR_MESSAGES.invalidFormat.generic
      );

    case PG_ERROR_CODES.CONNECTION_EXCEPTION:
      return new Error(ERROR_MESSAGES.connectionError);

    case PG_ERROR_CODES.UNDEFINED_DATABASE:
      return new Error(ERROR_MESSAGES.configError);

    case PG_ERROR_CODES.UNDEFINED_TABLE:
    case PG_ERROR_CODES.UNDEFINED_COLUMN:
      return new Error(ERROR_MESSAGES.schemaError);

    default:
      activeLogger.warn(`Unhandled database error code: ${error.code} - ${error.message}`);
      return new Error(ERROR_MESSAGES.genericDbError);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parses and normalizes errors before sending them to the client.
 */
export default function parseError(error: unknown): Error {
  if (error instanceof Error) {
    activeLogger.error("RPC handler error:", error.message, error.stack);
  } else {
    activeLogger.error("RPC handler error (unknown type):", error);
  }

  const dbError = extractDatabaseError(error);
  if (dbError) {
    return normalizeDatabaseError(dbError);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(ERROR_MESSAGES.unknownError);
}
