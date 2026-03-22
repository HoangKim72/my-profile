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

// Get all contact messages (admin only)
export async function getContactMessages() {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") throw new Error("Unauthorized");

    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { profile: true } } },
    });

    return { success: true, messages };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error: "Lỗi tải tin nhắn" };
  }
}

// Mark message as read (admin only)
export async function markMessageAsRead(id: string) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") throw new Error("Unauthorized");

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });

    revalidatePath("/dashboard/messages");

    return { success: true, message };
  } catch (error) {
    console.error("Error marking message as read:", error);
    return { success: false, error: "Lỗi cập nhật" };
  }
}

// Delete message (admin only)
export async function deleteContactMessage(id: string) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") throw new Error("Unauthorized");

    await prisma.contactMessage.delete({ where: { id } });

    revalidatePath("/dashboard/messages");

    return { success: true };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { success: false, error: "Lỗi xóa tin nhắn" };
  }
}
