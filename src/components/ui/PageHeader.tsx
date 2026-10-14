import type { ReactNode } from "react";
import { cn } from "./cn";

export interface PageHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Buttons/links shown at the end (below the text on mobile). */
  actions?: ReactNode;
  /** id for the h1, e.g. for aria-labelledby on the page section. */
  titleId?: string;
  className?: string;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  titleId,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1
          id={titleId}
          className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-base leading-7 text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
