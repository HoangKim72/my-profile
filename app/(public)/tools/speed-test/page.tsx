import type { Metadata } from "next";
import { SpeedTestTool } from "@/components/tools/SpeedTestTool";
import { PageHeader } from "@/components/ui";

const DESCRIPTION =
  "Đo tốc độ tải xuống, tải lên, ping và độ dao động của mạng bằng Cloudflare.";

export const metadata: Metadata = {
  title: "Kiểm tra tốc độ mạng",
  description: DESCRIPTION,
};

export default function SpeedTestPage() {
  return (
    <div className="container-custom max-w-4xl py-10 md:py-14">
      <PageHeader
        eyebrow="Công cụ"
        title="Kiểm tra tốc độ mạng"
        description={DESCRIPTION}
      />
      <div className="mt-8">
        <SpeedTestTool />
      </div>
    </div>
  );
}
