"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, UserCircle2, X } from "lucide-react";
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

export function NavbarClient({ initialUser = null }: NavbarClientProps) {
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

      setUser(
        supabaseUser
          ? mapAuthUser(supabaseUser.email, supabaseUser.id)
          : null,
      );
      setIsAuthReady(true);
    };

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setUser(
        session?.user
          ? mapAuthUser(session.user.email, session.user.id)
          : null,
      );
      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const displayName = user?.profile?.fullName || user?.email || "Account";

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
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="font-bold text-xl text-gradient">
            {SITE_NAME}
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!isAuthReady ? (
              <div className="h-10 w-36 rounded-lg border border-gray-200 dark:border-gray-800" />
            ) : user ? (
              <>
                <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
                  <UserCircle2 size={18} className="text-gray-500" />
                  <span className="max-w-44 truncate font-medium">{displayName}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 disabled:opacity-60 dark:hover:bg-gray-800"
                >
                  <LogOut size={16} />
                  {isLoggingOut ? "Signing out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="space-y-2 border-t border-gray-200 py-4 dark:border-gray-800 md:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
              {!isAuthReady ? (
                <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                  Loading account...
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                    Signed in as <span className="font-medium">{displayName}</span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-gray-100 disabled:opacity-60 dark:hover:bg-gray-800"
                  >
                    {isLoggingOut ? "Signing out..." : "Logout"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
