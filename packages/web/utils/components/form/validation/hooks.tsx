/* eslint-disable react-refresh/only-export-components */
/**
 * Validation Hooks
 *
 * React hooks for accessing validation state in form components.
 * Provides hooks for field-level and form-level validation state.
 *
 * @module validation/hooks
 */

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";
import {
  createValidationStore,
  type ValidationStoreApi,
  type ValidationStoreOptions,
} from "./store";
import {
  type FieldPath,
  type FieldError,
  type FieldErrors,
  type ValidationState,
  pathToString,
} from "./types";

// ============================================================================
// Context
// ============================================================================

const ValidationStoreContext = createContext<ValidationStoreApi | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Props for ValidationStoreProvider component.
 */
export interface ValidationStoreProviderProps {
  children: ReactNode;
  /**
   * Options for the validation store.
   */
  options: ValidationStoreOptions;
}

/**
 * ValidationStoreProvider
 *
 * Provides a validation store context for form components.
 * Should be used within a Form.Root component.
 */
export function ValidationStoreProvider({
  children,
  options,
}: ValidationStoreProviderProps) {
  // Create store once on mount
  const [store] = useState(() => createValidationStore(options));

  return (
    <ValidationStoreContext.Provider value={store}>
      {children}
    </ValidationStoreContext.Provider>
  );
}

// ============================================================================
// Core Hooks
// ============================================================================

/**
 * Hook to get the raw validation store API.
 * Useful for imperative operations like getState().
 *
 * @throws Error if used outside of a ValidationStoreProvider
 */
export function useValidationStoreApi(): ValidationStoreApi {
  const store = useContext(ValidationStoreContext);
  if (!store) {
    throw new Error(
      "useValidationStoreApi must be used within a ValidationStoreProvider (Form.Root)"
    );
  }
  return store;
}

/**
 * Hook to safely get the validation store API.
 * Returns null if not inside a provider (useful for optional validation).
 */
export function useValidationStoreApiOptional(): ValidationStoreApi | null {
  return useContext(ValidationStoreContext);
}

/**
 * Hook to get the validation store actions.
 * Does not cause re-renders when store state changes.
 */
export function useValidationActions() {
  const store = useValidationStoreApi();

  return useMemo(
    () => ({
      setError: (path: FieldPath, error: FieldError) =>
        store.getState().setError(path, error),
      clearError: (path: FieldPath) => store.getState().clearError(path),
      clearErrors: () => store.getState().clearErrors(),
      setErrors: (errors: FieldErrors) => store.getState().setErrors(errors),
      setTouched: (path: FieldPath, touched?: boolean) =>
        store.getState().setTouched(path, touched),
      setDirty: (path: FieldPath, dirty?: boolean) =>
        store.getState().setDirty(path, dirty),
      validateField: (path: FieldPath) => store.getState().validateField(path),
      validateForm: () => store.getState().validateForm(),
      triggerValidation: (
        path: FieldPath,
        event: "change" | "blur" | "submit"
      ) => store.getState().triggerValidation(path, event),
      setSubmitting: (isSubmitting: boolean) =>
        store.getState().setSubmitting(isSubmitting),
      incrementSubmitCount: () => store.getState().incrementSubmitCount(),
      setSubmitSuccessful: (isSuccessful: boolean) =>
        store.getState().setSubmitSuccessful(isSuccessful),
      resetValidation: () => store.getState().resetValidation(),
    }),
    [store]
  );
}

// ============================================================================
// Field-Level Hooks
// ============================================================================

/**
 * Hook to get the error for a specific field.
 * Only re-renders when the error for this field changes.
 *
 * @param path - Path to the field
 * @returns Error message or undefined if no error
 *
 * @example
 * ```tsx
 * function EmailInput() {
 *   const error = useFieldError('email');
 *   return (
 *     <div>
 *       <input type="email" />
 *       {error && <span className="error">{error}</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFieldError(path: FieldPath): FieldError {
  const store = useValidationStoreApiOptional();
  const pathStr = pathToString(path);

  return useStoreWithEqualityFn(
    store!,
    (state) => (store ? state.errors[pathStr] : undefined),
    Object.is
  );
}

/**
 * Hook to check if a field has been touched.
 *
 * @param path - Path to the field
 * @returns Whether the field has been touched
 */
export function useFieldTouched(path: FieldPath): boolean {
  const store = useValidationStoreApiOptional();
  const pathStr = pathToString(path);

  return useStoreWithEqualityFn(
    store!,
    (state) => (store ? state.touched[pathStr] ?? false : false),
    Object.is
  );
}

/**
 * Hook to check if a field is dirty (value differs from initial).
 *
 * @param path - Path to the field
 * @returns Whether the field is dirty
 */
export function useFieldDirty(path: FieldPath): boolean {
  const store = useValidationStoreApiOptional();
  const pathStr = pathToString(path);

  return useStoreWithEqualityFn(
    store!,
    (state) => (store ? state.dirty[pathStr] ?? false : false),
    Object.is
  );
}

/**
 * Hook to get all field state at once.
 *
 * @param path - Path to the field
 * @returns Object with error, touched, and dirty state
 */
