import { JSX } from "react";
import { useInput } from "..";

export default function InputTextArea(props: Props) {
  const { path, ...core } = props;

  const [state, setState] = useInput(path, "");

  return (
    <textarea
      {...core}
      value={state}
      onChange={({ currentTarget }) => setState(currentTarget.value)}
    />
  );
}

interface Props extends Core {
  path: string;
}

type Core = Omit<
  JSX.IntrinsicElements["textarea"],
  "value" | "name" | "onChange" | "type"
>;
