import type { Metadata } from "next";
import { FolderOpen, Mic } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { ResourcesSection } from "@/components/home/ResourcesSection";
import { Shortcuts } from "@/components/home/Shortcuts";
import { ToolsSection } from "@/components/home/ToolsSection";
import { SITE_NAME } from "@/lib/utils/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Công cụ và tài liệu | ${SITE_NAME}`,
  description:
    "Các công cụ dùng hằng ngày như tool lọc mic theo ca, cùng kho tài liệu môn học đóng gói ZIP sẵn để tải về.",
};

export default function HomePage() {
  return (
    <div className="container-custom py-10 sm:py-14">
      <section aria-labelledby="home-title" className="max-w-3xl">
        <h1
          id="home-title"
          className="text-3xl font-bold tracking-tight text-ink sm:text-4xl"
        >
          Công cụ và tài liệu của {SITE_NAME}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted sm:text-lg sm:leading-8">
          Các công cụ mình dùng hằng ngày và kho tài liệu môn học đóng gói sẵn
          để tải về.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/tools/mic-filter" leftIcon={<Mic size={18} />}>
            Mở tool lọc mic
          </ButtonLink>
          <ButtonLink
            href="/projects"
            variant="secondary"
            leftIcon={<FolderOpen size={18} />}
          >
            Xem kho tài liệu
          </ButtonLink>
        </div>
      </section>

      <div className="mt-12 space-y-14 sm:mt-16 sm:space-y-16">
        <ToolsSection />
        <ResourcesSection />
        <Shortcuts />
      </div>
    </div>
  );
}
