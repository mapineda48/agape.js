import { type HTMLAttributes } from "react";
import router from "@/app/router";

export default function Link({ to, ...core }: Props) {
  return (
    <a
      href={to}
      {...core}
      onClick={(e) => {
        e.preventDefault();
        router.navigateTo(to);
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