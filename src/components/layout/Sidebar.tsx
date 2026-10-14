// src/components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Mic,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AuthUser, UserRole } from "@/types";
import { ADMIN_NAV_LINKS } from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";
import { Badge, ThemeToggle, cn, type BadgeTone } from "@/components/ui";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { LogoMark } from "@/components/layout/SiteLogo";

interface SidebarProps {
  user: AuthUser;
}

const NAV_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/projects": FolderKanban,
  "/dashboard/tools/mic-filter": Mic,
  "/dashboard/settings": Settings,
};

const ROLE_META: Record<UserRole, { label: string; tone: BadgeTone }> = {
  admin: { label: "Quản trị viên", tone: "accent" },
  viewer: { label: "Người xem", tone: "neutral" },
  guest: { label: "Khách", tone: "neutral" },
};

const MOBILE_NAV_ID = "dashboard-mobile-nav";

function isLinkActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getVisibleLinks(user: AuthUser) {
  return ADMIN_NAV_LINKS.filter(
    (link) => !link.adminOnly || user.role === "admin",
  );
}

function useLogout() {
  const [supabase] = useState(() => createClient());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
}

function DashboardNavList({
  user,
  pathname,
  onNavigate,
}: {
  user: AuthUser;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {getVisibleLinks(user).map((link) => {
        const isActive = isLinkActive(pathname, link.href);
        const Icon = NAV_ICONS[link.href] ?? LayoutDashboard;

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "flex h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-sunken hover:text-ink",
              )}
            >
              <Icon size={18} aria-hidden="true" className="shrink-0" />
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function UserRow({ user }: { user: AuthUser }) {
  const name = user.profile?.fullName?.trim() || user.email;
  const initial = (name.charAt(0) || "U").toUpperCase();
  const role = ROLE_META[user.role] ?? ROLE_META.viewer;

  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
      >
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
        {name !== user.email ? (
          <p className="truncate text-xs text-muted">{user.email}</p>
        ) : null}
      </div>
      <Badge tone={role.tone} className="shrink-0">
        {role.label}
      </Badge>
    </div>
  );
}

function SidebarFooter({
  user,
  isLoggingOut,
  onLogout,
}: {
  user: AuthUser;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="space-y-3">
      <UserRow user={user} />
      <Link
        href="/"
        className="flex h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-sunken hover:text-ink"
      >
        <ExternalLink size={16} aria-hidden="true" />
        Xem trang công khai
      </Link>
      <ThemeToggle showLabels />
      <LogoutButton isLoggingOut={isLoggingOut} onLogout={onLogout} />
    </div>
  );
}

/** Desktop (lg+) sidebar for the dashboard. */
export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useLogout();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className="flex h-16 items-center border-b border-line px-4">
        <Link
          href="/dashboard"
          className="flex cursor-pointer items-center gap-2.5 rounded-lg text-ink transition-colors hover:text-accent"
        >
          <LogoMark />
          <span className="text-base font-semibold">Bảng điều khiển</span>
        </Link>
      </div>

      <nav
        aria-label="Điều hướng bảng điều khiển"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <DashboardNavList user={user} pathname={pathname} />
      </nav>

      <div className="border-t border-line p-3">
        <SidebarFooter
          user={user}
          isLoggingOut={isLoggingOut}
          onLogout={logout}
        />
      </div>
    </aside>
  );
}

/** Mobile/tablet (<lg) top bar with a disclosure menu for the dashboard. */
export function DashboardMobileNav({ user }: SidebarProps) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close the menu on route change.
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const currentLink = getVisibleLinks(user).find((link) =>
    isLinkActive(pathname, link.href),
  );

  return (
    <div className="sticky top-0 z-40 border-b border-line bg-surface lg:hidden">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link
          href="/dashboard"
          aria-label="Bảng điều khiển"
          className="cursor-pointer rounded-lg"
        >
          <LogoMark />
        </Link>
        <p className="min-w-0 flex-1 truncate text-base font-semibold text-ink">
          {currentLink?.label ?? "Bảng điều khiển"}
        </p>
        <button
          ref={buttonRef}
          type="button"
          aria-label={isOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isOpen}
          aria-controls={MOBILE_NAV_ID}
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-sunken"
        >
          {isOpen ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Menu size={20} aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        id={MOBILE_NAV_ID}
        hidden={!isOpen}
        className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-line px-4 py-4"
      >
        <nav aria-label="Điều hướng bảng điều khiển">
          <DashboardNavList
            user={user}
            pathname={pathname}
            onNavigate={() => setIsOpen(false)}
          />
        </nav>
        <div className="mt-4 border-t border-line pt-4">
          <SidebarFooter
            user={user}
            isLoggingOut={isLoggingOut}
            onLogout={logout}
          />
        </div>
      </div>
    </div>
  );
}