export function useFieldState(path: FieldPath): {
  error: FieldError;
  isTouched: boolean;
  isDirty: boolean;
  hasError: boolean;
} {
  const store = useValidationStoreApiOptional();
  const pathStr = pathToString(path);

  const error = useStoreWithEqualityFn(
    store!,
    (state) => (store ? state.errors[pathStr] : undefined),
    Object.is
  );

  const isTouched = useStoreWithEqualityFn(
    store!,
    (state) => (store ? state.touched[pathStr] ?? false : false),
    Object.is
  );

  const isDirty = useStoreWithEqualityFn(
    store!,
    (state) => (store ? state.dirty[pathStr] ?? false : false),
    Object.is
  );

  return useMemo(
    () => ({
      error,
      isTouched,
      isDirty,
      hasError: error !== undefined,
    }),
    [error, isTouched, isDirty]
  );
}

// ============================================================================
// Form-Level Hooks
// ============================================================================

/**
 * Hook to get the form validation state.
 * Re-renders when any validation state changes.
 *
 * @example
 * ```tsx
 * function FormStatus() {
 *   const { isValid, isValidating, submitCount } = useFormValidationState();
 *   return (
 *     <div>
 *       {isValidating && <span>Validating...</span>}
 *       {!isValid && <span>Form has errors</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFormValidationState(): ValidationState {
  const store = useValidationStoreApi();

  return useStore(store, (state) => ({
    errors: state.errors,
    touched: state.touched,
    dirty: state.dirty,
    isValid: state.isValid,
    isValidating: state.isValidating,
    submitCount: state.submitCount,
    isSubmitting: state.isSubmitting,
    isSubmitSuccessful: state.isSubmitSuccessful,
  }));
}

/**
 * Hook to get all form errors.
 * Re-renders when any error changes.
 */
export function useFormErrors(): FieldErrors {
  const store = useValidationStoreApi();
  return useStore(store, (state) => state.errors);
}

/**
 * Hook to check if the form is valid.
 * Only re-renders when isValid changes.
 */
export function useFormIsValid(): boolean {
  const store = useValidationStoreApi();
  return useStoreWithEqualityFn(store, (state) => state.isValid, Object.is);
}

/**
 * Hook to check if the form is currently validating.
 */
export function useFormIsValidating(): boolean {
  const store = useValidationStoreApi();
  return useStoreWithEqualityFn(
    store,
    (state) => state.isValidating,
    Object.is
  );
}

/**
 * Hook to check if the form is currently submitting.
 */
export function useFormIsSubmitting(): boolean {
  const store = useValidationStoreApi();
  return useStoreWithEqualityFn(
    store,
    (state) => state.isSubmitting,
    Object.is
  );
}

/**
 * Hook to get the form submit count.
 */
export function useFormSubmitCount(): number {
  const store = useValidationStoreApi();
  return useStoreWithEqualityFn(
    store,
    (state) => state.submitCount,
    Object.is
  );
}

// ============================================================================
// Combined Hook
// ============================================================================

/**
 * Hook that provides complete field validation functionality.
 * Combines state access and actions for a single field.
 *
 * @param path - Path to the field
 * @returns Object with state and actions for the field
 *
 * @example
 * ```tsx
 * function EmailField() {
 *   const { error, isTouched, validate, setTouched } = useField('email');
 *
 *   return (
 *     <div>
 *       <input
 *         type="email"
 *         onBlur={() => {
 *           setTouched();
 *           validate();
 *         }}
 *       />
 *       {isTouched && error && <span className="error">{error}</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFieldValidation(path: FieldPath) {
  const store = useValidationStoreApiOptional();
  const pathStr = pathToString(path);

  const error = useStoreWithEqualityFn(
    store!,
    (state) => (store ? state.errors[pathStr] : undefined),
    Object.is
  );

  const isTouched = useStoreWithEqualityFn(
    store!,
    (state) => (store ? state.touched[pathStr] ?? false : false),
    Object.is
  );

  const isDirty = useStoreWithEqualityFn(
    store!,
    (state) => (store ? state.dirty[pathStr] ?? false : false),
    Object.is
  );

  const actions = useMemo(() => {
    if (!store) {
      return {
        validate: async () => ({ isValid: true }),
        setTouched: () => {},
        setDirty: () => {},
        setError: () => {},
        clearError: () => {},
        triggerValidation: async () => {},
      };
    }

    return {
      validate: () => store.getState().validateField(path),
      setTouched: (touched = true) => store.getState().setTouched(path, touched),
      setDirty: (dirty = true) => store.getState().setDirty(path, dirty),
      setError: (err: FieldError) => store.getState().setError(path, err),
      clearError: () => store.getState().clearError(path),
      triggerValidation: (event: "change" | "blur" | "submit") =>
        store.getState().triggerValidation(path, event),
    };
  }, [store, path]);

  return {
    // State
    error,
    isTouched,
    isDirty,
    hasError: error !== undefined,
    // Actions
    ...actions,
  };
}

export default ValidationStoreProvider;
