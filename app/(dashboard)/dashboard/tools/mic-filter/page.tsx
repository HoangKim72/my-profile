// app/(dashboard)/dashboard/tools/mic-filter/page.tsx

export const dynamic = "force-dynamic";

import { AlertTriangle, ExternalLink } from "lucide-react";
import { ButtonLink, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/check-auth";
import { getMicFilterConfig } from "@/lib/tools/mic-filter-settings";
import { MicFilterConfigForm } from "@/components/tools/MicFilterConfigForm";

export default async function MicFilterSettingsPage() {
  await requireAdmin();
  const { config, source, updatedAt, warning } = await getMicFilterConfig();

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        title="Cấu hình tool lọc mic"
        description={
          source === "database" && updatedAt
            ? `Đang dùng cấu hình đã lưu, cập nhật lúc ${updatedAt.toLocaleString("vi-VN")}.`
            : "Đang dùng cấu hình mặc định trong code. Lưu form bên dưới để tạo cấu hình riêng."
        }
        actions={
          <ButtonLink
            href="/tools/mic-filter"
            variant="secondary"
            leftIcon={<ExternalLink size={16} aria-hidden="true" />}
          >
            Mở tool
          </ButtonLink>
        }
      />

      {warning && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn-soft p-4 text-sm text-ink"
        >
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0 text-warn"
            aria-hidden="true"
          />
          {warning}
        </p>
      )}

      <MicFilterConfigForm
        key={updatedAt?.toISOString() ?? "default"}
        initialConfig={config}
        isUsingDefaults={source === "default"}
      />
    </div>
  );
}
