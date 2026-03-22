// src/lib/auth/check-auth.ts
// Server-side auth checking utilities

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { AuthUser, UserRole } from "@/types";
import { redirect } from "next/navigation";

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) return null;

    // Get user role from database
    const userWithRole = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      include: {
        userRoles: { include: { role: true } },
        profile: true,
      },
    });

    if (!userWithRole) return null;

    const role: UserRole =
      userWithRole.userRoles.length > 0
        ? (userWithRole.userRoles[0].role.name as UserRole)
        : "viewer";

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
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
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/unauthorized");
  }
  return user;
}

export async function requireRole(requiredRole: UserRole): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (requiredRole === "guest") return user;
  if (requiredRole === "viewer" && user.role === "guest") {
    redirect("/unauthorized");
  }
  if (requiredRole === "admin" && user.role !== "admin") {
    redirect("/unauthorized");
  }
  return user;
}
