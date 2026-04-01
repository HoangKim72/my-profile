// src/components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthUser } from "@/types";
import { ADMIN_NAV_LINKS } from "@/lib/utils/constants";
import {
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SidebarProps {
  user: AuthUser;
}

const NAV_META: Record<
  string,
  {
    description: string;
    icon: typeof LayoutDashboard;
  }
> = {
  "/dashboard": {
    description: "Tong quan he thong va cac muc can xu ly.",
    icon: LayoutDashboard,
  },
  "/dashboard/projects": {
    description: "Danh sach folder, trang thai va file tai xuong.",
    icon: FolderKanban,
  },
  "/dashboard/settings": {
    description: "Cap nhat ho so cong khai va hinh anh dai dien.",
    icon: Settings,
  },
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] lg:min-h-screen lg:w-80 lg:border-b-0 lg:border-r lg:border-slate-200 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <Link href="/dashboard" className="inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,_#ffffff,_#bfdbfe_58%,_#93c5fd)] text-sm font-black tracking-[0.18em] text-slate-900 shadow-[0_18px_40px_-24px_rgba(59,130,246,0.8)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),rgba(30,41,59,0.95)_62%,rgba(15,23,42,1))] dark:text-white">
              AC
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Control Center
              </span>
              <span className="block text-xl font-bold text-slate-950 dark:text-white">
                Admin Workspace
              </span>
            </span>
          </Link>

          <div className="mt-5 rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_26px_70px_-34px_rgba(15,23,42,0.42)] dark:border-white/10 dark:bg-slate-950/70">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-500/25">
                <UserCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-slate-950 dark:text-white">
                  {user.profile?.fullName || "Admin user"}
                </p>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <ShieldCheck size={14} />
                  {user.role}
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Khu quan tri de theo doi project, cap nhat profile cong khai va
              xu ly cac tai nguyen hien thi tren website.
            </p>
          </div>
        </div>

        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:text-blue-200"
            >
              <ExternalLink size={15} />
              Xem trang cong khai
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:text-blue-200"
            >
              <ExternalLink size={15} />
              Preview ho so
            </Link>
          </div>
        </div>

        <div className="flex-1 px-5 py-5">
          <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
            Dieu huong chinh
          </div>
          <nav className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-1">
            {ADMIN_NAV_LINKS.map((link) => {
              const isActive = isLinkActive(link.href);
              const navMeta = NAV_META[link.href];
              const Icon = navMeta?.icon ?? LayoutDashboard;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group rounded-[24px] border px-4 py-4 transition-all duration-200 ${
                    isActive
                      ? "border-blue-600 bg-blue-600 text-white shadow-[0_22px_50px_-30px_rgba(37,99,235,0.85)]"
                      : "border-slate-200 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-slate-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200"
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {link.label}
                      </span>
                      <span
                        className={`mt-1 block text-xs leading-5 ${
                          isActive
                            ? "text-blue-100"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {navMeta?.description}
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-5 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-100 dark:hover:bg-red-950/70"
          >
            <LogOut size={18} />
            Dang xuat
          </button>
        </div>
      </div>
    </aside>
  );
}
