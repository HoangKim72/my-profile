import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

const base =
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-accent text-on-accent hover:bg-accent-hover",
  secondary:
    "border-line-strong bg-surface text-ink hover:border-ink/40 hover:bg-sunken",
  ghost:
    "border-transparent bg-transparent text-muted hover:bg-sunken hover:text-ink",
  danger: "border-transparent bg-danger text-on-danger hover:bg-danger-hover",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm sm:text-base",
};

/** Class string for anything that should look like a button. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    base,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Icon rendered before the label (replaced by the spinner while loading). */
  leftIcon?: ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: ReactNode;
}

export interface ButtonProps
  extends ButtonOwnProps,
    Omit<ComponentProps<"button">, keyof ButtonOwnProps> {
  /** Shows a spinner, disables the button and sets aria-busy. */
  loading?: boolean;
}

export function Button({
  variant,
  size,
  fullWidth,
  leftIcon,
  rightIcon,
  loading = false,
  disabled,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {rightIcon}
    </button>
  );
}

export interface ButtonLinkProps
  extends ButtonOwnProps,
    Omit<ComponentProps<typeof Link>, keyof ButtonOwnProps> {
  /** Renders a non-interactive link (aria-disabled, removed from tab order). */
  disabled?: boolean;
}

/** Next.js <Link> styled as a Button. */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  leftIcon,
  rightIcon,
  disabled = false,
  className,
  children,
  tabIndex,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClasses({ variant, size, fullWidth, className })}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : tabIndex}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
