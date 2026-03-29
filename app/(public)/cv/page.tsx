import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/check-auth";
import { ProfileResume } from "@/components/features/ProfileResume";
import { getSiteProfile } from "@/lib/profile/site-profile";
import { buildResumeViewModel } from "@/lib/profile/resume-view";

export const metadata: Metadata = {
  title: "CV / Resume",
  description: "CV cong khai dong bo voi profile admin",
};

export const dynamic = "force-dynamic";

export default async function CVPage() {
  const [siteProfile, currentUser] = await Promise.all([
    getSiteProfile(),
    getCurrentUser(),
  ]);

  return (
    <ProfileResume
      data={buildResumeViewModel(siteProfile)}
      canEdit={currentUser?.role === "admin"}
      mode="cv"
    />
  );
}
