/**
 * Form.Label Component
 *
 * An accessible label component that automatically associates with
 * the input within a Form.Field context.
 *
 * @module Field/Label
 */

import { forwardRef, type JSX } from "react";
import { useFieldContextOptional } from "./context";

// ============================================================================
// Types
// ============================================================================

export interface LabelProps
  extends Omit<JSX.IntrinsicElements["label"], "htmlFor"> {
  /**
   * Explicit htmlFor attribute.
   * If not provided and inside a Form.Field, it will be automatically set.
   */
  htmlFor?: string;

  /**
   * Whether to show a required indicator (*).
   * If not provided, it will be derived from Form.Field's required prop.
   */
  showRequired?: boolean;

  /**
   * Custom required indicator (default: "*").
   */
  requiredIndicator?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Form.Label - Accessible label component
 *
 * Automatically associates with the input in the parent Form.Field.
 * Shows a required indicator when the field is required.
 *
 * @example
 * ```tsx
 * // Inside Form.Field - automatic association
 * <Form.Field name="email" required>
 *   <Form.Label>Email Address</Form.Label>
 *   <Form.Text />
 * </Form.Field>
 *
 * // Standalone usage with explicit htmlFor
 * <Form.Label htmlFor="my-input">Name</Form.Label>
 * <input id="my-input" />
 *
 * // Custom required indicator
 * <Form.Field name="email" required>
 *   <Form.Label requiredIndicator={<span className="text-red-500">*</span>}>
 *     Email
 *   </Form.Label>
 * </Form.Field>
 * ```
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  (
    { htmlFor, showRequired, requiredIndicator = " *", children, ...props },
    ref
  ) => {
    // Try to get field context (may be null if used standalone)
    const fieldContext = useFieldContextOptional();

    // Determine the htmlFor value
    const resolvedHtmlFor = htmlFor ?? fieldContext?.inputId;

    // Determine if we should show required indicator
    const isRequired =
      showRequired !== undefined ? showRequired : fieldContext?.required;

    return (
      <label {...props} ref={ref} htmlFor={resolvedHtmlFor}>
        {children}
        {isRequired && (
          <span aria-hidden="true" className="form-label-required">
            {requiredIndicator}
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = "Form.Label";

export default Label;
