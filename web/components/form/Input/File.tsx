import { type JSX } from "react";
import useInput from "./useInput";

export default function InputFile(props: Props) {
  const { path, multiple, materialize, autoCleanup, ...core } = props;

  const [state, setState] = useInput<File | File[] | null>(
    path,
    multiple ? [] : null,
    { materialize, autoCleanup }
  );

  return (
    <input
      {...core}
      type="file"
      multiple={multiple}
      onChange={({ currentTarget }) => {
        const filesArray = Array.from(currentTarget.files ?? []);

        if (!filesArray.length) {
          return;
        }

        if (!multiple) {
          setState(filesArray[0]);
          return;
        }

        const currents = (state as File[]) || [];
        setState([...currents, ...filesArray]);
      }}
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
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;
