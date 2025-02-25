import { JSX } from "react";
import { useInput } from "..";

export default function InputText(props: Props) {
  const { name, password, email, ...core } = props;

  const [state, setState] = useInput(name, "");

  return (
    <input
      {...core}
      type={password ? "password" : email ? "email" : "text"}
      value={state}
      onChange={({ currentTarget }) => setState(currentTarget.value)}
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
