import Link from "next/link";
import { cn } from "@/components/ui";
import { SITE_NAME } from "@/lib/utils/constants";

interface SiteLogoProps {
  href?: string;
  /** Text next to the mark. Defaults to the site name. */
  label?: string;
  /** Hide the text below `sm` (mark stays visible). */
  compactOnMobile?: boolean;
  className?: string;
}

/** Simple token-coloured mark + name. Server-safe. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-on-accent",
        className,
      )}
    >
      AC
    </span>
  );
}

export function SiteLogo({
  href = "/",
  label = SITE_NAME,
  compactOnMobile = false,
  className,
}: SiteLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg text-ink transition-colors hover:text-accent",
        className,
      )}
    >
      <LogoMark />
      <span
        className={cn(
          "truncate text-base font-semibold",
          compactOnMobile && "sr-only sm:not-sr-only",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
