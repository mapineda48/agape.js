import { type JSX } from "react";
import useInput from "./useInput";

export default function InputTextArea(props: Props) {
  const { path, materialize, autoCleanup, ...core } = props;

  const [state, setState] = useInput(path, "", { materialize, autoCleanup });

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
  materialize?: boolean;
  /** If true, the value will be removed from the store when this input unmounts */
  autoCleanup?: boolean;
}

type Core = Omit<
  JSX.IntrinsicElements["textarea"],
  "value" | "name" | "onChange" | "type"
>;
