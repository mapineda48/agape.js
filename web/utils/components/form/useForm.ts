import { useCallback } from "react";
import { useFormStoreApi, useFormActions } from "./store/zustand-provider";
import type { Path } from "./store/zustand";
import {
  deepCloneWithHelpersToSerialized,
  deepCloneWithOutHelpers,
} from "#web/utils/clone";
import { useEventEmitter } from "#web/utils/components/event-emitter";
import { useEvent, type EventForm } from "./provider";

/**
 * Options for form state operations.
 */
export interface FormOptions {
  /**
   * If true, the state will be cloned using deepCloneWithHelpersToSerialized
   * to ensure compatibility with serialization requirements.
   * @default true
   */
  serialize?: boolean;
}

/**
 * Return type of the useForm hook.
 * Provides action methods without causing re-renders on state changes.
 */
export interface UseFormReturn {
  /**
   * Completely replaces the form state with a new state.
   * All existing values will be removed and replaced with the new state.
   */
  reset: <S extends object>(newState: S, options?: FormOptions) => void;

  /**
   * Merges partial state into the current form state.
   * Existing values not specified in the partial state are preserved.
   */
  merge: <S extends Record<string, unknown>>(
    partialState: S,
    options?: FormOptions,
  ) => void;

  /**
   * Sets a value at a specific path in the form state.
   * Useful for updating a specific subtree of the form.
   */
  setAt: <V>(path: Path, value: V, options?: FormOptions) => void;

  /**
   * Returns the current form values as a snapshot.
   * This is an imperative read that does not cause re-renders.
   */
  getValues: <T = unknown>() => T;

  /**
   * Event symbols for the form (SUBMIT, SUBMIT_SUCCESS).
   */
  events: EventForm;

  /**
   * Event emitter for subscribing to and emitting form events.
   */
  emitter: ReturnType<typeof useEventEmitter>;
}

/**
 * Hook for form actions without reactive state subscription.
 * Use this when you only need to perform actions (reset, merge, setAt)
 * without subscribing to state changes.
 *
 * For reactive state, use `Form.useState()` instead.
 *
 * @example
 * ```tsx
 * function UserForm({ userId }) {
 *   const form = Form.useForm();
 *
 *   useEffect(() => {
 *     fetchUser(userId).then(data => {
 *       form.reset(data); // No re-render triggered by this hook
 *     });
 *   }, [userId, form]);
 *
 *   return (
 *     <Form.Root>
 *       <Form.Text path="name" />
 *     </Form.Root>
 *   );
 * }
 * ```
 */
export function useForm(): UseFormReturn {
  const store = useFormStoreApi();
  const actions = useFormActions();
  const eventContext = useEvent();
  const emitter = useEventEmitter();

  /**
   * Completely replaces the form state with a new state.
   */
  const reset = useCallback(
    <S extends object>(newState: S, options?: FormOptions) => {
      const serialize = options?.serialize ?? true;
      const state = serialize
        ? deepCloneWithHelpersToSerialized(newState)
        : newState;
      actions.resetState(state);
    },
    [actions],
  );

  /**
   * Merges partial state into the current form state.
   */
  const merge = useCallback(
    <S extends Record<string, unknown>>(
      partialState: S,
      options?: FormOptions,
    ) => {
      const serialize = options?.serialize ?? true;
      const state = serialize
        ? deepCloneWithHelpersToSerialized(partialState)
        : partialState;

      // Set each key individually to merge rather than replace
      Object.entries(state).forEach(([key, value]) => {
        actions.setAtPath([key], value);
      });
    },
    [actions],
  );

  /**
   * Sets a value at a specific path in the form state.
   */
  const setAt = useCallback(
    <V>(path: Path, value: V, options?: FormOptions) => {
      const serialize = options?.serialize ?? true;
      const serializedValue = serialize
        ? deepCloneWithHelpersToSerialized(value)
        : value;
      actions.setAtPath(path, serializedValue);
    },
    [actions],
  );

  /**
   * Returns the current form values as a snapshot (imperative read).
   */
  const getValues = useCallback(<T = unknown>(): T => {
    const rawData = store.getState().data;
    return deepCloneWithOutHelpers(rawData) as T;
  }, [store]);

  return {
    reset,
    merge,
    setAt,
    getValues,
    events: eventContext,
    emitter,
  };
}

export default useForm;
