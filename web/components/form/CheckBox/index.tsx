import { useMemo, type JSX } from "react";
import useInput from "../Input/useInput";
import stringToPath from "@/utils/stringToPath";

/**
 * Checkbox form input component.
 *
 * @note About `materialize` prop:
 * By default, the checkbox value is NOT written to the store until the user interacts with it.
 * This means if the user never touches the checkbox, the property will NOT appear in the
 * submit payload. Use `materialize: true` if you need the default value to always be present
 * in the form data (e.g., for validation that runs on mount or to ensure the field is always
 * included in the submission).
 *
 * @note About `autoCleanup` prop:
 * If true, the value will be removed from the store when this input unmounts.
 */
export default function Checkbox(props: Props) {
  const {
    path,
    defaultChecked = false,
    materialize,
    autoCleanup,
    ...core
  } = props;

  const paths = useMemo(() => stringToPath(path), [path]);

  const [state, setState] = useInput(paths, defaultChecked, {
    materialize,
    autoCleanup,
  });

  return (
    <input
      {...core}
      type="checkbox"
      checked={state as boolean}
      onChange={({ currentTarget }) => setState(currentTarget.checked)}
    />
  );
}

interface Props extends Core {
  path: string;
  /** Default checked state when no value exists in the store */
  defaultChecked?: boolean;
  materialize?: boolean;
  /** If true, the value will be removed from the store when this input unmounts */
  autoCleanup?: boolean;
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type" | "checked" | "defaultChecked"
>;
