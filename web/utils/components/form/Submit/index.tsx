/**
 * Form.Submit Component
 *
 * Submit button with loading state management and form state awareness.
 * Supports render props for advanced customization.
 *
 * @module Submit
 */

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { useEvent, type SubmitEventPayload } from "../provider";
import { useEventEmitter } from "#web/utils/components/event-emitter";
import {
  useFormIsValid,
  useFormIsSubmitting,
  useFormErrors,
  useValidationStoreApiOptional,
} from "../validation/hooks";
import type { FieldErrors } from "../validation/types";

// ============================================================================
// Types
// ============================================================================

/**
 * Form state exposed to render props.
 */
export interface SubmitFormState {
  /**
   * Whether the form is currently submitting (local loading state).
   */
  isSubmitting: boolean;

  /**
   * Whether the form is valid according to the schema.
   * Always true if no schema is provided.
   */
  isValid: boolean;

  /**
   * Current form errors.
   * Empty object if no errors or no schema.
   */
  errors: FieldErrors;

  /**
   * Whether the form has any errors.
   */
  hasErrors: boolean;
}

/**
 * Render prop function type.
 */
export type SubmitRenderProp = (state: SubmitFormState) => ReactNode;

export interface SubmitProps<T = unknown> extends CoreButtonProps {
  /**
   * Handler called when the form is submitted and validation passes.
   */
  onSubmit: (state: T) => Promise<unknown>;

  /**
   * Handler called when onSubmit throws an error.
   */
  onError?: (error: unknown) => void;

  /**
   * Handler called after successful submission.
   */
  onSuccess?: <P>(payload: P) => void;

  /**
   * Handler called when the loading state changes.
   */
  onLoadingChange?: (loading: boolean) => void;

  /**
   * Children can be a ReactNode or a render prop function.
   *
   * @example
   * // Static children
   * <Form.Submit onSubmit={handleSubmit}>Save</Form.Submit>
   *
   * // Render prop
   * <Form.Submit onSubmit={handleSubmit}>
   *   {({ isSubmitting, isValid }) => (
   *     <span>{isSubmitting ? "Saving..." : "Save"}</span>
   *   )}
   * </Form.Submit>
   */
  children?: ReactNode | SubmitRenderProp;

  /**
   * Whether to disable the button when the form is invalid.
   * Defaults to false to allow users to click and see validation errors.
   */
  disableWhenInvalid?: boolean;
}

type CoreButtonProps = Omit<
  JSX.IntrinsicElements["button"],
  "type" | "onSubmit" | "children"
>;

// ============================================================================
// Component
// ============================================================================

/**
 * Form.Submit - Submit button component
 *
 * Handles form submission with loading state, error handling,
 * and optional validation state awareness.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Form.Submit onSubmit={handleSubmit}>Save</Form.Submit>
 *
 * // With render props for loading state
 * <Form.Submit onSubmit={handleSubmit}>
 *   {({ isSubmitting }) => (isSubmitting ? "Saving..." : "Save")}
 * </Form.Submit>
 *
 * // Disable when form is invalid
 * <Form.Submit onSubmit={handleSubmit} disableWhenInvalid>
 *   Save
 * </Form.Submit>
 *
 * // Full render props with form state
 * <Form.Submit onSubmit={handleSubmit}>
 *   {({ isSubmitting, isValid, hasErrors }) => (
 *     <button disabled={isSubmitting || !isValid}>
 *       {isSubmitting ? "Saving..." : hasErrors ? "Fix errors" : "Save"}
 *     </button>
 *   )}
 * </Form.Submit>
 * ```
 */
export function Submit<T = unknown>({
  onSubmit,
  onError,
  onSuccess,
  onLoadingChange,
  children,
  disabled,
  disableWhenInvalid = false,
  ...core
}: SubmitProps<T>) {
  const [loading, setLoading] = useState(false);
  const event = useEvent();
  const emitter = useEventEmitter();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get validation state if available
  const validationStore = useValidationStoreApiOptional();
  const isValid = validationStore ? useFormIsValid() : true;
  const errors = validationStore ? useFormErrors() : {};

  // Notify parent component when loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    const handler = async (args: unknown) => {
      let formData: T;
      let submitter: HTMLElement | null | undefined;

      if (isSubmitEventPayload<T>(args)) {
        formData = args.payload;
        submitter = args.submitter;
      } else {
        formData = args as T;
      }

      // If a specific submitter triggered the event, ensure it matches this button
      if (submitter && buttonRef.current && submitter !== buttonRef.current) {
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.log("formData", formData);
      }

      setLoading(true);
      try {
        const payload = await onSubmit(formData);
        onSuccess?.(payload);
        emitter.emit(event.SUBMIT_SUCCESS, payload);
      } catch (error) {
        onError?.(error);

        // Error is caught to prevent unhandled rejection.
        // The component recovers silently - SUBMIT_SUCCESS is not emitted.
        // Consumer can handle the error in onSubmit if needed.
        if (process.env.NODE_ENV === "development") {
          console.error("Submit error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = emitter.on(event.SUBMIT, handler);

    return () => {
      unsubscribe();
    };
  }, [emitter, event.SUBMIT, event.SUBMIT_SUCCESS, onSubmit, onError, onSuccess]);

  // Build form state for render props
  const formState: SubmitFormState = {
    isSubmitting: loading,
    isValid,
    errors,
    hasErrors: Object.keys(errors).length > 0,
  };

  // Resolve children (render prop or static)
  const resolvedChildren =
    typeof children === "function" ? children(formState) : children;

  // Compute disabled state
  const isDisabled =
    loading || disabled || (disableWhenInvalid && !isValid);

  return createElement("button", {
    ...core,
    ref: buttonRef,
    type: "submit",
    disabled: isDisabled,
    children: resolvedChildren,
  });
}

// ============================================================================
// Helpers
// ============================================================================

function isSubmitEventPayload<T>(data: unknown): data is SubmitEventPayload<T> {
  return (
    typeof data === "object" &&
    data !== null &&
    "submitter" in data &&
    "payload" in data
  );
}

// ============================================================================
// Legacy exports for backward compatibility
// ============================================================================

/** @deprecated Use SubmitProps instead */
export type Props<T = unknown> = SubmitProps<T>;

export default Submit;
