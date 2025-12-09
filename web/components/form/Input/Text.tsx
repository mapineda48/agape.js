import { useMemo, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "@/utils/stringToPath";

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

  const paths = useMemo(() => stringToPath(path), [path]);

  const [state, setState] = useInput(paths, value, {
    materialize,
    autoCleanup,
  });

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
  path: string | number;
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
