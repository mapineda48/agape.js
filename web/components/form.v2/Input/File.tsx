import { type JSX } from "react";
import useInput from "./useInput";

export default function InputFile(props: Props) {
  const { path, multiple, ...core } = props;

  const [state, setState] = useInput<File | File[] | null>(path, multiple ? [] : null);

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
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;
