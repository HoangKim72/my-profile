import Link from "next/link";
import { ArrowRight, Gauge, Mic, Wrench, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui";

const TOOLS: ReadonlyArray<{
  href: string;
  title: string;
  description: string;
  features: readonly string[];
  icon: LucideIcon;
}> = [
  {
    href: "/tools/mic-filter",
    title: "Tool lọc mic",
    description:
      "Tải lên file Excel lịch học trong ngày, tool chia danh sách phòng cần mic theo từng ca và theo tầng, kèm checklist phòng cho cả ngày.",
    features: [
      "Đọc file Excel lịch học, lọc phòng có mic không dây theo ca",
      "Bảng soạn mic ca sáng và bảng thu, phát, thay pin buổi trưa",
      "Nhắc giờ bật máy lạnh và báo cáo kết ca xuất PDF",
    ],
    icon: Mic,
  },
  {
    href: "/tools/speed-test",
    title: "Kiểm tra tốc độ mạng",
    description:
      "Đo tốc độ tải xuống, tải lên, ping và độ dao động ngay trên trình duyệt, kèm đánh giá cho xem video, chơi game và gọi video.",
    features: [
      "Đo tới máy chủ Cloudflare gần bạn nhất",
      "Giới hạn dữ liệu cho mỗi lần đo, không lưu kết quả",
      "Sao chép kết quả để gửi cho người khác",
    ],
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
      <div className="mb-6">
        <h2 id="cong-cu-title" className="text-2xl font-semibold text-ink">
          Công cụ
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Chạy ngay trên trình duyệt, không cần đăng nhập.
        </p>
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
                <div className="flex items-start gap-4">
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

                <ul className="mt-4 flex-1 space-y-2 text-sm leading-6 text-ink">
                  {tool.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <span className="mt-5 inline-flex min-h-11 items-center gap-2 self-start rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition-colors duration-150 group-hover:bg-accent-hover">
                  Mở công cụ
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-line-strong bg-sunken px-4 py-3 text-sm text-muted">
        <Wrench size={16} aria-hidden="true" className="shrink-0" />
        Các công cụ khác sẽ được bổ sung dần.
      </p>
    </section>
  );
}
