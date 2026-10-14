"use client";

import { Loader2, LogOut } from "lucide-react";
import { cn } from "@/components/ui";

interface LogoutButtonProps {
  isLoggingOut: boolean;
  onLogout: () => void;
  className?: string;
}

/** Full-width, ghost-danger "Đăng xuất" button used in the mobile menu and dashboard sidebar. */
export function LogoutButton({
  isLoggingOut,
  onLogout,
  className,
}: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={isLoggingOut}
      aria-busy={isLoggingOut || undefined}
      className={cn(
        "flex h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {isLoggingOut ? (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        <LogOut size={16} aria-hidden="true" />
      )}
      {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
}
