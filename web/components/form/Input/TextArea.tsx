import { type JSX } from "react";
import useInput from "./useInput";

export default function InputTextArea(props: Props) {
  const { path, ...core } = props;

  const [state, setState] = useInput(path, "");

  return (
    <textarea
      {...core}
      value={state as string}
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
