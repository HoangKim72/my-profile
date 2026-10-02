"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/check-auth";
import {
  MIC_FILTER_SETTINGS_KEY,
  micFilterConfigSchema,
} from "@/tools/mic-filter/config";

export type ToolSettingsActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
}

function revalidateMicFilter() {
  revalidatePath("/tools/mic-filter");
  revalidatePath("/dashboard/tools/mic-filter");
}

export async function saveMicFilterConfig(
  data: unknown,
): Promise<ToolSettingsActionResult> {
  const user = await requireAdminUser();

  if (!user) {
    return { success: false, error: "Chỉ admin được sửa cấu hình tool." };
  }

  const parsed = micFilterConfigSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Cấu hình không hợp lệ.",
    };
  }

  try {
    const value = parsed.data as unknown as Prisma.InputJsonValue;

    await prisma.toolSetting.upsert({
      where: { key: MIC_FILTER_SETTINGS_KEY },
      update: { value, updatedBy: user.id },
      create: { key: MIC_FILTER_SETTINGS_KEY, value, updatedBy: user.id },
    });

    revalidateMicFilter();

    return { success: true };
  } catch (error) {
    console.error("Error saving mic filter config:", error);
    return { success: false, error: "Không lưu được cấu hình lúc này." };
  }
}

// Removes the stored row so the tool falls back to the defaults in code
export async function resetMicFilterConfig(): Promise<ToolSettingsActionResult> {
  const user = await requireAdminUser();

  if (!user) {
    return { success: false, error: "Chỉ admin được sửa cấu hình tool." };
  }

  try {
    await prisma.toolSetting.deleteMany({
      where: { key: MIC_FILTER_SETTINGS_KEY },
    });

    revalidateMicFilter();

    return { success: true };
  } catch (error) {
    console.error("Error resetting mic filter config:", error);
    return { success: false, error: "Không khôi phục được cấu hình lúc này." };
  }
}
