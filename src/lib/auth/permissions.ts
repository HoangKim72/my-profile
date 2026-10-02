// src/lib/auth/permissions.ts
// Project-level permission checks

import { UserRole } from "@/types";
import { ProjectPermissionType } from "@/types";

// Only admins may publish new resources to the public archive
export function canCreateProject(userRole: UserRole): boolean {
  return userRole === "admin";
}

export function canEditProject(
  userRole: UserRole,
  isAuthor: boolean = false,
  sharedPermissionType?: ProjectPermissionType | null,
): boolean {
  return isAuthor || userRole === "admin" || sharedPermissionType === "EDIT";
}

export function canDeleteProject(
  userRole: UserRole,
  isAuthor: boolean = false,
): boolean {
  return isAuthor || userRole === "admin";
}

export function canManageProjectPermissions(
  userRole: UserRole,
  isAuthor: boolean = false,
): boolean {
  return isAuthor || userRole === "admin";
}

export function canChangeProjectVisibility(
  userRole: UserRole,
  isAuthor: boolean = false,
): boolean {
  return isAuthor || userRole === "admin";
}
