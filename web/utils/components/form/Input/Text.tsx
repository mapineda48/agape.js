import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "#web/utils/stringToPath";
import { useFieldContextOptional } from "../Field/context";

/**
 * Props for the Text input component.
 */
export interface TextProps
  extends Omit<
    JSX.IntrinsicElements["input"],
    "value" | "onChange" | "type" | "defaultValue"
  > {
  /** Path within the form store (e.g. "user.name" or just "name") */
  path?: string | number;
  /** Input type: text, email, or password */
  type?: "text" | "email" | "password";
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
  /** If true, validates the field when it loses focus (default: true when inside Form.Field) */
  validateOnBlur?: boolean;
}

/**
 * Text input field connected to the form store.
 * Supports text, email, and password types.
 * Integrates with Form.Field for automatic validation.
 *
 * @example
 * ```tsx
 * // Standalone usage
 * <Form.Text path="user.name" placeholder="Enter name" />
 *
 * // Inside Form.Field (path is inherited)
 * <Form.Field name="email">
 *   <Form.Label>Email</Form.Label>
 *   <Form.Text type="email" />
 *   <Form.Error />
 * </Form.Field>
 * ```
 */
const Text = forwardRef<HTMLInputElement, TextProps>((props, ref) => {
  const {
    path: pathProp,
    type = "text",
    defaultValue = "",
    materialize,
    autoCleanup,
    validateOnChange,
    validateOnBlur = true,
    ...core
  } = props;

  // Get path from Field context if not provided
  const fieldContext = useFieldContextOptional();
  const path = pathProp ?? fieldContext?.name ?? "";

  const paths = useMemo(() => stringToPath(path), [path]);

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
    <input
      {...core}
      ref={ref}
      id={inputId}
      type={type}
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
});

Text.displayName = "Form.Text";

export default Text;
