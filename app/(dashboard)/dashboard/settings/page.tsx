// app/(dashboard)/dashboard/settings/page.tsx

import { requireAdmin } from "@/lib/auth/check-auth";
import { ProfileSettingsForm } from "@/components/features/ProfileSettingsForm";
import { ExternalLink, FileText } from "lucide-react";
import { ButtonLink, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireAdmin();

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        title="Cài đặt hồ sơ"
        description={`Chỉnh sửa hồ sơ công khai của ${user.profile?.fullName || user.email}. Thay đổi sẽ hiển thị ngay trên trang Giới thiệu và CV, hãy đối chiếu lại sau khi lưu.`}
        actions={
          <>
            <ButtonLink
              href="/about"
              variant="secondary"
              leftIcon={<ExternalLink size={16} aria-hidden="true" />}
            >
              Xem trang Giới thiệu
            </ButtonLink>
            <ButtonLink
              href="/cv"
              variant="secondary"
              leftIcon={<FileText size={16} aria-hidden="true" />}
            >
              Xem CV
            </ButtonLink>
          </>
        }
      />

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
