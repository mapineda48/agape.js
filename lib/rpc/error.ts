/**
 * Error Parsing Module
 *
 * Normalizes various error types (PostgreSQL, Drizzle ORM, application errors)
 * into user-friendly error messages for RPC responses.
 */

import { PG_ERROR_CODES, type DatabaseError } from "./types";

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
 * Used for checking `cause` properties which may not be Error instances.
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
 *
 * Drizzle ORM wraps the original pg error in the `cause` property.
 * This function searches recursively through the error chain.
 *
 * @param error - The error to extract the database error from
 * @param maxDepth - Maximum depth to search (prevents infinite loops)
 * @returns The PostgreSQL database error if found, null otherwise
 */
function extractDatabaseError(
  error: unknown,
  maxDepth = 5
): DatabaseError | null {
  if (maxDepth <= 0) return null;

  // Check if the error itself is a database error
  if (isDatabaseError(error)) {
    return error;
  }

  // Check if it's an Error with a cause property
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;

    // The cause might be a plain object with database error properties
    if (hasDatabaseErrorShape(cause)) {
      return createDatabaseErrorFromShape(cause);
    }

    // Recursively check the cause
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
 *
 * Attempts to extract from (in order of priority):
 * 1. Direct column property
 * 2. Constraint name (parsing common patterns)
 * 3. Detail message (Key/column patterns)
 */
function extractFieldName(error: DatabaseError): string | null {
  // Priority 1: Direct column property
  if (error.column) {
    return formatFieldName(error.column);
  }

  // Priority 2: Extract from constraint name
  const constraintField = extractFromConstraintName(error.constraint);
  if (constraintField) {
    return constraintField;
  }

  // Priority 3: Extract from detail message
  const detailField = extractFromDetailMessage(error.detail);
  if (detailField) {
    return detailField;
  }

  return null;
}

/**
 * Extracts field name from constraint names like:
 * - table_column_key (unique constraint)
 * - table_column_fkey (foreign key)
 * - table_column_check (check constraint)
 */
function extractFromConstraintName(constraint: string | undefined): string | null {
  if (!constraint) return null;

  const parts = constraint.split("_");

  // Remove common suffixes
  while (
    parts.length > 1 &&
    CONSTRAINT_SUFFIXES.includes(parts[parts.length - 1].toLowerCase())
  ) {
    parts.pop();
  }

  // Remove table name prefix if present (usually the first part)
  if (parts.length > 1) {
    parts.shift();
  }

  return parts.length > 0 ? formatFieldName(parts.join("_")) : null;
}

/**
 * Extracts field name from PostgreSQL detail messages like:
 * - "Key (column_name)=(...) already exists."
 * - 'column "column_name" of relation ...'
 */
function extractFromDetailMessage(detail: string | undefined): string | null {
  if (!detail) return null;

  // Pattern: Key (column_name)=(...)
  const keyMatch = detail.match(/Key \(([^)]+)\)/i);
  if (keyMatch) {
    return formatFieldName(keyMatch[1]);
  }

  // Pattern: column "column_name" of relation ...
  const columnMatch = detail.match(/column "([^"]+)"/i);
  if (columnMatch) {
    return formatFieldName(columnMatch[1]);
  }

  return null;
}

/**
 * Formats a snake_case or camelCase field name into human-readable format.
 *
 * Examples:
 * - "document_number" → "Document Number"
 * - "createdAt" → "Created At"
 */
function formatFieldName(name: string): string {
  return name
    .replace(/_/g, " ") // snake_case to spaces
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase to spaces
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize words
}

// ============================================================================
// Error Normalization
// ============================================================================

/** Error messages for database errors */
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

/**
 * Normalizes a PostgreSQL database error into a user-friendly error message.
 */
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
      console.warn("Unhandled database error code:", error.code, error.message);
      return new Error(ERROR_MESSAGES.genericDbError);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parses and normalizes errors before sending them to the client.
 *
 * Handles:
 * - PostgreSQL database errors (direct from pg driver)
 * - Drizzle ORM errors (which wrap pg errors in the `cause` property)
 * - Application errors with specific messages
 * - Unknown errors
 *
 * @param error - The error caught from the RPC handler
 * @returns A normalized Error instance with a user-friendly message
 */
export default function parseError(error: unknown): Error {
  console.error(error);

  // Try to extract a PostgreSQL database error from the error chain
  const dbError = extractDatabaseError(error);
  if (dbError) {
    return normalizeDatabaseError(dbError);
  }

  // Pass through application errors that already have meaningful messages
  if (error instanceof Error) {
    return error;
  }

  // Fallback for unknown error types
  return new Error(ERROR_MESSAGES.unknownError);
}
