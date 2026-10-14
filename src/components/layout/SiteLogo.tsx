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

/** Brand mark (same shape as public/logo-mark.svg). Server-safe. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className={cn("h-9 w-9 shrink-0", className)}
    >
      <path
        fill="#FF7B3D"
        fillRule="evenodd"
        d="M39.6 1.06A50 50 0 0 0 39.6 98.9V63.2a2.4 2.4 0 0 1 2.4-2.4h16a2.4 2.4 0 0 1 2.4 2.4v35.7A50 50 0 0 0 60.4 1.1v35.7a2.4 2.4 0 0 1-2.4 2.4H42a2.4 2.4 0 0 1-2.4-2.4Z"
      />
    </svg>
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
