import { type JSX } from "react";
import useInput from "./useInput";

export default function InputFloat(props: Props) {
  const { path, materialize, autoCleanup, nullable, ...core } = props;

  const defaultValue = nullable ? null : 0;
  const [state, setState] = useInput(path, defaultValue, { materialize, autoCleanup });

  const displayValue = state === null || Number.isNaN(state as number) ? "" : (state as number);

  return (
    <input
      {...core}
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
}

interface Props extends Core {
  path: string;
  materialize?: boolean;
  /** If true, the value will be removed from the store when this input unmounts */
  autoCleanup?: boolean;
  /** If true, empty input will set null instead of 0 */
  nullable?: boolean;
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;
