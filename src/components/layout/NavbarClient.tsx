"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import { NAV_LINKS, SITE_NAME } from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";
import type { AuthUser } from "@/types";

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

  const displayName = user?.profile?.fullName || user?.email || "Account";

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
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
    <nav className="sticky top-0 z-50 px-3 pt-3 md:px-4">
      <div className="container-custom">
        <div className="relative overflow-hidden rounded-[28px] border border-blue-100/80 bg-white/82 px-4 shadow-[0_22px_70px_-36px_rgba(15,23,42,0.42)] backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/82 md:px-6">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent" />
          <div className="pointer-events-none absolute -top-16 right-10 h-40 w-40 rounded-full bg-blue-200/35 blur-3xl dark:bg-blue-700/10" />

          <div className="flex min-h-[78px] items-center justify-between gap-3">
            <Link
              href="/"
              className="group relative z-10 flex min-w-0 items-center gap-3"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-[radial-gradient(circle_at_top,_#ffffff,_#dbeafe_55%,_#bfdbfe)] text-sm font-black tracking-[0.18em] text-slate-900 shadow-[0_12px_30px_-16px_rgba(59,130,246,0.75)] transition-transform duration-200 group-hover:-translate-y-0.5 dark:border-blue-900/70 dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_rgba(30,41,59,0.95)_60%,_rgba(15,23,42,1))] dark:text-white">
                AC
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gray-500 dark:text-gray-400">
                  Portfolio
                </p>
                <p className="truncate text-lg font-semibold tracking-tight text-gray-950 dark:text-white">
                  {SITE_NAME}
                </p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center rounded-full border border-gray-200/80 bg-gray-50/85 p-1.5 shadow-inner dark:border-gray-800/80 dark:bg-gray-900/80">
              {NAV_LINKS.map((link) => {
                const isActive = isLinkActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white text-gray-950 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.6)] dark:bg-gray-950 dark:text-white"
                        : "text-gray-600 hover:bg-white/80 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-950/80 dark:hover:text-white"
                    }`}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {isActive && (
                      <span className="absolute inset-x-5 bottom-1 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              {!isAuthReady ? (
                <div className="flex items-center gap-3 rounded-full border border-gray-200/80 bg-gray-50/80 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/70">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-28 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center gap-3 rounded-full border border-gray-200/80 bg-white/90 px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25">
                      <UserCircle2 size={18} />
                    </div>
                    <div className="max-w-44">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {displayName}
                      </p>
                      <p className="truncate text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Logged in
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/80 dark:bg-blue-950/40 dark:text-blue-100 dark:hover:border-blue-800 dark:hover:bg-blue-950/70"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-100"
                  >
                    <LogOut size={16} />
                    {isLoggingOut ? "Signing out..." : "Logout"}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-100 dark:hover:border-blue-800 dark:hover:bg-blue-950/70"
                >
                  <Sparkles size={16} />
                  Login
                </Link>
              )}
            </div>

            <button
              type="button"
              aria-expanded={isOpen}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white/90 text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-800 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:border-blue-900 dark:hover:bg-blue-950/50 dark:hover:text-blue-100 lg:hidden"
              onClick={() => setIsOpen((value) => !value)}
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {isOpen && (
            <div className="fade-in border-t border-blue-100/80 py-4 dark:border-white/10 lg:hidden">
              <div className="space-y-3 rounded-[24px] border border-gray-200/80 bg-white/92 p-3 shadow-inner dark:border-gray-800 dark:bg-gray-950/82">
                {NAV_LINKS.map((link) => {
                  const isActive = isLinkActive(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-100"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
                  {!isAuthReady ? (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                      Loading account...
                    </div>
                  ) : user ? (
                    <div className="space-y-2">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                        Signed in as{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {displayName}
                        </span>
                      </div>
                      <Link
                        href="/dashboard"
                        className="block rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-100"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="block w-full rounded-2xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 dark:border-gray-800 dark:text-gray-200 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-100"
                      >
                        {isLoggingOut ? "Signing out..." : "Logout"}
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-100"
                      onClick={() => setIsOpen(false)}
                    >
                      <Sparkles size={16} />
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
