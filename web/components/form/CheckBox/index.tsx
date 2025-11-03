import { type JSX } from "react";
import { useInput } from "..";

export default function Checkbox(props: Props) {
  const { 
    path, password, email, checked = false, ...core } = props;

  const [state, setState] = useInput(path, checked);

  return (
    <input
      {...core}
      type="checkbox"
      checked={state}
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