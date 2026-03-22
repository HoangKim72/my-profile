// src/lib/auth/permissions.ts
// Role-based permission checking

import { UserRole } from "@/types";
import { Visibility } from "@/types";

export type Permission =
  | "view_projects"
  | "create_project"
  | "edit_project"
  | "delete_project"
  | "manage_users"
  | "access_dashboard";

// Define what each role can do
const rolePermissions: Record<UserRole, Permission[]> = {
  guest: ["view_projects"],

  viewer: ["view_projects"],

  admin: [
    "view_projects",
    "create_project",
    "edit_project",
    "delete_project",
    "manage_users",
    "access_dashboard",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

// Project visibility check
export function canViewProject(
  projectVisibility: Visibility,
  userRole: UserRole,
  isAuthor: boolean = false,
): boolean {
  if (projectVisibility === "PUBLIC") return true;
  if (projectVisibility === "PRIVATE") return isAuthor || userRole === "admin";
  if (projectVisibility === "SHARED") return isAuthor || userRole === "admin";
  return false;
}

export function canEditProject(
  userRole: UserRole,
  isAuthor: boolean = false,
): boolean {
  return isAuthor || userRole === "admin";
}

export function canDeleteProject(
  userRole: UserRole,
  isAuthor: boolean = false,
): boolean {
  return isAuthor || userRole === "admin";
}

// Role hierarchy
export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function isAuthenticated(role: UserRole): boolean {
  return role !== "guest";
}
