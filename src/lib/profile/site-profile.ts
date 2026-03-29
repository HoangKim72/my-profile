import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function getSiteProfile() {
  try {
    const adminProfile = await prisma.profile.findFirst({
      where: {
        user: {
          userRoles: {
            some: {
              role: {
                name: "admin",
              },
            },
          },
        },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (adminProfile) {
      return adminProfile;
    }

    return prisma.profile.findFirst({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  } catch (error) {
    console.error("Unable to load site profile:", error);
    return null;
  }
}
