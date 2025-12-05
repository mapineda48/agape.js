import { type JSX } from "react";
import useInput from "./useInput";

export default function InputText(props: Props) {
  const {
    path,
    password,
    email,
    value = "",
    materialize,
    autoCleanup,
    ...core
  } = props;

  const [state, setState] = useInput(path, value, { materialize, autoCleanup });

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
  materialize?: boolean;
  /** If true, the value will be removed from the store when this input unmounts */
  autoCleanup?: boolean;
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;
