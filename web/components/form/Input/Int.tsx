import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "@/utils/stringToPath";

/**
 * Props for the Int input component.
 */
export interface IntProps
  extends Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type"> {
  /** Path within the form store */
  path: string;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
  /** If true, empty input will set null instead of 0 */
  nullable?: boolean;
}

/**
 * Integer number input connected to the form store.
 * Parses input as integer and stores the numeric value.
 *
 * @example
 * ```tsx
 * <Form.Int path="age" placeholder="Age" />
 * <Form.Int path="quantity" nullable />
 * ```
 */
const Int = forwardRef<HTMLInputElement, IntProps>((props, ref) => {
  const { path, materialize, autoCleanup, nullable, ...core } = props;

  const defaultValue = nullable ? null : 0;

  const paths = useMemo(() => stringToPath(path), [path]);

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
        // Allow intermediate states like "-" while typing
        const parsed = parseInt(raw, 10);
        // Only update store if we have a valid number
        if (!Number.isNaN(parsed)) {
          setState(parsed);
        }
      }}
    />
  );
});

Int.displayName = "Form.Int";

export default Int;
