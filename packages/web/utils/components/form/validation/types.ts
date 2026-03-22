/**
 * Validation Types
 *
 * Core types for the form validation system.
 * Designed to work with Zod but can be adapted for other validation libraries.
 *
 * @module validation/types
 */

import type { z } from "zod";

// ============================================================================
// Core Types
// ============================================================================

/**
 * Path representation for field access.
 * Can be a dot-notation string or an array of segments.
 */
export type FieldPath = string | (string | number)[];

/**
 * Error message for a single field.
 */
export type FieldError = string | undefined;

/**
 * Map of field paths to their error messages.
 * Uses dot-notation string keys for consistent access.
 */
export type FieldErrors = Record<string, FieldError>;

/**
 * Map of field paths to their touched state.
 * A field is "touched" when it has been focused and blurred.
 */
export type TouchedFields = Record<string, boolean>;

/**
 * Map of field paths to their dirty state.
 * A field is "dirty" when its value differs from the initial value.
 */
export type DirtyFields = Record<string, boolean>;

/**
 * Validation mode determines when validation runs.
 */
export type ValidationMode = "onSubmit" | "onBlur" | "onChange" | "onTouched";

/**
 * Re-validation mode determines when re-validation runs after initial validation.
 */
export type ReValidateMode = "onSubmit" | "onBlur" | "onChange";

// ============================================================================
// Validation State
// ============================================================================

/**
 * Complete validation state for a form.
 */
export interface ValidationState {
  /** Map of field paths to error messages */
  errors: FieldErrors;

  /** Map of field paths to touched state */
  touched: TouchedFields;

  /** Map of field paths to dirty state */
  dirty: DirtyFields;

  /** Whether all fields are valid (no errors) */
  isValid: boolean;

  /** Whether validation is currently running */
  isValidating: boolean;

  /** Number of times the form has been submitted */
  submitCount: number;

  /** Whether the form is currently submitting */
  isSubmitting: boolean;

  /** Whether the form was submitted successfully */
  isSubmitSuccessful: boolean;
}

/**
 * Initial validation state.
 */
export const initialValidationState: ValidationState = {
  errors: {},
  touched: {},
  dirty: {},
  isValid: true,
  isValidating: false,
  submitCount: 0,
  isSubmitting: false,
  isSubmitSuccessful: false,
};

// ============================================================================
// Validation Options
// ============================================================================

/**
 * Options for form validation behavior.
 */
export interface ValidationOptions<T extends z.ZodType = z.ZodType> {
  /** Zod schema for validation */
  schema?: T;

  /** When to run validation initially */
  mode?: ValidationMode;

  /** When to re-validate after the first validation */
  reValidateMode?: ReValidateMode;

  /** Custom validation function (runs after schema validation) */
  validate?: (values: z.infer<T>) => FieldErrors | Promise<FieldErrors>;

  /** Whether to validate on mount */
  validateOnMount?: boolean;

  /** Delay validation by this many milliseconds (for onChange) */
  validationDelay?: number;
}

// ============================================================================
// Validation Result
// ============================================================================

/**
 * Result of validating a single field.
 */
export interface FieldValidationResult {
  /** Whether the field is valid */
  isValid: boolean;

  /** Error message if invalid */
  error?: string;

  /** The validated/transformed value */
  value?: unknown;
}

/**
 * Result of validating the entire form.
 */
export interface FormValidationResult<T = unknown> {
  /** Whether the form is valid */
  isValid: boolean;

  /** Map of field paths to error messages */
  errors: FieldErrors;

  /** The validated/transformed data if valid */
  data?: T;
}

// ============================================================================
// Validation Actions
// ============================================================================

/**
 * Actions for manipulating validation state.
 */
export interface ValidationActions {
  /** Set error for a specific field */
  setError: (path: FieldPath, error: FieldError) => void;

  /** Clear error for a specific field */
  clearError: (path: FieldPath) => void;

  /** Clear all errors */
  clearErrors: () => void;

  /** Set multiple errors at once */
  setErrors: (errors: FieldErrors) => void;

  /** Mark a field as touched */
  setTouched: (path: FieldPath, touched?: boolean) => void;

  /** Mark a field as dirty */
  setDirty: (path: FieldPath, dirty?: boolean) => void;

  /** Reset validation state to initial */
  resetValidation: () => void;

  /** Validate a single field */
  validateField: (path: FieldPath) => Promise<FieldValidationResult>;

  /** Validate the entire form */
  validateForm: () => Promise<FormValidationResult>;

  /** Set submitting state */
  setSubmitting: (isSubmitting: boolean) => void;

  /** Increment submit count */
  incrementSubmitCount: () => void;

  /** Set submit successful state */
  setSubmitSuccessful: (isSuccessful: boolean) => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Converts a path array to a dot-notation string.
 * Uses dot notation for all segments, including numeric indices.
 * Example: ["items", 0, "name"] -> "items.0.name"
 */
export function pathToString(path: FieldPath): string {
  if (typeof path === "string") return path;
  return path.map(String).join(".");
}

/**
 * Converts a dot-notation string to a path array.
 */
export function stringToPathArray(path: string): (string | number)[] {
  if (!path) return [];

  const result: (string | number)[] = [];
  const regex = /([^.[\]]+)|\[(\d+)\]/g;
  let match;

  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      result.push(match[1]);
    } else if (match[2] !== undefined) {
      result.push(parseInt(match[2], 10));
    }
  }

  return result;
}

/**
 * Normalizes a path to array format.
 */
export function normalizePath(path: FieldPath): (string | number)[] {
  if (typeof path === "string") {
    return stringToPathArray(path);
  }
  return path;
}
