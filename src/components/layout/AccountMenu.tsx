"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/components/ui";

interface AccountMenuProps {
  displayName: string;
  email: string;
  initial: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}

const itemClass =
  "flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium transition-colors";

function getMenuItems(menu: HTMLElement | null): HTMLElement[] {
  return Array.from(
    menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
  );
}

/** Compact account button (initial avatar) with a small dropdown menu. */
export function AccountMenu({
  displayName,
  email,
  initial,
  isLoggingOut,
  onLogout,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Move focus into the menu when it opens.
    getMenuItems(menuRef.current)[0]?.focus();

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  const close = (restoreFocus: boolean) => {
    setIsOpen(false);
    if (restoreFocus) {
      buttonRef.current?.focus();
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = getMenuItems(menuRef.current);
    const index = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close(true);
        break;
      case "ArrowDown":
        event.preventDefault();
        items[(index + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        event.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();
        break;
      case "Home":
        event.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        event.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Tài khoản: ${displayName}`}
        onClick={() => setIsOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && isOpen) {
            close(true);
          }
        }}
        className={cn(
          "inline-flex h-10 cursor-pointer items-center gap-1 rounded-full border border-line py-0.5 pl-0.5 pr-2 text-muted transition-colors hover:border-line-strong hover:text-ink",
          isOpen && "border-line-strong text-ink",
        )}
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
        >
          {initial}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Tài khoản"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-md"
        >
          <div className="border-b border-line px-3 pb-2.5 pt-1.5">
            <p className="truncate text-sm font-semibold text-ink">
              {displayName}
            </p>
            <p className="truncate text-sm text-muted">{email}</p>
          </div>
          <div className="pt-1.5">
            <Link
              href="/dashboard"
              role="menuitem"
              tabIndex={-1}
              onClick={() => setIsOpen(false)}
              className={cn(itemClass, "text-ink hover:bg-sunken")}
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              Bảng điều khiển
            </Link>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={isLoggingOut}
              onClick={onLogout}
              className={cn(
                itemClass,
                "text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <LogOut size={16} aria-hidden="true" />
              {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
