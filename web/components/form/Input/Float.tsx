import { type JSX } from "react";
import useInput from "./useInput";

export default function InputFloat(props: Props) {
  const { path, ...core } = props;

  const [state, setState] = useInput(path, 0);

  return (
    <input
      {...core}
      type="number"
      value={isNaN(state as number) ? "" : state as number}
      onChange={({ currentTarget }) =>
        setState(parseFloat(currentTarget.value) ?? 0)
      }
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
