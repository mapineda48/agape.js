import { type JSX } from "react";
import useInput from "../Input/useInput";

export default function SelectBoolean(props: Props) {
  const { path, materialize, autoCleanup, ...core } = props;

  const [state, setState] = useInput(path, false, { materialize, autoCleanup });

  return (
    <select
      {...core}
      value={state ? "true" : "false"}
      onChange={({ currentTarget }) => setState(currentTarget.value === "true")}
    >
      <option value="true">Si</option>
      <option value="false">No</option>
    </select>
  );
}

interface Props extends Core {
  path: string;
  materialize?: boolean;
  /** If true, the value will be removed from the store when this input unmounts */
  autoCleanup?: boolean;
}

type Core = Omit<
  JSX.IntrinsicElements["select"],
  "value" | "name" | "onChange" | "type"
>;
