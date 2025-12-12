import { useMemo, forwardRef, type JSX } from "react";
import useInput from "../Input/useInput";
import stringToPath from "@/utils/stringToPath";

/**
 * Props for the Checkbox component.
 */
export interface CheckboxProps
  extends Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type"> {
  /** Path within the form store */
  path: string | number;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
}

/**
 * Checkbox input connected to the form store.
 * Stores boolean values.
 *
 * @example
 * ```tsx
 * <Form.Checkbox path="isActive" />
 * <Form.Checkbox path="user.settings.newsletter" />
 * ```
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const {
    path,
    defaultChecked = false,
    materialize,
    autoCleanup,
    ...core
  } = props;

  const paths = useMemo(() => stringToPath(path), [path]);

  const [state, setState] = useInput<boolean>(paths, defaultChecked, {
    materialize,
    autoCleanup,
  });

  return (
    <input
      {...core}
      ref={ref}
      type="checkbox"
      checked={state as boolean}
      onChange={(e) => setState(e.currentTarget.checked)}
    />
  );
});

Checkbox.displayName = "Form.Checkbox";

export default Checkbox;
