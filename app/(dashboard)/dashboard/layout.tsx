// app/(dashboard)/dashboard/layout.tsx

import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/check-auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { BadgeCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_26%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_34%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_32%,#111827_100%)] lg:flex">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/82 px-5 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/78 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                <Sparkles size={14} />
                Admin Control Center
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                Quan ly portfolio va tai nguyen cong khai
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Theo doi project, cap nhat profile cong khai va dieu phoi nhung
                khu vuc quan trong cua website tu mot workspace gon gang hon.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:self-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-base font-bold text-white shadow-lg shadow-blue-500/25">
                {user.profile?.fullName?.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  {user.profile?.fullName || "User"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <BadgeCheck size={12} />
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto px-5 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
