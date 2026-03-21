/**
 * Validation Store
 *
 * Zustand-based store for managing form validation state.
 * Provides state for errors, touched/dirty fields, and validation status.
 *
 * @module validation/store
 */

import { createStore, type StoreApi } from "zustand";
import { z } from "zod";
import {
  type FieldPath,
  type FieldError,
  type FieldErrors,
  type ValidationState,
  type ValidationMode,
  type ReValidateMode,
  type FieldValidationResult,
  type FormValidationResult,
  initialValidationState,
  pathToString,
} from "./types";
import {
  validateFieldAsync,
  validateFormAsync,
  hasErrors,
} from "./validate";

// ============================================================================
// Types
// ============================================================================

/**
 * Complete validation store state and actions.
 */
export interface ValidationStore extends ValidationState {
  // ---- Configuration ----
  /** Zod schema for validation */
  schema: z.ZodType | undefined;

  /** Validation mode */
  mode: ValidationMode;

  /** Re-validation mode */
  reValidateMode: ReValidateMode;

  /** Reference to form data getter */
  getFormData: () => unknown;

  /** Reference to get initial form data (for dirty checking) */
  getInitialData: () => unknown;

  // ---- Error Actions ----
  /** Set error for a specific field */
  setError: (path: FieldPath, error: FieldError) => void;

  /** Clear error for a specific field */
  clearError: (path: FieldPath) => void;

  /** Clear all errors */
  clearErrors: () => void;

  /** Set multiple errors at once */
  setErrors: (errors: FieldErrors) => void;

  // ---- Touched/Dirty Actions ----
  /** Mark a field as touched */
  setTouched: (path: FieldPath, touched?: boolean) => void;

  /** Mark a field as dirty */
  setDirty: (path: FieldPath, dirty?: boolean) => void;

  /** Mark multiple fields as touched */
  setTouchedMultiple: (paths: FieldPath[], touched?: boolean) => void;

  // ---- Validation Actions ----
  /** Validate a single field */
  validateField: (path: FieldPath) => Promise<FieldValidationResult>;

  /** Validate the entire form */
  validateForm: () => Promise<FormValidationResult>;

  /** Trigger validation based on mode and event */
  triggerValidation: (
    path: FieldPath,
    event: "change" | "blur" | "submit"
  ) => Promise<void>;

  // ---- Submit Actions ----
  /** Set submitting state */
  setSubmitting: (isSubmitting: boolean) => void;

  /** Increment submit count */
  incrementSubmitCount: () => void;

  /** Set submit successful state */
  setSubmitSuccessful: (isSuccessful: boolean) => void;

  // ---- Reset Actions ----
  /** Reset validation state to initial */
  resetValidation: () => void;

  /** Reset all state including configuration */
  reset: (options?: Partial<ValidationStoreOptions>) => void;
}

export type ValidationStoreApi = StoreApi<ValidationStore>;

/**
 * Options for creating a validation store.
 */
export interface ValidationStoreOptions<T extends z.ZodType = z.ZodType> {
  /** Zod schema for validation */
  schema?: T;

  /** Validation mode */
  mode?: ValidationMode;

  /** Re-validation mode */
  reValidateMode?: ReValidateMode;

  /** Function to get current form data */
  getFormData: () => unknown;

  /** Function to get initial form data (for dirty checking) */
  getInitialData?: () => unknown;
}

// ============================================================================
// Store Factory
// ============================================================================

/**
 * Creates a new validation store instance.
 *
 * @param options - Configuration options for the store
 * @returns A Zustand store API for validation state
 *
 * @example
 * ```tsx
 * const validationStore = createValidationStore({
 *   schema: userSchema,
 *   mode: 'onBlur',
 *   getFormData: () => formStore.getState().data,
 * });
 *
 * // Validate a field
 * await validationStore.getState().validateField('email');
 *
 * // Check for errors
 * const hasErrors = !validationStore.getState().isValid;
 * ```
 */
