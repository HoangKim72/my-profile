import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/check-auth";
import { getSiteProfile } from "@/lib/profile/site-profile";
import { buildResumeViewModel } from "@/lib/profile/resume-view";
import { ProfileResume } from "@/components/features/ProfileResume";

export const metadata: Metadata = {
  title: "About",
  description: "Ho so gioi thieu theo bo cuc CV",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [siteProfile, currentUser] = await Promise.all([
    getSiteProfile(),
    getCurrentUser(),
  ]);

  return (
    <ProfileResume
      data={buildResumeViewModel(siteProfile)}
      canEdit={currentUser?.role === "admin"}
      mode="about"
    />
  );
}
