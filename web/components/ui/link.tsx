import { type HTMLAttributes } from "react";
import { useRouter } from "../router/router-hook";

export default function Link({ to, ...core }: Props) {
  const router = useRouter();
  return (
    <a
      href={to}
      {...core}
      onClick={(e) => {
        e.preventDefault();
        router.navigate(to);
      }}
    />
  );
}

/**
 * Types
 */

interface Props extends Omit<HTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
}
