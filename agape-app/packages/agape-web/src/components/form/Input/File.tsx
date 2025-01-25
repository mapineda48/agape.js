import { useInput } from "..";

export default function InputFile(props: Props) {
  const { name, ...core } = props;

  const [, setState] = useInput<unknown>(name, core.multiple ? [] : null);

  return (
    <InputFiles
      {...core}
      onChange={(files) => {
        if (core.multiple) {
          return setState(files);
        }

        const [file = null] = files;

        setState(file);
      }}
    />
  );
}

export function InputFiles(props: Core) {
  const { onChange, ...core } = props;
  return (
    <input
      {...core}
      type="file"
      onChange={({ currentTarget }) => {
        const files = currentTarget.files
          ? Array.from(currentTarget.files)
          : [];

        currentTarget.value = "";
        onChange(files);
      }}
    />
  );
}

interface Props extends Core {
  name: string;
}

interface Core
  extends Omit<
    JSX.IntrinsicElements["input"],
    "value" | "name" | "onChange" | "type"
  > {
  onChange: (files: File[]) => void;
}
