// src/components/layout/Footer.tsx

import Link from "next/link";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { NAV_LINKS, SITE_NAME } from "@/lib/utils/constants";
import { getSiteProfile } from "@/lib/profile/site-profile";
import {
  buildResumeViewModel,
  type ResumeViewModel,
} from "@/lib/profile/resume-view";

const linkClass =
  "inline-flex cursor-pointer items-center gap-2 py-1 text-sm text-muted transition-colors hover:text-ink";

async function loadContact(): Promise<ResumeViewModel | null> {
  try {
    const profile = await getSiteProfile();
    return profile ? buildResumeViewModel(profile) : null;
  } catch (error) {
    console.error("Footer: unable to load site profile", error);
    return null;
  }
}

export async function Footer() {
  const currentYear = new Date().getFullYear();
  const contact = await loadContact();

  const externalLinks = [
    { label: "GitHub", href: contact?.githubUrl },
    { label: "LinkedIn", href: contact?.linkedinUrl },
    { label: "Facebook", href: contact?.facebookUrl },
    { label: "Website", href: contact?.websiteUrl },
  ].filter((item): item is { label: string; href: string } =>
    Boolean(item.href),
  );

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-custom py-10">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr]">
          <div className="max-w-sm">
            <p className="text-base font-semibold text-ink">{SITE_NAME}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Bảng công cụ, kho tài liệu môn học và hồ sơ cá nhân của Anh
              coder.
            </p>
          </div>

          <nav aria-labelledby="footer-nav-heading">
            <h2
              id="footer-nav-heading"
              className="text-sm font-semibold text-ink"
            >
              Điều hướng
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 md:grid-cols-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-ink">Liên hệ</h2>
            <ul className="mt-3">
              {contact?.publicEmail ? (
                <li>
                  <a
                    href={`mailto:${contact.publicEmail}`}
                    className={`${linkClass} break-all`}
                  >
                    <Mail size={16} aria-hidden="true" className="shrink-0" />
                    {contact.publicEmail}
                  </a>
                </li>
              ) : null}
              {contact?.phone ? (
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                    className={linkClass}
                  >
                    <Phone size={16} aria-hidden="true" className="shrink-0" />
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {externalLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    <ExternalLink
                      size={16}
                      aria-hidden="true"
                      className="shrink-0"
                    />
                    {item.label}
                    <span className="sr-only"> (mở tab mới)</span>
                  </a>
                </li>
              ))}
              <li>
                <Link href="/contact" className={linkClass}>
                  Gửi lời nhắn
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-6 text-sm text-muted">
          <p>
            &copy; {currentYear} {SITE_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
