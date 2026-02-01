import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "#web/utils/stringToPath";
import DateTime from "#shared/data/DateTime";
import { format } from "date-fns";
import { useFieldContextOptional } from "../Field/context";

/**
 * Props for the DateTime input component.
 */
export interface DateTimeProps
  extends Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type"> {
  /** Path within the form store (e.g. "eventDate" or "schedule.0.startTime") */
  path?: string | number;
  /** If true, writes the default value to the store on mount. Defaults to true for DateTime. */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
  /** If true, validates the field when the value changes */
  validateOnChange?: boolean;
  /** If true, validates the field when it loses focus (default: true) */
  validateOnBlur?: boolean;
}

/**
 * Date and time input connected to the form store.
 * Stores DateTime objects for proper date handling.
 * Integrates with Form.Field for automatic validation.
 *
 * @example
 * ```tsx
 * <Form.DateTime path="eventDate" />
 * <Form.DateTime path="createdAt" materialize={false} />
 * ```
 */
const DateTimeInput = forwardRef<HTMLInputElement, DateTimeProps>(
  (props, ref) => {
    const {
      path: pathProp,
      materialize = true,
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

    // Default to now if no value
    const { value, onChange, onBlur } = useInput<DateTime>(
      paths,
      new DateTime(),
      {
        materialize,
        autoCleanup,
        validateOnChange,
        validateOnBlur,
      }
    );

    // Use instanceof for type checking - handle both DateTime and Date
    const displayValue =
      value instanceof Date ? format(value, "yyyy-MM-dd'T'HH:mm") : "";

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
        type="datetime-local"
        value={displayValue}
        onChange={({ currentTarget }) => {
          const date = new Date(currentTarget.value);
          if (!isNaN(date.getTime())) {
            onChange(new DateTime(date));
          }
        }}
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

DateTimeInput.displayName = "Form.DateTime";

export default DateTimeInput;
