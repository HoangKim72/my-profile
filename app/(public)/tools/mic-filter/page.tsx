import type { Metadata } from "next";
import { MicFilterWorkspace } from "@/components/tools/MicFilterWorkspace";

export const metadata: Metadata = {
  title: "Tool lọc mic",
  description: "Lọc mic hằng ngày",
};

export default function MicFilterPage() {
  return <MicFilterWorkspace />;
}
