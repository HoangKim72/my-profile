// app/(dashboard)/dashboard/layout.tsx

import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/check-auth";
import { Sidebar } from "@/components/layout/Sidebar";

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
    <div className="flex h-full">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {user.profile?.fullName || "User"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user.role}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {user.profile?.fullName?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
