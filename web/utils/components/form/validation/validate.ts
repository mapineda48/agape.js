/**
 * Validation Functions
 *
 * Core validation logic using Zod 4 for schema validation.
 * Provides functions to validate individual fields and entire forms.
 *
 * @module validation/validate
 */

import { z } from "zod";
import {
  type FieldPath,
  type FieldErrors,
  type FieldValidationResult,
  type FormValidationResult,
  normalizePath,
  pathToString,
} from "./types";

// ============================================================================
// Schema Utilities
// ============================================================================

/**
 * Checks if a schema is a ZodObject (has a shape property).
 */
function isZodObject(schema: unknown): schema is { shape: Record<string, unknown> } {
  return (
    schema !== null &&
    typeof schema === "object" &&
    "shape" in schema &&
    typeof (schema as { shape: unknown }).shape === "object"
  );
}

/**
 * Checks if a schema is a ZodArray (has an element property).
 */
function isZodArray(schema: unknown): schema is { element: unknown } {
  return (
    schema !== null &&
    typeof schema === "object" &&
    "element" in schema &&
    typeof (schema as { element: unknown }).element !== "undefined"
  );
}

/**
 * Checks if a schema has an unwrap method (optional, nullable, default, catch, etc.).
 */
function hasUnwrap(schema: unknown): schema is { unwrap: () => unknown } {
  return (
    schema !== null &&
    typeof schema === "object" &&
    "unwrap" in schema &&
    typeof (schema as { unwrap: unknown }).unwrap === "function"
  );
}

/**
 * Checks if something is a Zod schema (has safeParse method).
 */
function isZodSchema(schema: unknown): schema is z.ZodType {
  return (
    schema !== null &&
    typeof schema === "object" &&
    "safeParse" in schema &&
    typeof (schema as { safeParse: unknown }).safeParse === "function"
  );
}

/**
 * Unwraps a Zod schema to get the underlying type.
 * Handles ZodOptional, ZodNullable, ZodDefault, ZodCatch, etc.
 */
function unwrapSchema(schema: unknown): unknown {
  // If schema has unwrap method, use it recursively
  if (hasUnwrap(schema)) {
    return unwrapSchema(schema.unwrap());
  }
  return schema;
}

/**
 * Extracts a sub-schema from a Zod object schema for a given path.
 * Handles nested objects and arrays.
 *
 * @param schema - The root Zod schema
 * @param path - Path to the field (e.g., ['user', 'address', 'city'] or 'user.address.city')
 * @returns The sub-schema for the path, or undefined if not found
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   user: z.object({
 *     email: z.string().email()
 *   })
 * });
 *
 * const emailSchema = getSchemaForPath(schema, ['user', 'email']);
 * // emailSchema is z.string().email()
 * ```
 */
export function getSchemaForPath(
  schema: z.ZodType,
  path: FieldPath
): z.ZodType | undefined {
  const pathArray = normalizePath(path);

  if (pathArray.length === 0) {
    return schema;
  }

  let currentSchema: unknown = schema;

  for (const segment of pathArray) {
    // Unwrap optional, nullable, default, etc.
    const unwrapped = unwrapSchema(currentSchema);

    if (typeof segment === "number") {
      // Handle array access
      if (isZodArray(unwrapped)) {
        currentSchema = unwrapped.element;
      } else {
        // Can't index into non-array
        return undefined;
      }
    } else {
      // Handle object property access
      if (isZodObject(unwrapped)) {
        const shape = unwrapped.shape as Record<string, unknown>;
        if (segment in shape) {
          currentSchema = shape[segment];
        } else {
          // Property not found in schema
          return undefined;
        }
      } else {
        // Can't access property on non-object
        return undefined;
      }
    }
  }

  // Verify the result is a valid Zod schema
  if (isZodSchema(currentSchema)) {
    return currentSchema;
  }

  return undefined;
}

// ============================================================================
// Field Validation
// ============================================================================

/**
 * Validates a single field value against a schema.
 *
 * @param schema - The Zod schema for the field (or root schema)
 * @param path - Path to the field (used to extract sub-schema if needed)
 * @param value - The value to validate
 * @returns Validation result with isValid, error, and transformed value
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   email: z.string().email('Invalid email')
 * });
 *
 * const result = validateField(schema, 'email', 'not-an-email');
 * // { isValid: false, error: 'Invalid email' }
 *
 * const result2 = validateField(schema, 'email', 'user@example.com');
 * // { isValid: true, value: 'user@example.com' }
 * ```
 */
