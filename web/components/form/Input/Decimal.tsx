import { type JSX } from "react";
import useInput from "./useInput";
import Decimal from "@utils/data/Decimal";

export default function InputDecimal(props: Props) {
  const { path, materialize, autoCleanup, ...core } = props;

  const [state, setState] = useInput<Decimal>(path, new Decimal(0), {
    materialize,
    autoCleanup,
  });

  // Use instanceof for type checking - more robust than duck-typing
  const displayValue =
    state instanceof Decimal ? state.toString() : state ?? "";

  return (
    <input
      {...core}
      type="number"
      step="0.01"
      value={displayValue}
      onChange={({ currentTarget }) => {
        try {
          const val = new Decimal(currentTarget.value || 0);
          setState(val);
        } catch (e) {
          // Handle invalid input if necessary, or just don't update
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
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;
