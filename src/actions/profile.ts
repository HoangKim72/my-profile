"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/check-auth";
import { updateProfileSchema } from "@/lib/validators/profile";

export async function updateProfile(data: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (user.role !== "admin") {
      return { success: false, error: "Forbidden" };
    }

    const validated = updateProfileSchema.parse(data);

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: validated,
      create: {
        userId: user.id,
        ...validated,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/about");
    revalidatePath("/cv");
    revalidatePath("/");

    return { success: true, profile };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message || "Invalid profile data" };
    }

    console.error("Error updating profile:", error);
    return { success: false, error: "Unable to update profile" };
  }
}
