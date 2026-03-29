// app/(dashboard)/dashboard/settings/page.tsx

import { requireAdmin } from "@/lib/auth/check-auth";
import { ProfileSettingsForm } from "@/components/features/ProfileSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireAdmin();

  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>

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
