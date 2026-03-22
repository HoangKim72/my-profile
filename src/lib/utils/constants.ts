// src/lib/utils/constants.ts

export const SITE_NAME = "My Portfolio";
export const SITE_DESCRIPTION = "Showcase your projects and skills";
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/skills", label: "Skills" },
  { href: "/contact", label: "Contact" },
];

export const ADMIN_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/settings", label: "Settings" },
];

export const PROJECT_STATUS = {
  DRAFT: { label: "Draft", color: "gray" },
  PUBLISHED: { label: "Published", color: "green" },
  ARCHIVED: { label: "Archived", color: "red" },
};

export const VISIBILITY = {
  PUBLIC: { label: "Public", icon: "🌐" },
  PRIVATE: { label: "Private", icon: "🔒" },
  SHARED: { label: "Shared", icon: "👥" },
};

export const ROLES = {
  guest: { label: "Guest", level: 0 },
  viewer: { label: "Viewer", level: 1 },
  admin: { label: "Admin", level: 2 },
};

export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  FILE: 10 * 1024 * 1024, // 10MB
};

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
export const ALLOWED_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "zip",
];
