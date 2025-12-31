import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "@/utils/stringToPath";
import DateTime from "@utils/data/DateTime";
import { format } from "date-fns";

/**
 * Props for the DateTime input component.
 */
export interface DateTimeProps
  extends Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type"> {
  /** Path within the form store (e.g. "eventDate" or "schedule.0.startTime") */
  path: string | number;
  /** If true, writes the default value to the store on mount. Defaults to true for DateTime. */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
}

/**
 * Date and time input connected to the form store.
 * Stores DateTime objects for proper date handling.
 *
 * @example
 * ```tsx
 * <Form.DateTime path="eventDate" />
 * <Form.DateTime path="createdAt" materialize={false} />
 * ```
 */
const DateTimeInput = forwardRef<HTMLInputElement, DateTimeProps>(
  (props, ref) => {
    const { path, materialize = true, autoCleanup, ...core } = props;

    const paths = useMemo(() => stringToPath(path), [path]);

    // Default to now if no value
    const [state, setState] = useInput<DateTime>(paths, new DateTime(), {
      materialize,
      autoCleanup,
    });

    // Use instanceof for type checking - more robust than duck-typing
    const displayValue =
      state instanceof DateTime ? format(state, "yyyy-MM-dd'T'HH:mm") : "";

    return (
      <input
        {...core}
        ref={ref}
        type="datetime-local"
        value={displayValue}
        onChange={({ currentTarget }) => {
          const date = new Date(currentTarget.value);
          if (!isNaN(date.getTime())) {
            setState(new DateTime(date));
          }
        }}
      />
    );
  }
);

DateTimeInput.displayName = "Form.DateTime";

export default DateTimeInput;
