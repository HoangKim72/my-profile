"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import { NAV_LINKS, type NavLink } from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";
import type { AuthUser } from "@/types";
import { ButtonLink, ThemeToggle, cn } from "@/components/ui";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { AccountMenu } from "@/components/layout/AccountMenu";

const MOBILE_MENU_ID = "mobile-nav-menu";

interface NavbarClientProps {
  initialUser?: AuthUser | null;
}

function mapAuthUser(email: string | undefined, id: string): AuthUser {
  return {
    id,
    email: email ?? `${id}@users.local`,
    role: "viewer",
  };
}

async function loadCurrentUserFromServer() {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { user?: AuthUser | null };

  return data.user ?? null;
}

export function NavbarClient({ initialUser = null }: NavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [isOpen, setIsOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isAuthReady, setIsAuthReady] = useState(Boolean(initialUser));

  useEffect(() => {
    let isMounted = true;

    const syncUser = async () => {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!supabaseUser) {
        setUser(null);
        setIsAuthReady(true);
        return;
      }

      const serverUser = await loadCurrentUserFromServer();

      if (!isMounted) {
        return;
      }

      setUser(
        serverUser?.id === supabaseUser.id
          ? serverUser
          : mapAuthUser(supabaseUser.email, supabaseUser.id),
      );
      setIsAuthReady(true);
    };

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const syncSessionUser = async () => {
        if (!session?.user) {
          if (isMounted) {
            setUser(null);
            setIsAuthReady(true);
          }
          return;
        }

        const serverUser = await loadCurrentUserFromServer();

        if (!isMounted) {
          return;
        }

        setUser(
          serverUser?.id === session.user.id
            ? serverUser
            : mapAuthUser(session.user.email, session.user.id),
        );
        setIsAuthReady(true);
      };

      if (!isMounted) {
        return;
      }

      void syncSessionUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Close the mobile menu whenever the route changes.
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
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const displayName = user?.profile?.fullName || user?.email || "Tài khoản";
  const initial = (displayName.trim().charAt(0) || "T").toUpperCase();

  const isLinkActive = (link: NavLink) => {
    if (link.matchPathname === false) {
      return false;
    }

    if (link.href === "/") {
      return pathname === "/";
    }

    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await supabase.auth.signOut();
      setIsOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95">
      <div className="container-custom flex h-16 items-center justify-between gap-4">
        <SiteLogo />

        <nav aria-label="Điều hướng chính" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const isActive = isLinkActive(link);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-10 cursor-pointer items-center whitespace-nowrap rounded-lg px-2 text-sm font-medium transition-colors xl:px-3",
                      isActive
                        ? "text-ink"
                        : "text-muted hover:bg-sunken hover:text-ink",
                    )}
                  >
                    {link.label}
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-2 -bottom-3 xl:inset-x-3 h-0.5 rounded-full bg-accent"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          <div className="hidden lg:block">
            {!isAuthReady ? (
              <div
                aria-hidden="true"
                className="h-10 w-16 animate-pulse rounded-full bg-sunken"
              />
            ) : user ? (
              <AccountMenu
                displayName={displayName}
                email={user.email}
                initial={initial}
                isLoggingOut={isLoggingOut}
                onLogout={handleLogout}
              />
            ) : (
              <ButtonLink
                href="/login"
                size="sm"
                leftIcon={<LogIn size={16} aria-hidden="true" />}
              >
                Đăng nhập
              </ButtonLink>
            )}
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={isOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={isOpen}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => setIsOpen((value) => !value)}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-sunken lg:hidden"
          >
            {isOpen ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        id={MOBILE_MENU_ID}
        hidden={!isOpen}
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-surface lg:hidden"
      >
        <div className="container-custom space-y-4 py-4">
          <nav aria-label="Điều hướng chính trên di động">
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = isLinkActive(link);

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex h-11 cursor-pointer items-center rounded-lg px-3 text-base font-medium transition-colors",
                        isActive
                          ? "bg-accent-soft text-accent"
                          : "text-ink hover:bg-sunken",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-sm text-muted">Giao diện</span>
            <ThemeToggle showLabels />
          </div>

          <div className="border-t border-line pt-4">
            {!isAuthReady ? (
              <p className="text-sm text-muted">Đang tải tài khoản...</p>
            ) : user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
                  >
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {displayName}
                    </p>
                    <p className="truncate text-sm text-muted">{user.email}</p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ButtonLink
                    href="/dashboard"
                    variant="secondary"
                    fullWidth
                    onClick={() => setIsOpen(false)}
                    leftIcon={<LayoutDashboard size={16} aria-hidden="true" />}
                  >
                    Bảng điều khiển
                  </ButtonLink>
                  <LogoutButton
                    isLoggingOut={isLoggingOut}
                    onLogout={handleLogout}
                  />
                </div>
              </div>
            ) : (
              <ButtonLink
                href="/login"
                fullWidth
                onClick={() => setIsOpen(false)}
                leftIcon={<LogIn size={16} aria-hidden="true" />}
              >
                Đăng nhập
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
