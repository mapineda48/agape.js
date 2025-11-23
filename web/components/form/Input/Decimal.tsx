import { type JSX } from "react";
import useInput from "./useInput";
import Decimal from "@utils/data/Decimal";

export default function InputDecimal(props: Props) {
  const { path, ...core } = props;

  const [state, setState] = useInput<Decimal>(path, new Decimal(0));

  return (
    <input
      {...core}
      type="number"
      step="0.01"
      value={state instanceof Decimal ? state.toString() : state}
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
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;
