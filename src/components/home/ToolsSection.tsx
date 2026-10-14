import Link from "next/link";
import { ArrowRight, Gauge, Mic, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui";

const TOOLS: ReadonlyArray<{
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    href: "/tools/mic-filter",
    title: "Tool lọc mic",
    description:
      "Chia phòng cần mic theo ca và tầng từ file Excel lịch học.",
    icon: Mic,
  },
  {
    href: "/tools/speed-test",
    title: "Kiểm tra tốc độ mạng",
    description:
      "Đo tải xuống, tải lên, ping và độ dao động.",
    icon: Gauge,
  },
];

export function ToolsSection() {
  return (
    <section
      id="cong-cu"
      aria-labelledby="cong-cu-title"
      className="scroll-mt-20"
    >
      <div className="mb-4">
        <h2 id="cong-cu-title" className="text-2xl font-semibold text-ink">
          Công cụ
        </h2>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;

          return (
            <li key={tool.href} className="flex">
              <Link
                href={tool.href}
                className="group flex w-full cursor-pointer flex-col rounded-xl border border-line bg-surface p-5 transition-colors duration-150 hover:border-accent sm:p-6"
              >
                <div className="flex flex-1 items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"
                  >
                    <Icon size={24} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-ink">
                        {tool.title}
                      </h3>
                      <Badge tone="success">Sẵn sàng</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted sm:text-base sm:leading-7">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <span className="mt-5 inline-flex min-h-11 items-center gap-2 self-start rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition-colors duration-150 group-hover:bg-accent-hover">
                  Mở công cụ
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
