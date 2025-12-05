import { type JSX } from "react";
import useInput from "./useInput";

export default function InputFloat(props: Props) {
  const { path, ...core } = props;

  const [state, setState] = useInput(path, 0);

  return (
    <input
      {...core}
      type="number"
      value={Number.isNaN(state as number) ? "" : (state as number)}
      onChange={({ currentTarget }) => {
        const raw = currentTarget.value;
        // Empty string means cleared, reset to 0
        if (raw === "") {
          setState(0);
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
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;
