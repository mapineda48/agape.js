import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "#web/utils/stringToPath";
import { useFieldContextOptional } from "../Field/context";

/**
 * Props for the TextArea input component.
 */
export interface TextAreaProps
  extends Omit<
    JSX.IntrinsicElements["textarea"],
    "value" | "onChange" | "defaultValue"
  > {
  /** Path within the form store (e.g. "description" or "comments.0.text") */
  path?: string | number;
  /**
   * Default value used when no value exists in the store.
   * Only used on initial mount - changes to this prop are ignored.
   */
  defaultValue?: string;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
  /** If true, validates the field when the value changes */
  validateOnChange?: boolean;
  /** If true, validates the field when it loses focus (default: true) */
  validateOnBlur?: boolean;
}

/**
 * Multi-line text area connected to the form store.
 * Integrates with Form.Field for automatic validation.
 *
 * @example
 * ```tsx
 * <Form.TextArea path="description" rows={4} />
 *
 * // Inside Form.Field
 * <Form.Field name="message">
 *   <Form.Label>Message</Form.Label>
 *   <Form.TextArea rows={4} />
 *   <Form.Error />
 * </Form.Field>
 * ```
 */
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (props, ref) => {
    const {
      path: pathProp,
      defaultValue = "",
      materialize,
      autoCleanup,
      validateOnChange,
      validateOnBlur = true,
      ...core
    } = props;

    // Get path from Field context if not provided
    const fieldContext = useFieldContextOptional();
    // When inside Form.Field (fieldContext exists), pass undefined to let PathProvider handle the path
    // Only use empty string fallback when there's no fieldContext
    const path = pathProp !== undefined ? pathProp : (fieldContext ? undefined : "");

    const paths = useMemo(() => path !== undefined ? stringToPath(path) : undefined, [path]);

    const { value, onChange, onBlur } = useInput<string>(paths, defaultValue, {
      materialize,
      autoCleanup,
      validateOnChange,
      validateOnBlur,
    });

    // Get accessibility attributes from field context
    const inputId = fieldContext?.inputId;
    const ariaDescribedBy = [
      fieldContext?.descriptionId,
      fieldContext?.errorId,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <textarea
        {...core}
        ref={ref}
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        onBlur={(e) => {
          onBlur();
          core.onBlur?.(e);
        }}
        aria-describedby={ariaDescribedBy}
        aria-invalid={fieldContext?.errorId ? true : undefined}
      />
    );
  }
);

TextArea.displayName = "Form.TextArea";

export default TextArea;
