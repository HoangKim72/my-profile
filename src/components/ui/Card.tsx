import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type CardPadding = "none" | "sm" | "md" | "lg";

const paddings: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** none | sm (16px) | md (20/24px, default) | lg (24/32px) */
  padding?: CardPadding;
  /** Hover border change, for cards that are clickable/contain a full link. */
  interactive?: boolean;
  /** Sunken background instead of surface. */
  muted?: boolean;
  as?: "div" | "section" | "article" | "li" | "aside";
}

export function Card({
  padding = "md",
  interactive = false,
  muted = false,
  as: Tag = "div",
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-xl border border-line",
        muted ? "bg-sunken" : "bg-surface",
        paddings[padding],
        interactive &&
          "transition-colors duration-150 hover:border-line-strong",
        className,
      )}
      {...rest}
    />
  );
}
