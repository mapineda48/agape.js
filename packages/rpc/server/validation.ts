/**
 * RPC Validation Module
 *
 * Provides optional Zod-based input validation for RPC service functions.
 * Services can use `withValidation` to attach a schema to a function.
 * The middleware will automatically validate arguments before calling the handler.
 */

import type { z } from "zod";

// ============================================================================
// Types
// ============================================================================

/** Symbol used to attach the schema to a function without polluting its shape */
const SCHEMA_KEY = "__schema" as const;

/** A function that has a Zod schema attached for argument validation */
export interface ValidatedFunction {
  (...args: unknown[]): unknown;
  [SCHEMA_KEY]: z.ZodType;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Wraps a service function with an attached Zod schema for argument validation.
 *
 * @param schema - Zod schema that validates the arguments tuple
 * @param fn - The service function to wrap
 * @returns The same function with the schema attached
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withValidation<T extends (...args: any[]) => any>(
  schema: z.ZodType,
  fn: T,
): T {
  Object.defineProperty(fn, SCHEMA_KEY, {
    value: schema,
    writable: false,
    enumerable: false,
  });
  return fn;
}

/**
 * Extracts the Zod schema from a function, if one was attached via `withValidation`.
 *
 * @param fn - Any function (may or may not have a schema)
 * @returns The attached Zod schema, or `undefined` if none exists
 */
export function getSchema(fn: unknown): z.ZodType | undefined {
  if (typeof fn === "function" && SCHEMA_KEY in fn) {
    return (fn as ValidatedFunction)[SCHEMA_KEY];
  }
  return undefined;
}
