import Link from "next/link";
import { ArrowRight, Mic, Wrench } from "lucide-react";
import { Badge } from "@/components/ui";

const MIC_TOOL_FEATURES = [
  "Đọc file Excel lịch học, lọc phòng có mic không dây theo ca",
  "Bảng soạn mic ca sáng và bảng thu, phát, thay pin buổi trưa",
  "Nhắc giờ bật máy lạnh và báo cáo kết ca xuất PDF",
] as const;

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

      <Link
        href="/tools/mic-filter"
        className="group block cursor-pointer rounded-xl border border-line bg-surface p-5 transition-colors duration-150 hover:border-accent sm:p-6"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"
            >
              <Mic size={24} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold text-ink">Tool lọc mic</h3>
                <Badge tone="success">Sẵn sàng</Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
                Tải lên file Excel lịch học trong ngày, tool chia danh sách
                phòng cần mic theo từng ca và theo tầng, kèm checklist phòng
                cho cả ngày.
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-ink">
                {MIC_TOOL_FEATURES.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <span className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition-colors duration-150 group-hover:bg-accent-hover">
            Mở công cụ
            <ArrowRight size={16} aria-hidden="true" />
          </span>
        </div>
      </Link>

      <p className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-line-strong bg-sunken px-4 py-3 text-sm text-muted">
        <Wrench size={16} aria-hidden="true" className="shrink-0" />
        Các công cụ khác sẽ được bổ sung dần.
      </p>
    </section>
  );
}
