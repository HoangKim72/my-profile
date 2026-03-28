// src/actions/contact.ts
// Server actions for contact messages

"use server";

import { prisma } from "@/lib/db/prisma";
import { contactMessageSchema } from "@/lib/validators/contact";
import { getCurrentUser } from "@/lib/auth/check-auth";
import { revalidatePath } from "next/cache";

export async function submitContactMessage(data: unknown) {
  try {
    const validated = contactMessageSchema.parse(data);
    const user = await getCurrentUser();

    const message = await prisma.contactMessage.create({
      data: {
        ...validated,
        userId: user?.id,
      },
    });

    revalidatePath("/contact");

    return { success: true, message };
  } catch (error) {
    console.error("Error submitting contact message:", error);
    return { success: false, error: "Lỗi gửi tin nhắn" };
  }
}
