// app/(dashboard)/dashboard/layout.tsx

import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/check-auth";
import { DashboardMobileNav, Sidebar } from "@/components/layout/Sidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bảng điều khiển",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="flex flex-1 flex-col bg-canvas lg:flex-row">
      <Sidebar user={user} />
      <DashboardMobileNav user={user} />
      <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
