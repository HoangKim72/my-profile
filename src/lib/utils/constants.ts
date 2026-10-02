// src/lib/utils/constants.ts

export const SITE_NAME = "Anh coder";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/skills", label: "Skills" },
  { href: "/contact", label: "Contact" },
];

export const ADMIN_NAV_LINKS: Array<{
  href: string;
  label: string;
  adminOnly?: boolean;
}> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/tools/mic-filter", label: "Tool lọc mic", adminOnly: true },
  { href: "/dashboard/settings", label: "Settings", adminOnly: true },
];
