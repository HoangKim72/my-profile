import type { Metadata } from "next";
import { MicFilterWorkspace } from "@/components/tools/MicFilterWorkspace";
import { getMicFilterConfig } from "@/lib/tools/mic-filter-settings";

export const metadata: Metadata = {
  title: "Tool lọc mic",
  description: "Lọc mic hằng ngày",
};

// Reads the admin-editable config on every request
export const dynamic = "force-dynamic";

export default async function MicFilterPage() {
  const { config } = await getMicFilterConfig();

  return <MicFilterWorkspace config={config} />;
}
