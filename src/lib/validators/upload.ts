// src/lib/validators/upload.ts

import { z } from "zod";

const MAX_FILE_SIZE = parseInt(
  process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "10485760",
);
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `Kích thước tệp tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    )
    .refine(
      (file) => ALLOWED_IMAGE_TYPES.includes(file.type),
      "Chỉ hỗ trợ hình ảnh JPEG, PNG, WebP, GIF",
    ),
});

export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `Kích thước tệp tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    )
    .refine(
      (file) => ALLOWED_FILE_TYPES.includes(file.type),
      "Định dạng tệp không được hỗ trợ",
    ),
});

export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
