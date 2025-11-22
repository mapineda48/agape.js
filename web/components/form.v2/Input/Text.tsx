import { type JSX } from "react";
import useInput from "./useInput";

export default function InputText(props: Props) {
  const { path, password, email, value = "", ...core } = props;

  const [state, setState] = useInput(path, value);

  console.log(state);

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
  path: string;
  password?: boolean;
  email?: boolean;
  value?: string;
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;