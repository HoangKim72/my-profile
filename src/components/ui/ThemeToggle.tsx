"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import {
  readThemePreference,
  setThemePreference,
  subscribeThemePreference,
  type ThemePreference,
} from "@/lib/theme/theme";
import { cn } from "./cn";

const OPTIONS: ReadonlyArray<{
  value: ThemePreference;
  label: string;
  Icon: LucideIcon;
}> = [
  { value: "light", label: "Sáng", Icon: Sun },
  { value: "dark", label: "Tối", Icon: Moon },
  { value: "system", label: "Theo hệ thống", Icon: Monitor },
];

export interface ThemeToggleProps {
  /** Show text labels next to the icons (default: icons only, labels stay available to screen readers). */
  showLabels?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabels = false, className }: ThemeToggleProps) {
  // null on the server / during hydration, real preference after.
  const preference = useSyncExternalStore<ThemePreference | null>(
    subscribeThemePreference,
    readThemePreference,
    () => null,
  );

  return (
    <div
      role="group"
      aria-label="Chế độ giao diện"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={showLabels ? undefined : label}
            title={label}
            onClick={() => setThemePreference(value)}
            className={cn(
              "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors duration-150",
              active
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-sunken hover:text-ink",
            )}
          >
            <Icon size={16} aria-hidden="true" />
            {showLabels ? <span>{label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
