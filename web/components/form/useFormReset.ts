import { useCallback } from "react";
import { useAppDispatch } from "./store/hooks";
import { resetState, setAtPath, type Path } from "./store/dictSlice";
import { deepCloneWithHelpersToSerialized } from "../../utils/structuredClone";

/**
 * Options for reset operations.
 */
export interface ResetOptions {
  /**
   * If true, the state will be cloned using deepCloneWithHelpersToSerialized
   * to ensure compatibility with Redux's serialization requirements.
   * @default true
   */
  serialize?: boolean;
}

/**
 * Hook that provides methods to reset or merge form state.
 *
 * This is useful when you need to:
 * - Pre-load form data from an external source (e.g., API response)
 * - Reset the form to its initial state
 * - Partially update multiple fields at once based on external events
 *
 * @example
 * // Reset entire form
 * const { reset, merge } = useFormReset();
 *
 * // Pre-load user data
 * useEffect(() => {
 *   if (userData) {
 *     reset({
 *       email: userData.email,
 *       phone: userData.phone,
 *       person: { firstName: userData.firstName, lastName: userData.lastName }
 *     });
 *   }
 * }, [userData, reset]);
 *
 * // Merge partial data
 * merge({ email: "new@email.com", phone: "555-1234" });
 *
 * // Update a subtree
 * setAt(["person"], { firstName: "John", lastName: "Doe" });
 */
export function useFormReset() {
  const dispatch = useAppDispatch();

  /**
   * Completely replaces the form state with a new state.
   * All existing values will be removed and replaced with the new state.
   *
   * @param newState - The new state to set
   * @param options - Options for the reset operation
   */
  const reset = useCallback(
    <T extends object>(newState: T, options?: ResetOptions) => {
      const serialize = options?.serialize ?? true;
      const state = serialize
        ? deepCloneWithHelpersToSerialized(newState)
        : newState;
      dispatch(resetState({ state }));
    },
    [dispatch]
  );

  /**
   * Merges partial state into the current form state.
   * Existing values not specified in the partial state are preserved.
   *
   * @param partialState - Object with key-value pairs to merge into the form state
   * @param options - Options for the merge operation
   */
  const merge = useCallback(
    <T extends Record<string, any>>(
      partialState: T,
      options?: ResetOptions
    ) => {
      const serialize = options?.serialize ?? true;
      const state = serialize
        ? deepCloneWithHelpersToSerialized(partialState)
        : partialState;

      // Set each key individually to merge rather than replace
      Object.entries(state).forEach(([key, value]) => {
        dispatch(setAtPath({ path: [key], value }));
      });
    },
    [dispatch]
  );

  /**
   * Sets a value at a specific path in the form state.
   * Useful for updating a specific subtree of the form.
   *
   * @param path - The path to set the value at
   * @param value - The value to set
   * @param options - Options for the operation
   */
  const setAt = useCallback(
    <T>(path: Path, value: T, options?: ResetOptions) => {
      const serialize = options?.serialize ?? true;
      const serializedValue = serialize
        ? deepCloneWithHelpersToSerialized(value)
        : value;
      dispatch(setAtPath({ path, value: serializedValue }));
    },
    [dispatch]
  );

  return { reset, merge, setAt };
}

export default useFormReset;
