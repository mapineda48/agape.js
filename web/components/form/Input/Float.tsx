import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "@/utils/stringToPath";

/**
 * Props for the Float input component.
 */
export interface FloatProps
  extends Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type"> {
  /** Path within the form store (e.g. "price" or "item.0.cost") */
  path: string | number;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
  /** If true, empty input will set null instead of 0 */
  nullable?: boolean;
}

/**
 * Floating point number input connected to the form store.
 * Parses input as float and stores the numeric value.
 *
 * @example
 * ```tsx
 * <Form.Float path="price" step="0.01" />
 * <Form.Float path="weight" nullable />
 * ```
 */
const Float = forwardRef<HTMLInputElement, FloatProps>((props, ref) => {
  const { path, materialize, autoCleanup, nullable, ...core } = props;

  const paths = useMemo(() => stringToPath(path), [path]);

  const defaultValue = nullable ? null : 0;
  const [state, setState] = useInput(paths, defaultValue, {
    materialize,
    autoCleanup,
  });

  const displayValue =
    state === null || Number.isNaN(state as number) ? "" : (state as number);

  return (
    <input
      {...core}
      ref={ref}
      type="number"
      value={displayValue}
      onChange={({ currentTarget }) => {
        const raw = currentTarget.value;
        // Empty string means cleared
        if (raw === "") {
          setState(nullable ? null : 0);
          return;
        }
        // Allow intermediate states like "-" or "." while typing
        const parsed = parseFloat(raw);
        // Only update store if we have a valid number
        if (!Number.isNaN(parsed)) {
          setState(parsed);
        }
      }}
    />
  );
});

Float.displayName = "Form.Float";

export default Float;
