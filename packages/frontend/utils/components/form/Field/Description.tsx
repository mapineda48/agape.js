/**
 * Form.Description Component
 *
 * Displays help text or description for a field.
 * Automatically associates with the parent Form.Field for accessibility.
 *
 * @module Field/Description
 */

import { forwardRef, type JSX } from "react";
import { useFieldContextOptional } from "./context";

// ============================================================================
// Types
// ============================================================================

export interface DescriptionProps
  extends Omit<JSX.IntrinsicElements["span"], "id"> {
  /**
   * Explicit id for the description.
   * If not provided and inside a Form.Field, it will be automatically set.
   */
  id?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Form.Description - Help text component
 *
 * Displays description or help text for a field.
 * Automatically integrates with Form.Field context for accessibility (aria-describedby).
 *
 * @example
 * ```tsx
 * // Inside Form.Field - automatic association
 * <Form.Field name="email">
 *   <Form.Label>Email</Form.Label>
 *   <Form.Text />
 *   <Form.Description>We'll never share your email.</Form.Description>
 *   <Form.Error />
 * </Form.Field>
 *
 * // With custom styling
 * <Form.Description className="text-gray-500 text-sm">
 *   Password must be at least 8 characters.
 * </Form.Description>
 * ```
 */
export const Description = forwardRef<HTMLSpanElement, DescriptionProps>(
  ({ id, children, ...props }, ref) => {
    // Try to get field context (may be null if used standalone)
    const fieldContext = useFieldContextOptional();

    // Determine the id for aria-describedby
    const descriptionId = id ?? fieldContext?.descriptionId;

    return (
      <span {...props} ref={ref} id={descriptionId}>
        {children}
      </span>
    );
  }
);

Description.displayName = "Form.Description";

export default Description;
