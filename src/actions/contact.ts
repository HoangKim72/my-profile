// src/actions/contact.ts
// Server actions for contact messages

"use server";

import { ZodError } from "zod";
import { prisma } from "@/lib/db/prisma";
import { contactMessageSchema } from "@/lib/validators/contact";
import { getCurrentUser } from "@/lib/auth/check-auth";
import { consumeRateLimit, rateLimitPresets } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

const RATE_LIMIT_ERROR =
  "Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau ít phút.";

// Per-email limit backed by the database, so it holds across serverless
// instances where the in-memory IP limiter cannot.
const EMAIL_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_MAX_MESSAGES = 3;

export type ContactActionResult =
  | { success: true }
  | { success: false; error: string };

export async function submitContactMessage(
  data: unknown,
): Promise<ContactActionResult> {
  try {
    const { website, ...validated } = contactMessageSchema.parse(data);

    // Pretend success so bots get no signal that they were filtered out
    if (website.trim().length > 0) {
      return { success: true };
    }

    const ip = await getClientIp();
    const rateLimit = consumeRateLimit({
      key: `contact:${ip}`,
      ...rateLimitPresets.contactSubmit,
    });

    if (!rateLimit.allowed) {
      return { success: false, error: RATE_LIMIT_ERROR };
    }

    const recentMessageCount = await prisma.contactMessage.count({
      where: {
        email: validated.email,
        createdAt: { gte: new Date(Date.now() - EMAIL_WINDOW_MS) },
      },
    });

    if (recentMessageCount >= EMAIL_MAX_MESSAGES) {
      return { success: false, error: RATE_LIMIT_ERROR };
    }

    const user = await getCurrentUser();

    await prisma.contactMessage.create({
      data: {
        ...validated,
        userId: user?.id,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    console.error("Error submitting contact message:", error);
    return { success: false, error: "Lỗi gửi tin nhắn" };
  }
}
