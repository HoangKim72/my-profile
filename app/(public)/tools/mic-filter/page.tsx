import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { MicFilterWorkspace } from "@/components/tools/MicFilterWorkspace";
import { getMicFilterConfig } from "@/lib/tools/mic-filter-settings";

export const metadata: Metadata = {
  title: "Tool lọc mic",
  description: "Lọc mic hằng ngày",
};

// Reads the admin-editable config on every request
export const dynamic = "force-dynamic";

const micSans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const micMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-mic-mono",
});

export default async function MicFilterPage() {
  const { config } = await getMicFilterConfig();

  return (
    <div className={`${micSans.className} ${micMono.variable}`}>
      <MicFilterWorkspace config={config} />
    </div>
  );
}
