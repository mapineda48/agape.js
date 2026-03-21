/**
 * Form.Error Component
 *
 * Displays validation error messages for a field.
 * Automatically associates with the parent Form.Field or can be used standalone.
 *
 * @module Field/Error
 */

import { forwardRef, type ReactNode, type JSX } from "react";
import { useFieldContextOptional } from "./context";
import { useFieldError } from "../validation";
import { pathToString } from "../validation/types";
import { usePaths } from "../paths";

// ============================================================================
// Types
// ============================================================================

export interface ErrorProps
  extends Omit<JSX.IntrinsicElements["span"], "children"> {
  /**
   * Explicit field name/path to show error for.
   * If not provided and inside a Form.Field, it will use the field's name.
   */
  name?: string;

  /**
   * Render prop for custom error rendering.
   * If provided, children are ignored.
   */
  children?: ReactNode | ((error: string) => ReactNode);

  /**
   * Whether to render the component even when there's no error.
   * Useful for layout stability.
   */
  renderEmpty?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Form.Error - Error message component
 *
 * Displays the validation error for a field.
 * Automatically integrates with Form.Field context for accessibility (aria-describedby).
 *
 * @example
 * ```tsx
 * // Inside Form.Field - automatic association
 * <Form.Field name="email">
 *   <Form.Label>Email</Form.Label>
 *   <Form.Text />
 *   <Form.Error />
 * </Form.Field>
 *
 * // Standalone usage with explicit name
 * <Form.Error name="email" />
 *
 * // With custom rendering
 * <Form.Error name="email">
 *   {(error) => <span className="text-red-500">{error}</span>}
 * </Form.Error>
 *
 * // With renderEmpty for layout stability
 * <Form.Error name="email" renderEmpty className="h-5" />
 * ```
 */
export const Error = forwardRef<HTMLSpanElement, ErrorProps>(
  ({ name, children, renderEmpty = false, ...props }, ref) => {
    // Try to get field context (may be null if used standalone)
    const fieldContext = useFieldContextOptional();

    // Get the full path from PathProvider context
    // When inside Form.Field, the PathProvider already has the complete path
    const fullPath = usePaths();

    // Determine which field to get error for:
    // 1. If explicit name prop is provided, use it
    // 2. If inside Form.Field (with PathProvider), use the full path
    // 3. Fall back to fieldContext.name for backwards compatibility
    const fieldPath = name ?? (fullPath.length > 0 ? pathToString(fullPath) : fieldContext?.name);

    // Get error from validation store (must be called unconditionally per rules of hooks)
    const error = useFieldError(fieldPath ?? "");

    if (!fieldPath) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "Form.Error: No field name provided and not inside a Form.Field. " +
            "Either provide a 'name' prop or use within a Form.Field."
        );
      }
      return null;
    }

    // Don't render if no error and not renderEmpty
    if (!error && !renderEmpty) {
      return null;
    }

    // Determine the id for aria-describedby
    const errorId = fieldContext?.errorId ?? `error-${pathToString(fieldPath)}`;

    // Handle render prop children
    const content =
      typeof children === "function"
        ? error
          ? children(error)
          : null
        : children ?? error;

    return (
      <span
        {...props}
        ref={ref}
        id={errorId}
        role="alert"
        aria-live="polite"
        data-error={error ? "true" : "false"}
      >
        {content}
      </span>
    );
  }
);

Error.displayName = "Form.Error";

export default Error;
