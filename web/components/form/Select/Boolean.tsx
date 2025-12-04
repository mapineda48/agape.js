import { type JSX } from "react";
import useInput from "../Input/useInput";

export default function SelectBoolean(props: Props) {
  const { path, materialize, ...core } = props;

  const [state, setState] = useInput(path, false, { materialize });

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
}

type Core = Omit<
  JSX.IntrinsicElements["select"],
  "value" | "name" | "onChange" | "type"
>;
