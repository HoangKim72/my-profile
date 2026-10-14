import type { ReactNode } from "react";
import { cn } from "./cn";

export interface StateMessageProps {
  title: ReactNode;
  description?: ReactNode;
  /** Icon element; each state supplies a default when omitted. */
  icon?: ReactNode;
  /** Optional action, e.g. a <ButtonLink> or <Button>. */
  action?: ReactNode;
  /** Heading level for the title (default h2). */
  titleAs?: "h2" | "h3";
  className?: string;
}

interface InternalProps extends StateMessageProps {
  tone: "neutral" | "danger";
  role?: "alert" | "status";
}

/** Shared layout for EmptyState and ErrorState. */
export function StateMessage({
  title,
  description,
  icon,
  action,
  titleAs: Heading = "h2",
  className,
  tone,
  role,
}: InternalProps) {
  return (
    <div
      role={role}
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center",
        tone === "danger"
          ? "border-danger/40 bg-surface"
          : "border-line-strong bg-surface",
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full",
            tone === "danger"
              ? "bg-danger-soft text-danger"
              : "bg-sunken text-muted",
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      ) : null}
      <Heading className="text-lg font-semibold text-ink">{title}</Heading>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}
