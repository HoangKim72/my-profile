import Image from "next/image";
import {
  ArrowRight,
  Facebook,
  Github,
  Globe,
  Linkedin,
  Mail,
  PencilLine,
  Phone,
} from "lucide-react";
import type { ResumeViewModel } from "@/lib/profile/resume-view";
import { ButtonLink, Card } from "@/components/ui";

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
    eyebrow: "Giới thiệu",
    description:
      "Hồ sơ giới thiệu trình bày theo bố cục CV để dễ đọc, dễ cập nhật và phản ánh đúng công việc hiện tại.",
  },
  cv: {
    eyebrow: "CV",
    description:
      "Bản tóm tắt trực tuyến của hồ sơ cá nhân, luôn đồng bộ với thông tin trong bảng điều khiển.",
  },
} as const;

const SECTION_TITLE = "text-base font-semibold text-ink";

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
      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-sunken"
    >
      {children}
      <span className="sr-only">(mở tab mới)</span>
    </a>
  );
}

function getInitials(fullName: string) {
  return (
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") || "AC"
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
          label: "Điện thoại",
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
    <div className="container-custom py-10 sm:py-14 print:py-0">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] print:grid-cols-[200px_minmax(0,1fr)] print:gap-6">
        <aside className="space-y-6" aria-label="Thông tin liên hệ">
          <div className="relative aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-xl border border-line bg-sunken">
            {data.avatarUrl ? (
              <Image
                src={data.avatarUrl}
                alt={`Chân dung của ${data.fullName}`}
                fill
                sizes="280px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-accent-soft text-3xl font-semibold uppercase text-accent"
                  aria-hidden="true"
                >
                  {getInitials(data.fullName)}
                </div>
              </div>
            )}
          </div>

          <section aria-labelledby="resume-lien-he" className="space-y-3">
            <h2 id="resume-lien-he" className={SECTION_TITLE}>
              Liên hệ
            </h2>

            {contactItems.length > 0 ? (
              <ul className="space-y-2">
                {contactItems.map((item) => {
                  const Icon = item.icon;
                  const isExternal = !(
                    item.href.startsWith("mailto:") ||
                    item.href.startsWith("tel:")
                  );

                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noreferrer" : undefined}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface p-3 transition-colors hover:border-line-strong hover:bg-sunken"
                      >
                        <span
                          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent print:hidden"
                          aria-hidden="true"
                        >
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                            {item.label}
                          </span>
                          <span className="mt-0.5 block break-all text-sm font-medium text-ink">
                            {item.value}
                          </span>
                        </span>
                        {isExternal && (
                          <span className="sr-only">(mở tab mới)</span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-line-strong p-3 text-sm text-muted">
                Chưa cập nhật thông tin liên hệ công khai.
              </p>
            )}
          </section>

          <section aria-labelledby="resume-ho-so-online" className="space-y-3">
            <h2 id="resume-ho-so-online" className={SECTION_TITLE}>
              Hồ sơ trực tuyến
            </h2>

            {profileLinks.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {profileLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.label}>
                      <ExternalLink href={item.href}>
                        <Icon size={16} aria-hidden="true" />
                        {item.label}
                      </ExternalLink>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-line-strong p-3 text-sm text-muted">
                Chưa cập nhật link GitHub, LinkedIn hoặc Facebook.
              </p>
            )}
          </section>
        </aside>

        <div className="min-w-0 space-y-6">
          <header className="border-b border-line pb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
              {pageCopy.eyebrow}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {data.fullName}
            </h1>
            <p className="mt-3 text-lg leading-8 text-ink">{data.headline}</p>
            <p className="mt-2 max-w-3xl text-base leading-7 text-muted print:hidden">
              {pageCopy.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 print:hidden">
              <ButtonLink
                href="/projects"
                rightIcon={<ArrowRight size={16} aria-hidden="true" />}
              >
                Xem kho tài liệu
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary">
                Liên hệ
              </ButtonLink>
              {canEdit && (
                <ButtonLink
                  href="/dashboard/settings"
                  variant="ghost"
                  leftIcon={<PencilLine size={16} aria-hidden="true" />}
                >
                  Chỉnh sửa hồ sơ
                </ButtonLink>
              )}
            </div>
          </header>

          <Card
            as="section"
            aria-labelledby="resume-tom-tat"
            className="print:break-inside-avoid"
          >
            <h2 id="resume-tom-tat" className={SECTION_TITLE}>
              Tóm tắt
            </h2>
            <div className="mt-3 space-y-3 text-base leading-7 text-ink">
              {data.summaryParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card
              as="section"
              aria-labelledby="resume-diem-manh"
              className="print:break-inside-avoid"
            >
              <h2 id="resume-diem-manh" className={SECTION_TITLE}>
                Điểm mạnh chính
              </h2>
              <ul className="mt-3 space-y-2">
                {data.strengths.map((strength) => (
                  <li
                    key={strength}
                    className="rounded-lg bg-accent-soft px-3 py-2 text-sm leading-6 text-ink"
                  >
                    {strength}
                  </li>
                ))}
              </ul>
            </Card>

            <Card
              as="section"
              aria-labelledby="resume-dinh-huong"
              className="print:break-inside-avoid"
            >
              <h2 id="resume-dinh-huong" className={SECTION_TITLE}>
                Định hướng hiện tại
              </h2>
              <p className="mt-3 text-sm leading-7 text-ink">
                {data.currentFocus}
              </p>
            </Card>
          </div>

          <Card
            as="section"
            aria-labelledby="resume-dau-tu"
            className="print:break-inside-avoid"
          >
            <h2 id="resume-dau-tu" className={SECTION_TITLE}>
              Đầu tư gần đây
            </h2>
            <ul className="mt-3 grid gap-3 md:grid-cols-3">
              {data.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="rounded-lg border border-line bg-sunken p-3 text-sm leading-6 text-ink"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
