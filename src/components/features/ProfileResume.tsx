import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Facebook,
  FileText,
  Github,
  Globe,
  Linkedin,
  Mail,
  PencilLine,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ResumeViewModel } from "@/lib/profile/resume-view";

interface ProfileResumeProps {
  data: ResumeViewModel;
  canEdit?: boolean;
  mode?: "about" | "cv";
}

interface ResumeContactItem {
  label: string;
  value: string;
  href: string;
  icon: typeof Mail;
}

interface ResumeLinkItem {
  label: string;
  href: string;
  icon: typeof Github;
}

const PAGE_COPY = {
  about: {
    badge: "About / Header",
    title: "Ho so gioi thieu",
    description:
      "Phan gioi thieu nay duoc trinh bay theo bo cuc CV de de doc, de cap nhat va phu hop voi hinh anh portfolio ca nhan.",
  },
  cv: {
    badge: "Curriculum Vitae",
    title: "CV cong khai",
    description:
      "Ban tom tat online cua ho so ca nhan. Admin co the cap nhat noi dung trong dashboard settings va thay doi se hien thi ngay tai day.",
  },
} as const;

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-blue-800 dark:hover:text-blue-200"
    >
      {children}
    </a>
  );
}

export function ProfileResume({
  data,
  canEdit = false,
  mode = "about",
}: ProfileResumeProps) {
  const pageCopy = PAGE_COPY[mode];

  const contactItems: ResumeContactItem[] = [
    data.publicEmail
      ? {
          label: "Email",
          value: data.publicEmail,
          href: `mailto:${data.publicEmail}`,
          icon: Mail,
        }
      : null,
    data.phone
      ? {
          label: "Phone",
          value: data.phone,
          href: `tel:${data.phone}`,
          icon: Phone,
        }
      : null,
    data.websiteUrl
      ? {
          label: "Website",
          value: data.websiteUrl,
          href: data.websiteUrl,
          icon: Globe,
        }
      : null,
  ].filter((item): item is ResumeContactItem => item !== null);

  const profileLinks: ResumeLinkItem[] = [
    data.githubUrl
      ? {
          label: "GitHub",
          href: data.githubUrl,
          icon: Github,
        }
      : null,
    data.linkedinUrl
      ? {
          label: "LinkedIn",
          href: data.linkedinUrl,
          icon: Linkedin,
        }
      : null,
    data.facebookUrl
      ? {
          label: "Facebook",
          href: data.facebookUrl,
          icon: Facebook,
        }
      : null,
  ].filter((item): item is ResumeLinkItem => item !== null);

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_32%)] py-10 md:py-16">
      <div className="container-custom">
        <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white/95 shadow-[0_32px_90px_-34px_rgba(15,23,42,0.35)] backdrop-blur dark:border-blue-950/60 dark:bg-gray-950/95">
          <div className="grid lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="border-b border-blue-100 bg-[linear-gradient(180deg,rgba(239,246,255,0.9),rgba(255,255,255,0.95))] p-8 dark:border-blue-950/60 dark:bg-[linear-gradient(180deg,rgba(3,7,18,0.95),rgba(15,23,42,0.92))] lg:border-b-0 lg:border-r">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900 dark:bg-gray-950 dark:text-blue-200">
                <ShieldCheck size={14} />
                {pageCopy.badge}
              </div>

              <div className="mt-8 space-y-4">
                <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-3 shadow-[0_22px_60px_-28px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-gray-900/80">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),rgba(191,219,254,0.85)_45%,rgba(147,197,253,0.8))] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),rgba(30,41,59,0.92)_55%,rgba(15,23,42,1))]">
                    {data.avatarUrl ? (
                      <Image
                        src={data.avatarUrl}
                        alt={`Chan dung cua ${data.fullName}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 320px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/60 bg-white/80 text-4xl font-black uppercase tracking-[0.16em] text-slate-900 shadow-[0_16px_40px_-24px_rgba(59,130,246,0.7)] dark:border-white/10 dark:bg-white/10 dark:text-white">
                          {data.fullName
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("") || "AC"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                    Anh Coder
                  </p>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
                    {data.fullName}
                  </h1>
                </div>

                <p className="text-base leading-7 text-gray-600 dark:text-gray-300">
                  {data.headline}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/projects" className="btn-primary">
                  Xem projects
                </Link>
                <Link href="/contact" className="btn-secondary">
                  Lien he
                </Link>
              </div>

              {canEdit && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/80 dark:bg-amber-950/30 dark:text-amber-100">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5" size={18} />
                    <div className="space-y-3">
                      <p>
                        Tai khoan admin dang dang nhap. Ban co the chinh sua ho
                        so ngay bay gio.
                      </p>
                      <Link
                        href="/dashboard/settings"
                        className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-600"
                      >
                        <PencilLine size={16} />
                        Mo dashboard settings
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">
                  Lien he
                </h2>

                {contactItems.length > 0 ? (
                  <div className="space-y-3">
                    {contactItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          target={
                            item.href.startsWith("mailto:") ||
                            item.href.startsWith("tel:")
                              ? undefined
                              : "_blank"
                          }
                          rel={
                            item.href.startsWith("mailto:") ||
                            item.href.startsWith("tel:")
                              ? undefined
                              : "noreferrer"
                          }
                          className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-blue-800"
                        >
                          <span className="mt-0.5 rounded-xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                            <Icon size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                              {item.label}
                            </span>
                            <span className="mt-1 block break-all text-sm font-medium text-gray-800 dark:text-gray-100">
                              {item.value}
                            </span>
                          </span>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Chua cap nhat thong tin lien he cong khai.
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">
                  Ho so online
                </h2>

                {profileLinks.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {profileLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <ExternalLink key={item.label} href={item.href}>
                          <Icon size={16} />
                          {item.label}
                        </ExternalLink>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Chua cap nhat link GitHub, LinkedIn hoac Facebook.
                  </div>
                )}
              </div>
            </aside>

            <div className="p-8 md:p-10">
              <header className="border-b border-gray-200 pb-8 dark:border-gray-800">
                <div className="max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-600 dark:border-gray-800 dark:text-gray-300">
                    <FileText size={14} />
                    {pageCopy.title}
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white md:text-4xl">
                    {data.fullName}
                  </h2>
                  <p className="text-lg leading-8 text-gray-600 dark:text-gray-300">
                    {pageCopy.description}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/projects" className="btn-primary">
                    Khám phá dự án
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/contact" className="btn-secondary">
                    Gửi liên hệ
                  </Link>
                </div>
              </header>

              <div className="grid gap-6 pt-8 md:grid-cols-2">
                <section className="rounded-3xl border border-gray-200 bg-gray-50/80 p-6 dark:border-gray-800 dark:bg-gray-900/60 md:col-span-2">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                    Tóm tắt
                  </h3>
                  <div className="mt-4 space-y-4 text-base leading-8 text-gray-700 dark:text-gray-300">
                    {data.summaryParagraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-gray-200 p-6 dark:border-gray-800">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                    Điểm mạnh chính
                  </h3>
                  <div className="mt-4 space-y-3">
                    {data.strengths.map((strength) => (
                      <div
                        key={strength}
                        className="rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-7 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
                      >
                        {strength}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-gray-200 p-6 dark:border-gray-800">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                    Định hướng hiện tại
                  </h3>
                  <p className="mt-4 text-sm leading-8 text-gray-700 dark:text-gray-300">
                    {data.currentFocus}
                  </p>
                </section>

                <section className="rounded-3xl border border-gray-200 p-6 dark:border-gray-800 md:col-span-2">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                    Đầu tư gần đây
                  </h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {data.highlights.map((highlight) => (
                      <div
                        key={highlight}
                        className="rounded-2xl border border-gray-200 bg-white p-4 text-sm leading-7 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                      >
                        {highlight}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
