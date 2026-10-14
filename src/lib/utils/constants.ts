// src/lib/utils/constants.ts

export const SITE_NAME = "Anh coder";

export interface NavLink {
  href: string;
  label: string;
  /** Hash links (e.g. "/#cong-cu") are never marked active by pathname. */
  matchPathname?: boolean;
}

export const NAV_LINKS: ReadonlyArray<NavLink> = [
  { href: "/", label: "Trang chủ" },
  { href: "/#cong-cu", label: "Công cụ", matchPathname: false },
  { href: "/projects", label: "Kho tài liệu" },
  { href: "/skills", label: "Kỹ năng" },
  { href: "/about", label: "Giới thiệu" },
  { href: "/cv", label: "CV" },
  { href: "/contact", label: "Liên hệ" },
];

export const ADMIN_NAV_LINKS: Array<{
  href: string;
  label: string;
  adminOnly?: boolean;
}> = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/dashboard/projects", label: "Kho tài liệu" },
  { href: "/dashboard/tools/mic-filter", label: "Tool lọc mic", adminOnly: true },
  { href: "/dashboard/settings", label: "Cài đặt", adminOnly: true },
];
