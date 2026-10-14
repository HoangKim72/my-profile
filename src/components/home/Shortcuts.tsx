import Link from "next/link";
import { ArrowRight, FileText, Mail, UserRound } from "lucide-react";

const SHORTCUTS = [
  {
    href: "/about",
    title: "Giới thiệu",
    description: "Mình là ai và đang làm gì.",
    icon: UserRound,
  },
  {
    href: "/cv",
    title: "CV",
    description: "Kinh nghiệm, học vấn và kỹ năng.",
    icon: FileText,
  },
  {
    href: "/contact",
    title: "Liên hệ",
    description: "Gửi lời nhắn hoặc góp ý cho mình.",
    icon: Mail,
  },
] as const;

export function Shortcuts() {
  return (
    <section aria-labelledby="loi-tat-title">
      <h2 id="loi-tat-title" className="mb-4 text-lg font-semibold text-ink">
        Tìm hiểu thêm
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SHORTCUTS.map(({ href, title, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong hover:bg-sunken"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sunken text-muted transition-colors group-hover:text-accent"
              >
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  {title}
                </span>
                <span className="block text-sm leading-6 text-muted">
                  {description}
                </span>
              </span>
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="shrink-0 text-muted transition-colors group-hover:text-accent"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
