import { JSX } from "react";
import { useInput } from "..";

export default function Checkbox(props: Props) {
  const { name, password, email, checked = false, ...core } = props;

  const [state, setState] = useInput(name, checked);

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
  name: string;
  password?: boolean;
  email?: boolean;
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;
