/**
 * Validation Module
 *
 * Complete validation system for forms using Zod.
 * Exports types, store, hooks, and validation functions.
 *
 * @module validation
 */

// ============================================================================
// Types
// ============================================================================

export {
  // Core types
  type FieldPath,
  type FieldError,
  type FieldErrors,
  type TouchedFields,
  type DirtyFields,
  type ValidationMode,
  type ReValidateMode,
  // State types
  type ValidationState,
  type ValidationOptions,
  type FieldValidationResult,
  type FormValidationResult,
  type ValidationActions,
  // Initial state
  initialValidationState,
  // Utility functions
  pathToString,
  stringToPathArray,
  normalizePath,
} from "./types";

// ============================================================================
// Validation Functions
// ============================================================================

export {
  // Schema utilities
  getSchemaForPath,
  // Field validation
  validateField,
  validateFieldAsync,
  // Form validation
  validateForm,
  validateFormAsync,
  // Error utilities
  zodErrorsToFieldErrors,
  mergeErrors,
  hasErrors,
  clearErrorsByPrefix,
} from "./validate";

// ============================================================================
// Store
// ============================================================================

export {
  // Store types
  type ValidationStore,
  type ValidationStoreApi,
  type ValidationStoreOptions,
  // Store factory
  createValidationStore,
} from "./store";

// ============================================================================
// Hooks & Provider
// ============================================================================

export {
  // Provider
  ValidationStoreProvider,
  type ValidationStoreProviderProps,
  // Core hooks
  useValidationStoreApi,
  useValidationStoreApiOptional,
  useValidationActions,
  // Field-level hooks
  useFieldError,
  useFieldTouched,
  useFieldDirty,
  useFieldState,
  useFieldValidation,
  // Form-level hooks
  useFormValidationState,
  useFormErrors,
  useFormIsValid,
  useFormIsValidating,
  useFormIsSubmitting,
  useFormSubmitCount,
} from "./hooks";
