/**
 * PostgreSQL error codes (SQLSTATE) for common database errors.
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_ERROR_CODES = {
  /** Unique constraint violation */
  UNIQUE_VIOLATION: "23505",
  /** NOT NULL constraint violation */
  NOT_NULL_VIOLATION: "23502",
  /** Foreign key constraint violation */
  FOREIGN_KEY_VIOLATION: "23503",
  /** CHECK constraint violation */
  CHECK_VIOLATION: "23514",
  /** Numeric value out of range */
  NUMERIC_VALUE_OUT_OF_RANGE: "22003",
  /** String data right truncation (value too long) */
  STRING_DATA_RIGHT_TRUNCATION: "22001",
  /** Invalid datetime format */
  DATETIME_FIELD_OVERFLOW: "22008",
  /** Invalid text representation */
  INVALID_TEXT_REPRESENTATION: "22P02",
  /** Connection exception */
  CONNECTION_EXCEPTION: "08000",
  /** Database does not exist */
  UNDEFINED_DATABASE: "3D000",
  /** Undefined table */
  UNDEFINED_TABLE: "42P01",
  /** Undefined column */
  UNDEFINED_COLUMN: "42703",
} as const;

/**
 * Interface representing a PostgreSQL DatabaseError structure.
 * These properties are available on errors thrown by the `pg` library.
 */
interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
  schema?: string;
  severity?: string;
  hint?: string;
}

/**
 * Checks if the given error is a PostgreSQL database error.
 * Database errors have a `code` property that matches PostgreSQL SQLSTATE format.
 */
function isDatabaseError(error: unknown): error is DatabaseError {
  if (!(error instanceof Error)) return false;

  const dbError = error as DatabaseError;
  // PostgreSQL SQLSTATE codes are always 5 alphanumeric characters
  return (
    typeof dbError.code === "string" && /^[0-9A-Z]{5}$/i.test(dbError.code)
  );
}

/**
 * Extracts a human-readable field/column name from constraint name or column property.
 * Convention: constraint names usually follow patterns like `table_column_type` or `column_type`.
 */
function extractFieldName(error: DatabaseError): string | null {
  // If column is directly available, use it
  if (error.column) {
    return formatFieldName(error.column);
  }

  // Try to extract from constraint name
  if (error.constraint) {
    // Common patterns:
    // - table_column_key (unique constraint)
    // - table_column_fkey (foreign key)
    // - table_column_check (check constraint)
    // - column_not_null
    const parts = error.constraint.split("_");

    // Remove common suffixes
    const suffixes = [
      "key",
      "fkey",
      "pkey",
      "check",
      "null",
      "unique",
      "idx",
      "index",
    ];
    while (
      parts.length > 1 &&
      suffixes.includes(parts[parts.length - 1].toLowerCase())
    ) {
      parts.pop();
    }

    // Remove table name prefix if present (usually the first part)
    if (parts.length > 1) {
      parts.shift();
    }

    if (parts.length > 0) {
      return formatFieldName(parts.join("_"));
    }
  }

  // Try to extract from detail message
  if (error.detail) {
    // Pattern: Key (column_name)=(...) already exists
    const keyMatch = error.detail.match(/Key \(([^)]+)\)/i);
    if (keyMatch) {
      return formatFieldName(keyMatch[1]);
    }

    // Pattern: column "column_name" of relation ...
    const columnMatch = error.detail.match(/column "([^"]+)"/i);
    if (columnMatch) {
      return formatFieldName(columnMatch[1]);
    }
  }

  return null;
}

/**
 * Formats a snake_case or camelCase field name into a human-readable format.
 */
function formatFieldName(name: string): string {
  return (
    name
      // snake_case to space-separated
      .replace(/_/g, " ")
      // camelCase to space-separated
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      // Capitalize first letter of each word
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

/**
 * Normalizes a PostgreSQL database error into a user-friendly error message.
 */
function normalizeDatabaseError(error: DatabaseError): Error {
  const fieldName = extractFieldName(error);
  const fieldInfo = fieldName ? ` "${fieldName}"` : "";

  switch (error.code) {
    case PG_ERROR_CODES.UNIQUE_VIOLATION:
      return new Error(
        fieldName
          ? `The value for${fieldInfo} already exists. Please use a different value.`
          : "A record with this value already exists. Please use a different value."
      );

    case PG_ERROR_CODES.NOT_NULL_VIOLATION:
      return new Error(
        fieldName
          ? `The field${fieldInfo} is required and cannot be empty.`
          : "A required field is missing. Please fill in all required fields."
      );

    case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      // Check if it's a delete/update restriction or an insert with invalid reference
      const isReferencedByOther = error.detail?.includes("is still referenced");
      if (isReferencedByOther) {
        return new Error(
          "This record cannot be deleted because it is referenced by other records."
        );
      }
      return new Error(
        fieldName
          ? `The selected value for${fieldInfo} does not exist. Please select a valid option.`
          : "The referenced record does not exist. Please select a valid option."
      );

    case PG_ERROR_CODES.CHECK_VIOLATION:
      return new Error(
        fieldName
          ? `The value for${fieldInfo} is not valid. Please check the allowed values.`
          : "The provided value does not meet the required conditions."
      );

    case PG_ERROR_CODES.NUMERIC_VALUE_OUT_OF_RANGE:
      return new Error(
        fieldName
          ? `The value for${fieldInfo} is out of the allowed range.`
          : "A numeric value is out of the allowed range."
      );

    case PG_ERROR_CODES.STRING_DATA_RIGHT_TRUNCATION:
      return new Error(
        fieldName
          ? `The value for${fieldInfo} is too long. Please shorten it.`
          : "A text value is too long. Please shorten it."
      );

    case PG_ERROR_CODES.DATETIME_FIELD_OVERFLOW:
      return new Error(
        fieldName
          ? `The date/time value for${fieldInfo} is not valid.`
          : "An invalid date or time value was provided."
      );

    case PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION:
      return new Error(
        fieldName
          ? `The format of${fieldInfo} is not valid.`
          : "The format of a provided value is not valid."
      );

    case PG_ERROR_CODES.CONNECTION_EXCEPTION:
      return new Error(
        "Unable to connect to the database. Please try again later."
      );

    case PG_ERROR_CODES.UNDEFINED_DATABASE:
      return new Error("Database configuration error. Please contact support.");

    case PG_ERROR_CODES.UNDEFINED_TABLE:
    case PG_ERROR_CODES.UNDEFINED_COLUMN:
      return new Error("Database schema error. Please contact support.");

    default:
      // For unhandled database errors, provide a generic message
      // but still log the full error for debugging
      console.warn("Unhandled database error code:", error.code, error.message);
      return new Error(
        "A database error occurred. Please try again or contact support."
      );
  }
}

/**
 * Parses and normalizes errors before sending them to the client.
 *
 * This function handles:
 * - PostgreSQL/Drizzle database errors (constraint violations, etc.)
 * - Application errors with specific messages
 * - Unknown errors
 *
 * @param error - The error caught from the RPC handler
 * @returns A normalized Error instance with a user-friendly message
 */
export default function parseError(error: unknown): Error {
  console.error(error);

  // Handle PostgreSQL database errors
  if (isDatabaseError(error)) {
    return normalizeDatabaseError(error);
  }

  // Pass through application errors that already have meaningful messages
  if (error instanceof Error) {
    // Keep the original error message for business logic errors
    return error;
  }

  // Fallback for unknown error types
  return new Error("Ups... Something went wrong!");
}
