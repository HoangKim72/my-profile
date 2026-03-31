import "server-only";

import { prisma } from "@/lib/db/prisma";

const VIEWER_ROLE = {
  name: "viewer",
  description: "Can view shared projects",
} as const;

const ADMIN_ROLE = {
  name: "admin",
  description: "Administrator with full access",
} as const;

function getConfiguredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isConfiguredAdminEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  return getConfiguredAdminEmails().has(normalizedEmail);
}

export async function syncAuthUserRecord(input: {
  userId: string;
  email: string;
}) {
  const shouldAssignAdmin = isConfiguredAdminEmail(input.email);

  return prisma.$transaction(async (tx) => {
    const viewerRole = await tx.role.upsert({
      where: { name: VIEWER_ROLE.name },
      update: {},
      create: VIEWER_ROLE,
    });

    const adminRole = shouldAssignAdmin
      ? await tx.role.upsert({
          where: { name: ADMIN_ROLE.name },
          update: {},
          create: ADMIN_ROLE,
        })
      : null;

    await tx.user.upsert({
      where: { id: input.userId },
      update: {
        email: input.email,
      },
      create: {
        id: input.userId,
        email: input.email,
      },
    });

    await tx.profile.upsert({
      where: { userId: input.userId },
      update: {},
      create: {
        userId: input.userId,
        email: input.email,
      },
    });

    const roleIds = [viewerRole.id];

    if (adminRole) {
      roleIds.push(adminRole.id);
    }

    await tx.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId: input.userId,
        roleId,
      })),
      skipDuplicates: true,
    });

    return tx.user.findUnique({
      where: { id: input.userId },
      include: {
        userRoles: { include: { role: true } },
        profile: true,
      },
    });
  });
}
