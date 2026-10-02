// src/lib/validators/contact.ts

import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Tên ít nhất 2 ký tự").max(100),
  email: z
    .string()
    .trim()
    .email("Email không hợp lệ")
    .max(255)
    .transform((value) => value.toLowerCase()),
  subject: z.string().trim().min(5, "Tiêu đề ít nhất 5 ký tự").max(200),
  message: z.string().trim().min(10, "Tin nhắn ít nhất 10 ký tự").max(5000),
  // Honeypot: hidden from humans, bots tend to fill it in
  website: z.string().optional().default(""),
});

export type ContactMessageInput = z.input<typeof contactMessageSchema>;
