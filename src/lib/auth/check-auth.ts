// src/lib/auth/check-auth.ts
// Server-side auth checking utilities

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { AuthUser, UserRole } from "@/types";
import { redirect } from "next/navigation";

const VIEWER_ROLE_NAME = "viewer";
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

async function ensureUserRecord(userId: string, email: string) {
  const viewerRole = await prisma.role.upsert({
    where: { name: VIEWER_ROLE_NAME },
    update: {},
    create: {
      name: VIEWER_ROLE_NAME,
      description: "Can view shared projects",
    },
  });

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: { email },
    create: {
      id: userId,
      email,
      profile: {
        create: { email },
      },
      userRoles: {
        create: { roleId: viewerRole.id },
      },
    },
    include: {
      userRoles: { include: { role: true } },
      profile: true,
    },
  });

  if (user.userRoles.length > 0) {
    return user;
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: viewerRole.id,
      },
    },
    update: {},
    create: {
      userId,
      roleId: viewerRole.id,
    },
  });

  return loadUserWithRole(userId);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) return null;

    const email = supabaseUser.email ?? `${supabaseUser.id}@users.local`;
    const userWithRole =
      (await loadUserWithRole(supabaseUser.id)) ??
      (await ensureUserRecord(supabaseUser.id, email));

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
}

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
