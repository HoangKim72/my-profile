// app/(dashboard)/dashboard/settings/page.tsx

import { requireAdmin } from "@/lib/auth/check-auth";
import { ProfileSettingsForm } from "@/components/features/ProfileSettingsForm";
import Link from "next/link";
import { ExternalLink, FileText, UserRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireAdmin();

  return (
    <div className="max-w-6xl space-y-8">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <UserRound size={14} />
              Public profile settings
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Chinh sua ho so cong khai cua {user.profile?.fullName || user.email}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Nhung thay doi trong form ben duoi se anh huong truc tiep den
              trang About va CV cong khai. Hay doi chieu lai sau khi luu.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/about" className="btn-secondary">
              <ExternalLink size={16} />
              Xem About
            </Link>
            <Link href="/cv" className="btn-secondary">
              <FileText size={16} />
              Xem CV
            </Link>
          </div>
        </div>
      </section>

      <ProfileSettingsForm
        authEmail={user.email}
        initialData={{
          fullName: user.profile?.fullName ?? null,
          headline: user.profile?.headline ?? null,
          bio: user.profile?.bio ?? null,
          avatarUrl: user.profile?.avatarUrl ?? null,
          email: user.profile?.email ?? user.email,
          phone: user.profile?.phone ?? null,
          githubUrl: user.profile?.githubUrl ?? null,
          linkedinUrl: user.profile?.linkedinUrl ?? null,
          facebookUrl: user.profile?.facebookUrl ?? null,
          websiteUrl: user.profile?.websiteUrl ?? null,
        }}
      />
    </div>
  );
}
