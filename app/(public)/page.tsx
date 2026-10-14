import type { Metadata } from "next";
import { ResourcesSection } from "@/components/home/ResourcesSection";
import { Shortcuts } from "@/components/home/Shortcuts";
import { ToolsSection } from "@/components/home/ToolsSection";
import { SITE_NAME } from "@/lib/utils/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Công cụ và tài liệu | ${SITE_NAME}`,
  description:
    "Các công cụ dùng hằng ngày như tool lọc mic theo ca và kiểm tra tốc độ mạng, cùng kho tài liệu môn học đóng gói ZIP sẵn để tải về.",
};

export default function HomePage() {
  return (
    <div className="container-custom py-8 sm:py-12">
      <section aria-labelledby="home-title" className="max-w-3xl">
        <h1
          id="home-title"
          className="text-3xl font-bold tracking-tight text-ink sm:text-4xl"
        >
          Công cụ và tài liệu của {SITE_NAME}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted">
          Các công cụ mình dùng hằng ngày và kho tài liệu môn học đóng gói sẵn
          để tải về.
        </p>
      </section>

      <div className="mt-8 space-y-12 sm:mt-10 sm:space-y-14">
        <ToolsSection />
        <ResourcesSection />
        <Shortcuts />
      </div>
    </div>
  );
}
