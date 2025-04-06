import { JSX } from "react";
import { useInput } from "..";

export default function InputInt(props: Props) {
  const { path, ...core } = props;

  const [state, setState] = useInput(path, 0);

  return (
    <input
      {...core}
      type="number"
      value={isNaN(state) ? "" : state}
      onChange={({ currentTarget }) => setState(parseInt(currentTarget.value) ?? 0)}
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