export function validateField(
  schema: z.ZodType,
  path: FieldPath,
  value: unknown
): FieldValidationResult {
  // Get the sub-schema for this path
  const fieldSchema = getSchemaForPath(schema, path);

  if (!fieldSchema) {
    // If no schema found, consider it valid (no validation rules)
    return { isValid: true, value };
  }

  const result = fieldSchema.safeParse(value);

  if (result.success) {
    return {
      isValid: true,
      value: result.data,
    };
  }

  // Extract the first error message from Zod 4 error structure
  const firstIssue = result.error.issues?.[0];
  return {
    isValid: false,
    error: firstIssue?.message ?? "Validation failed",
    value,
  };
}

/**
 * Validates a single field asynchronously.
 * Use this when the schema contains async refinements.
 */
export async function validateFieldAsync(
  schema: z.ZodType,
  path: FieldPath,
  value: unknown
): Promise<FieldValidationResult> {
  const fieldSchema = getSchemaForPath(schema, path);

  if (!fieldSchema) {
    return { isValid: true, value };
  }

  const result = await fieldSchema.safeParseAsync(value);

  if (result.success) {
    return {
      isValid: true,
      value: result.data,
    };
  }

  const firstIssue = result.error.issues?.[0];
  return {
    isValid: false,
    error: firstIssue?.message ?? "Validation failed",
    value,
  };
}

// ============================================================================
// Form Validation
// ============================================================================

/**
 * Validates an entire form against a schema.
 *
 * @param schema - The Zod schema for the form
 * @param values - The form values to validate
 * @returns Validation result with isValid, errors map, and transformed data
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string().min(2),
 *   email: z.string().email(),
 * });
 *
 * const result = validateForm(schema, { name: 'A', email: 'invalid' });
 * // {
 * //   isValid: false,
 * //   errors: {
 * //     'name': 'String must contain at least 2 character(s)',
 * //     'email': 'Invalid email'
 * //   }
 * // }
 * ```
 */
export function validateForm<T extends z.ZodType>(
  schema: T,
  values: unknown
): FormValidationResult<z.infer<T>> {
  const result = schema.safeParse(values);

  if (result.success) {
    return {
      isValid: true,
      errors: {},
      data: result.data,
    };
  }

  // Convert Zod errors to our FieldErrors format
  const errors = zodErrorsToFieldErrors(result.error);

  return {
    isValid: false,
    errors,
  };
}

/**
 * Validates an entire form asynchronously.
 * Use this when the schema contains async refinements.
 */
export async function validateFormAsync<T extends z.ZodType>(
  schema: T,
  values: unknown
): Promise<FormValidationResult<z.infer<T>>> {
  const result = await schema.safeParseAsync(values);

  if (result.success) {
    return {
      isValid: true,
      errors: {},
      data: result.data,
    };
  }

  const errors = zodErrorsToFieldErrors(result.error);

  return {
    isValid: false,
    errors,
  };
}

// ============================================================================
// Error Transformation
// ============================================================================

/**
 * Converts Zod errors to our FieldErrors format.
 * Each error path becomes a dot-notation key with the error message.
 *
 * In Zod 4, errors have an `issues` array with `path` and `message` properties.
 *
 * @param error - ZodError to convert
 * @returns Map of field paths to error messages
 */
export function zodErrorsToFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};

  // Zod 4 uses .issues instead of .errors
  const issues = error.issues ?? [];

  for (const issue of issues) {
    // Convert path (which may contain symbols in some cases) to string/number array
    const safePath = issue.path.map((segment) =>
      typeof segment === "symbol" ? String(segment) : segment
    ) as (string | number)[];

    const path = pathToString(safePath);
    // Only keep the first error for each path
    if (!(path in errors)) {
      errors[path] = issue.message;
    }
  }

  return errors;
}

/**
 * Merges multiple FieldErrors objects.
 * Later errors override earlier ones for the same path.
 */
export function mergeErrors(...errorMaps: FieldErrors[]): FieldErrors {
  const result: FieldErrors = {};

  for (const errors of errorMaps) {
    for (const [path, error] of Object.entries(errors)) {
      if (error !== undefined) {
        result[path] = error;
      }
    }
  }

  return result;
}

/**
 * Checks if a FieldErrors object has any errors.
 */
export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}

/**
 * Clears errors for paths that start with the given prefix.
 * Useful when a parent field changes and child errors become stale.
 */
export function clearErrorsByPrefix(
  errors: FieldErrors,
  prefix: string
): FieldErrors {
  const result: FieldErrors = {};
  const prefixWithDot = prefix ? `${prefix}.` : prefix;

  for (const [path, error] of Object.entries(errors)) {
    if (!path.startsWith(prefixWithDot) && path !== prefix) {
      result[path] = error;
    }
  }

  return result;
}
