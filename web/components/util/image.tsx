import type { JSX } from "react";
import { useEffect, useState } from "react";

export default function Image(props: Props) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (typeof props.src === "string") {
      setSrc(props.src);
      return;
    }

    const url = URL.createObjectURL(props.src);
    setSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [props.src]);

  return <img {...props} src={src} />;
}

interface Props extends Core {
  src: string | File;
}

type Core = Omit<JSX.IntrinsicElements["img"], "src">;
