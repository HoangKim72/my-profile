// app/(dashboard)/dashboard/tools/mic-filter/page.tsx

export const dynamic = "force-dynamic";

import Link from "next/link";
import { ExternalLink, Mic } from "lucide-react";
import { requireAdmin } from "@/lib/auth/check-auth";
import { getMicFilterConfig } from "@/lib/tools/mic-filter-settings";
import { MicFilterConfigForm } from "@/components/tools/MicFilterConfigForm";

export default async function MicFilterSettingsPage() {
  await requireAdmin();
  const { config, source, updatedAt, warning } = await getMicFilterConfig();

  return (
    <div className="max-w-5xl space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-200">
              <Mic size={14} />
              Tool lọc mic
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Cấu hình tool lọc mic
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {source === "database" && updatedAt
                ? `Đang dùng cấu hình đã lưu, cập nhật lúc ${updatedAt.toLocaleString("vi-VN")}.`
                : "Đang dùng cấu hình mặc định trong code. Lưu form bên dưới để tạo cấu hình riêng."}
            </p>
          </div>
          <Link href="/tools/mic-filter" className="btn-secondary">
            <ExternalLink size={16} />
            Mở tool
          </Link>
        </div>
        {warning && (
          <p className="mt-4 rounded-2xl bg-amber-100 p-4 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
            {warning}
          </p>
        )}
      </section>

      <MicFilterConfigForm
        key={updatedAt?.toISOString() ?? "default"}
        initialConfig={config}
        isUsingDefaults={source === "default"}
      />
    </div>
  );
}
