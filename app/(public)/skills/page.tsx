import type { Metadata } from "next";
import { SkillsShowcase } from "@/components/features/SkillsShowcase";
import { getSiteProfile } from "@/lib/profile/site-profile";
import { getSkillsPageData } from "@/lib/skills/data";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Skills duoc tong hop tu GitHub, project evidence, WakaTime va lop manual",
};

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  let siteProfile = null;

  try {
    siteProfile = await getSiteProfile();
  } catch (error) {
    console.error("Unable to load site profile for /skills:", error);
  }

  const skillsData = await getSkillsPageData(siteProfile);

  return <SkillsShowcase data={skillsData} />;
}
