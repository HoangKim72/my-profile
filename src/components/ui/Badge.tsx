import type { ComponentProps } from "react";
import { cn } from "./cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warn" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line bg-sunken text-muted",
  accent: "border-transparent bg-accent-soft text-accent",
  success: "border-transparent bg-success-soft text-success",
  warn: "border-transparent bg-warn-soft text-warn",
  danger: "border-transparent bg-danger-soft text-danger",
};

export interface BadgeProps extends ComponentProps<"span"> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
