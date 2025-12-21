import { type ButtonHTMLAttributes } from "react";
import clsx from "clsx";
const base =
  "inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-colors duration-200";

const variants = {
  primary: "bg-primary text-white hover:bg-primary/90",
  accent: "bg-accent text-white hover:bg-accent/80",
  outline: "border border-primary text-primary hover:bg-primary/10",
  ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export default function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

/**
 * Types
 */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
}