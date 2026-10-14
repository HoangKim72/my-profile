import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./cn";

/** Ids Field gives its hint and error, so controls can reference them. */
export function fieldIds(id: string) {
  return { hintId: `${id}-hint`, errorId: `${id}-error` };
}

/**
 * Value for a control's aria-describedby: the hint id when a hint is shown
 * and the error id when an error is shown (undefined when neither).
 */
export function fieldDescribedBy(
  id: string,
  { hint, error }: { hint?: ReactNode; error?: ReactNode },
): string | undefined {
  const { hintId, errorId } = fieldIds(id);
  const ids = [hint ? hintId : null, error ? errorId : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export interface FieldProps {
  /** id of the control inside; used for label htmlFor and hint/error ids. */
  htmlFor: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Adds a visual "*" marker; still set `required` on the control itself. */
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({
  htmlFor,
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: FieldProps) {
  const { hintId, errorId } = fieldIds(htmlFor);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlBase =
  "w-full rounded-lg border bg-surface text-base text-ink placeholder:text-muted transition-colors duration-150 focus-visible:border-accent disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-70";

function controlClasses(invalid: boolean | undefined, className?: string) {
  return cn(
    controlBase,
    invalid ? "border-danger" : "border-line-strong hover:border-ink/40",
    className,
  );
}

interface ControlOwnProps {
  /** Sets aria-invalid and the error border. */
  invalid?: boolean;
}

export type InputProps = ControlOwnProps & ComponentProps<"input">;

export function Input({ invalid, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={controlClasses(invalid, cn("h-11 px-3", className))}
      {...rest}
    />
  );
}

export type TextareaProps = ControlOwnProps & ComponentProps<"textarea">;

export function Textarea({
  invalid,
  className,
  rows = 4,
  ...rest
}: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={controlClasses(
        invalid,
        cn("min-h-24 px-3 py-2.5 leading-6", className),
      )}
      {...rest}
    />
  );
}

export type SelectProps = ControlOwnProps & ComponentProps<"select">;

export function Select({ invalid, className, children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={controlClasses(
          invalid,
          cn("h-11 cursor-pointer appearance-none pl-3 pr-10", className),
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
