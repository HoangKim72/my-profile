// src/lib/validators/project.ts

import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(5, "Tiêu đề ít nhất 5 ký tự").max(200),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().min(10).max(500),
  content: z.string().min(50),
  subjectName: z.string().min(1),
  semester: z.string().min(1),
  techStack: z.string().min(1),
  githubUrl: z.string().url().optional().or(z.literal("")),
  demoUrl: z.string().url().optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE", "SHARED"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
