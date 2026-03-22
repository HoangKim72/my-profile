// src/lib/validators/contact.ts

import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().min(2, "Tên ít nhất 2 ký tự").max(100),
  email: z.string().email("Email không hợp lệ"),
  subject: z.string().min(5, "Tiêu đề ít nhất 5 ký tự").max(200),
  message: z.string().min(10, "Tin nhắn ít nhất 10 ký tự").max(5000),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
