import { useCallback, useEffect, useRef } from "react";
import { usePaths, type Path } from "../paths";
import { useSelectPath } from "../store/hooks";
import { useFormActions } from "../store/zustand-provider";
import { useValidationStoreApiOptional } from "../validation/hooks";
import { pathToString } from "../validation/types";

/**
 * Options for the useInput hook.
 */
export interface UseInputOptions {
  /**
   * If true, immediately writes the default value to the store on mount
   * when there is no existing value at that path.
   */
  materialize?: boolean;
  /**
   * If true, removes the value from the store when the component unmounts.
   * This also cleans up any empty parent objects/arrays created by this path.
   */
  autoCleanup?: boolean;
  /**
   * If true, triggers validation when the input value changes.
   * Only works if the form has a validation schema.
   */
  validateOnChange?: boolean;
  /**
   * If true, triggers validation when the input loses focus.
   * Only works if the form has a validation schema.
   */
  validateOnBlur?: boolean;
}

/**
 * Return type for useInput hook with validation support.
 */
export interface UseInputReturn<T> {
  /**
   * Current value of the input.
   */
  value: T;
  /**
   * Set the value of the input.
   */
  setValue: (value: T) => void;
  /**
   * Handler for blur events - marks field as touched and optionally validates.
   */
  onBlur: () => void;
  /**
   * Handler for change events - marks field as dirty and optionally validates.
   */
  onChange: (value: T) => void;
  /**
   * Error message for the field (undefined if no error or no validation).
   */
  error: string | undefined;
  /**
   * Whether the field has been touched (focused and blurred).
   */
  isTouched: boolean;
  /**
   * Whether the field value has changed from initial.
   */
  isDirty: boolean;
  /**
   * Whether the field has an error.
   */
  hasError: boolean;
}

/**
 * Hook to bind a form input to a path in the form store.
 * Optionally integrates with form validation.
 *
 * @param path - The path within the form store where this input's value is stored
 * @param defaultValue - Default value to use when there's no value at the path
 * @param options - Configuration options for materialization, cleanup, and validation behavior
 * @returns Object with value, setValue, handlers, and validation state
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { value, setValue } = useInput('name', '');
 *
 * // With validation on blur
 * const { value, onChange, onBlur, error, isTouched } = useInput('email', '', {
 *   validateOnBlur: true,
 * });
 *
 * return (
 *   <div>
 *     <input
 *       value={value}
 *       onChange={(e) => onChange(e.target.value)}
 *       onBlur={onBlur}
 *     />
 *     {isTouched && error && <span className="error">{error}</span>}
 *   </div>
 * );
 * ```
 */
export default function useInput<T = unknown>(
  path: Path,
  defaultValue?: T,
  options?: UseInputOptions
): UseInputReturn<T> {
  const paths = usePaths(path);
  const rawValue = useSelectPath<T>(paths);
  const value = rawValue !== undefined ? rawValue : defaultValue;
  const actions = useFormActions();
  const deps = paths.join("|");
  const pathStr = pathToString(paths);

  // Validation store (optional - may be null if no schema)
  const validationStore = useValidationStoreApiOptional();

  // Keep a ref to the latest path for cleanup to avoid stale closures
  const pathsRef = useRef(paths);
  pathsRef.current = paths;

  // Keep a ref to latest pathStr for callbacks
  const pathStrRef = useRef(pathStr);
  pathStrRef.current = pathStr;

  // Materialize: Initialize only if no value yet and defaultValue was provided
  useEffect(() => {
    if (
      rawValue === undefined &&
      typeof defaultValue !== "undefined" &&
      options?.materialize
    ) {
      actions.setAtPath(paths, defaultValue);
    }
  }, [rawValue, actions, defaultValue, deps, options?.materialize]);

  // AutoCleanup: Remove value from store when component unmounts
  useEffect(() => {
    if (!options?.autoCleanup) return;

    return () => {
      actions.deleteAtPath(pathsRef.current);
    };
  }, [actions, options?.autoCleanup]);

  // Basic setValue function
  const setValue = useCallback(
    function setValue(value: T) {
      actions.setAtPath(paths, value);
    },
    [actions, deps]
  );

  // onChange handler with optional validation
  const onChange = useCallback(
    function onChange(newValue: T) {
      actions.setAtPath(paths, newValue);

      if (validationStore) {
        const store = validationStore.getState();
        // Mark as dirty
        store.setDirty(pathStrRef.current, true);

        // Trigger validation if configured
        if (options?.validateOnChange) {
          store.triggerValidation(pathStrRef.current, "change");
        }
      }
    },
    [actions, deps, validationStore, options?.validateOnChange]
  );

  // onBlur handler with optional validation
  const onBlur = useCallback(
    function onBlur() {
      if (validationStore) {
        const store = validationStore.getState();
        // Mark as touched
        store.setTouched(pathStrRef.current, true);

        // Trigger validation if configured
        if (options?.validateOnBlur) {
          store.triggerValidation(pathStrRef.current, "blur");
        }
      }
    },
    [validationStore, options?.validateOnBlur]
  );

  // Get validation state from store (or defaults if no validation)
  const error = validationStore
    ? validationStore.getState().errors[pathStr]
    : undefined;

  const isTouched = validationStore
    ? validationStore.getState().touched[pathStr] ?? false
    : false;

  const isDirty = validationStore
    ? validationStore.getState().dirty[pathStr] ?? false
    : false;

  return {
    value: value as T,
    setValue,
    onChange,
    onBlur,
    error,
    isTouched,
    isDirty,
    hasError: error !== undefined,
  };
}