export function createValidationStore(
  options: ValidationStoreOptions
): ValidationStoreApi {
  const {
    schema,
    mode = "onSubmit",
    reValidateMode = "onChange",
    getFormData,
    getInitialData = () => ({}),
  } = options;

  return createStore<ValidationStore>((set, get) => ({
    // ---- Initial State ----
    ...initialValidationState,
    schema,
    mode,
    reValidateMode,
    getFormData,
    getInitialData,

    // ---- Error Actions ----
    setError: (path: FieldPath, error: FieldError) => {
      const pathStr = pathToString(path);
      set((state) => {
        const newErrors = { ...state.errors };
        if (error === undefined) {
          delete newErrors[pathStr];
        } else {
          newErrors[pathStr] = error;
        }
        return {
          errors: newErrors,
          isValid: !hasErrors(newErrors),
        };
      });
    },

    clearError: (path: FieldPath) => {
      const pathStr = pathToString(path);
      set((state) => {
        const newErrors = { ...state.errors };
        delete newErrors[pathStr];
        return {
          errors: newErrors,
          isValid: !hasErrors(newErrors),
        };
      });
    },

    clearErrors: () => {
      set({
        errors: {},
        isValid: true,
      });
    },

    setErrors: (errors: FieldErrors) => {
      set({
        errors,
        isValid: !hasErrors(errors),
      });
    },

    // ---- Touched/Dirty Actions ----
    setTouched: (path: FieldPath, touched = true) => {
      const pathStr = pathToString(path);
      set((state) => ({
        touched: { ...state.touched, [pathStr]: touched },
      }));
    },

    setDirty: (path: FieldPath, dirty = true) => {
      const pathStr = pathToString(path);
      set((state) => ({
        dirty: { ...state.dirty, [pathStr]: dirty },
      }));
    },

    setTouchedMultiple: (paths: FieldPath[], touched = true) => {
      set((state) => {
        const newTouched = { ...state.touched };
        for (const path of paths) {
          newTouched[pathToString(path)] = touched;
        }
        return { touched: newTouched };
      });
    },

    // ---- Validation Actions ----
    validateField: async (path: FieldPath): Promise<FieldValidationResult> => {
      const { schema: currentSchema, getFormData: getData } = get();

      if (!currentSchema) {
        return { isValid: true };
      }

      set({ isValidating: true });

      try {
        const formData = getData();
        const value = getValueAtPath(formData, path);
        const result = await validateFieldAsync(currentSchema, path, value);

        const pathStr = pathToString(path);
        set((state) => {
          const newErrors = { ...state.errors };
          if (result.isValid) {
            delete newErrors[pathStr];
          } else {
            newErrors[pathStr] = result.error;
          }
          return {
            errors: newErrors,
            isValid: !hasErrors(newErrors),
            isValidating: false,
          };
        });

        return result;
      } catch (error) {
        set({ isValidating: false });
        return {
          isValid: false,
          error: error instanceof Error ? error.message : "Validation failed",
        };
      }
    },

    validateForm: async (): Promise<FormValidationResult> => {
      const { schema: currentSchema, getFormData: getData } = get();

      if (!currentSchema) {
        return { isValid: true, errors: {} };
      }

      set({ isValidating: true });

      try {
        const formData = getData();
        const result = await validateFormAsync(currentSchema, formData);

        set({
          errors: result.errors,
          isValid: result.isValid,
          isValidating: false,
        });

        return result;
      } catch (error) {
        set({ isValidating: false });
        const errorMsg =
          error instanceof Error ? error.message : "Validation failed";
        return {
          isValid: false,
          errors: { "": errorMsg },
        };
      }
    },

    triggerValidation: async (
      path: FieldPath,
      event: "change" | "blur" | "submit"
    ): Promise<void> => {
      const { mode, reValidateMode, submitCount, touched } = get();
      const pathStr = pathToString(path);
      const hasBeenSubmitted = submitCount > 0;
      const isTouched = touched[pathStr] ?? false;

      // Determine if we should validate based on mode and event
      let shouldValidate = false;

      if (hasBeenSubmitted) {
        // After first submit, use reValidateMode
        if (event === "submit") shouldValidate = true;
        else if (reValidateMode === "onChange" && event === "change")
          shouldValidate = true;
        else if (reValidateMode === "onBlur" && event === "blur")
          shouldValidate = true;
      } else {
        // Before first submit, use mode
        if (mode === "onSubmit" && event === "submit") shouldValidate = true;
        else if (mode === "onChange" && event === "change")
          shouldValidate = true;
        else if (mode === "onBlur" && event === "blur") shouldValidate = true;
        else if (mode === "onTouched" && event === "blur" && !isTouched) {
          // First blur triggers validation in onTouched mode
          shouldValidate = true;
        } else if (mode === "onTouched" && isTouched && event === "change") {
          // After touched, validate on change
          shouldValidate = true;
        }
      }

      if (shouldValidate) {
        await get().validateField(path);
      }
    },

    // ---- Submit Actions ----
    setSubmitting: (isSubmitting: boolean) => {
      set({ isSubmitting });
    },

    incrementSubmitCount: () => {
      set((state) => ({
        submitCount: state.submitCount + 1,
      }));
    },

    setSubmitSuccessful: (isSuccessful: boolean) => {
      set({ isSubmitSuccessful: isSuccessful });
    },

    // ---- Reset Actions ----
    resetValidation: () => {
      set({
        ...initialValidationState,
      });
    },

    reset: (newOptions?: Partial<ValidationStoreOptions>) => {
      set({
        ...initialValidationState,
        schema: newOptions?.schema ?? get().schema,
        mode: newOptions?.mode ?? get().mode,
        reValidateMode: newOptions?.reValidateMode ?? get().reValidateMode,
        getFormData: newOptions?.getFormData ?? get().getFormData,
        getInitialData: newOptions?.getInitialData ?? get().getInitialData,
      });
    },
  }));
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a value at a path from an object.
 */
function getValueAtPath(obj: unknown, path: FieldPath): unknown {
  if (typeof path === "string") {
    return getValueAtPath(obj, stringToPathArray(path));
  }

  let current: unknown = obj;
  for (const segment of path) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === "object") {
      current = (current as Record<string | number, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Convert a dot-notation string to a path array.
 */
function stringToPathArray(path: string): (string | number)[] {
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
