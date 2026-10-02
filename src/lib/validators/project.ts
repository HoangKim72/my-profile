// src/lib/validators/project.ts

import { z } from "zod";
import { serializeResourceTags } from "@/lib/projects/resource";

export const projectShareSchema = z.object({
  userId: z.string().min(1),
  permissionType: z.enum(["VIEW", "EDIT"]),
});

const optionalUrl = z.string().trim().url().optional().or(z.literal(""));

const projectSchema = z.object({
  title: z.string().trim().min(5, "Tiêu đề ít nhất 5 ký tự").max(200),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z
    .string()
    .trim()
    .min(10, "Mô tả ngắn ít nhất 10 ký tự")
    .max(500, "Mô tả ngắn tối đa 500 ký tự"),
  content: z.string().trim().max(20000).default(""),
  subjectName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên môn học")
    .max(120),
  semester: z.string().trim().min(1, "Vui lòng nhập kỳ học").max(60),
  // Comma separated tags; normalised so filters and Skills see clean values
  techStack: z.string().max(1000).default("").transform(serializeResourceTags),
  githubUrl: optionalUrl,
  demoUrl: optionalUrl,
  visibility: z.enum(["PUBLIC", "PRIVATE", "SHARED"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const createProjectSchema = projectSchema.extend({
  sharedUsers: z.array(projectShareSchema).default([]),
});

export const updateProjectSchema = projectSchema
  .partial()
  .extend({ sharedUsers: z.array(projectShareSchema).optional() });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectShareInput = z.infer<typeof projectShareSchema>;
