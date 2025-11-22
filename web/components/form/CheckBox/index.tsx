import { type JSX } from "react";
import useInput from "../Input/useInput";

export default function Checkbox(props: Props) {
  const { 
    path, password, email, checked = false, ...core } = props;

  const [state, setState] = useInput(path, checked);

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
  password?: boolean;
  email?: boolean;
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;
