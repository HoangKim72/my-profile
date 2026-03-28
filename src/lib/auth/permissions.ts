// src/lib/auth/permissions.ts
// Project-level permission checks

import { UserRole } from "@/types";
import { ProjectPermissionType } from "@/types";

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
