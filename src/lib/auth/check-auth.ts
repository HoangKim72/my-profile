// src/lib/auth/check-auth.ts
// Server-side auth checking utilities

import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  isConfiguredAdminEmail,
  syncAuthUserRecord,
} from "@/lib/auth/user-record";
import { AuthUser, UserRole } from "@/types";

const ROLE_PRIORITY: UserRole[] = ["guest", "viewer", "admin"];

function resolveUserRole(roleNames: string[]): UserRole {
  const rankedRole = [...ROLE_PRIORITY]
    .reverse()
    .find((role) => roleNames.includes(role));

  return rankedRole ?? "viewer";
}

async function loadUserWithRole(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: { include: { role: true } },
      profile: true,
    },
  });
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const supabase = await createClient();

    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) return null;

    const email = supabaseUser.email ?? `${supabaseUser.id}@users.local`;
    let userWithRole = await loadUserWithRole(supabaseUser.id);

    const roleNames = userWithRole?.userRoles.map((item) => item.role.name) ?? [];
    const shouldSyncUserRecord =
      !userWithRole ||
      userWithRole.email !== email ||
      !userWithRole.profile ||
      roleNames.length === 0 ||
      (isConfiguredAdminEmail(email) && !roleNames.includes("admin"));

    if (shouldSyncUserRecord) {
      userWithRole = await syncAuthUserRecord({
        userId: supabaseUser.id,
        email,
      });
    }

    if (!userWithRole) return null;

    if (userWithRole.userRoles.length === 0) {
      return {
        id: supabaseUser.id,
        email,
        role: "viewer",
        profile: userWithRole.profile || undefined,
      };
    }

    const role = resolveUserRole(userWithRole.userRoles.map((item) => item.role.name));

    return {
      id: supabaseUser.id,
      email,
      role,
      profile: userWithRole.profile || undefined,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
});

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    redirect("/about");
  }

  return user;
}
