// src/components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthUser } from "@/types";
import { ADMIN_NAV_LINKS } from "@/lib/utils/constants";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SidebarProps {
  user: AuthUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <Link href="/dashboard" className="font-bold text-xl text-gradient">
          Admin
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        {ADMIN_NAV_LINKS.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-800">
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.profile?.fullName || "User"}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {user.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
