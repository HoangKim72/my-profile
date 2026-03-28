import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Blocks,
  Bot,
  CalendarDays,
  FolderKanban,
  Gauge,
  Globe2,
  Headphones,
  Layers3,
  LayoutGrid,
  Mic,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

const tools = [
  {
    title: "Tool lọc mic",
    description: "Lọc mic hằng ngày",
    href: "/tools/mic-filter",
    status: "Sẵn sàng",
    icon: Mic,
    featured: true,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: AudioLines,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: LayoutGrid,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: Wand2,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: Layers3,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: FolderKanban,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: Sparkles,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: Gauge,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: Globe2,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: CalendarDays,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: Headphones,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: Settings2,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: Blocks,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: Bot,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: ShieldCheck,
  },
  {
    title: "Chức năng đang phát triển",
    description: "Tính năng sẽ sớm được cập nhật",
    icon: AudioLines,
  },
] as const;

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_28%)]">
      <section className="container-custom py-14 md:py-20">
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            Bảng công cụ công khai
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-950 dark:text-white md:text-6xl">
            Bảng công cụ dành cho người dùng
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Truy cập nhanh các công cụ đang sẵn sàng sử dụng. Những ô chưa mở sẽ
            được cập nhật dần trong các phiên bản tiếp theo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool, index) => {
            const Icon = tool.icon;

            if ("href" in tool) {
              return (
                <Link
                  key={`${tool.title}-${index}`}
                  href={tool.href}
                  className="group relative min-h-56 overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-white via-blue-50 to-cyan-100 p-6 shadow-[0_24px_60px_-24px_rgba(37,99,235,0.45)] transition-transform duration-200 hover:-translate-y-1 dark:border-blue-900 dark:from-gray-950 dark:via-blue-950/60 dark:to-cyan-950/50"
                >
                  <div className="absolute right-4 top-4 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">
                    {tool.status}
                  </div>
                  <div className="mb-8 inline-flex rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-600/25">
                    <Icon size={28} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-gray-950 dark:text-white">
                      {tool.title}
                    </h2>
                    <p className="text-base leading-7 text-gray-700 dark:text-gray-300">
                      {tool.description}
                    </p>
                  </div>
                  <div className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-200">
                    Sử dụng công cụ
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              );
            }

            return (
              <div
                key={`${tool.title}-${index}`}
                className="min-h-56 rounded-3xl border border-gray-200/80 bg-white/80 p-6 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80"
              >
                <div className="mb-8 inline-flex rounded-2xl bg-gray-100 p-3 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <Icon size={28} />
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {tool.title}
                  </h2>
                  <p className="text-sm leading-7 text-gray-600 dark:text-gray-400">
                    {tool.description}
                  </p>
                </div>
                <div className="mt-10 inline-flex rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Đang phát triển
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
