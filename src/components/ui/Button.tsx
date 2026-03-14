import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "ghost" | "dark" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  ariaLabel?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  loading = false,
  disabled = false,
  type = "button",
  className,
  ariaLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    isDisabled ? styles.disabled : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = loading ? "Memproses..." : children;

  if (href) {
    const handleLinkClick =
      onClick || isDisabled
        ? (event: MouseEvent<HTMLAnchorElement>) => {
            if (isDisabled) {
              event.preventDefault();
              return;
            }
            onClick?.();
          }
        : undefined;

    return (
      <Link
        href={href}
        className={classes}
        aria-label={ariaLabel}
        aria-disabled={isDisabled}
        onClick={handleLinkClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
