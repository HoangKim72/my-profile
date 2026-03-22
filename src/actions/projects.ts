// src/actions/projects.ts
// Server actions for project management

"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/check-auth";
import { canEditProject, canDeleteProject } from "@/lib/auth/permissions";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/validators/project";
import { ApiResponse } from "@/types";
import { slugify } from "@/lib/utils/helpers";
import { revalidatePath } from "next/cache";

// Get all public projects
export async function getPublicProjects(limit = 10, offset = 0) {
  try {
    const projects = await prisma.project.findMany({
      where: {
        visibility: "PUBLIC",
        status: "PUBLISHED",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        subjectName: true,
        semester: true,
        techStack: true,
        createdAt: true,
        author: { select: { id: true, email: true } },
        projectTags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.project.count({
      where: { visibility: "PUBLIC", status: "PUBLISHED" },
    });

    return { success: true, projects, total };
  } catch (error) {
    console.error("Error fetching public projects:", error);
    return { success: false, error: "Đã xảy ra lỗi" };
  }
}

// Get user's projects (admin only)
export async function getUserProjects() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const projects = await prisma.project.findMany({
      where: { authorId: user.id },
      include: {
        author: { select: { id: true, email: true } },
        projectTags: { include: { tag: true } },
        files: true,
        images: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, projects };
  } catch (error) {
    console.error("Error fetching user projects:", error);
    return { success: false, error: "Unauthorized" };
  }
}

// Get project by slug (with permission check)
export async function getProjectBySlug(slug: string) {
  try {
    const user = await getCurrentUser();

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, email: true } },
        files: true,
        images: true,
        projectTags: { include: { tag: true } },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Check visibility permission
    if (project.visibility === "PRIVATE") {
      if (!user || (project.authorId !== user.id && user.role !== "admin")) {
        return { success: false, error: "Unauthorized" };
      }
    }

    if (project.visibility === "SHARED") {
      if (!user) {
        return { success: false, error: "Unauthorized" };
      }
      const permission = await prisma.projectPermission.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: user.id } },
      });
      if (
        !permission &&
        project.authorId !== user.id &&
        user.role !== "admin"
      ) {
        return { success: false, error: "Unauthorized" };
      }
    }

    return { success: true, project };
  } catch (error) {
    console.error("Error fetching project:", error);
    return { success: false, error: "Error fetching project" };
  }
}

// Create project
export async function createProject(data: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const validated = createProjectSchema.parse(data);
    const slug = slugify(validated.slug || validated.title);

    const project = await prisma.project.create({
      data: {
        ...validated,
        slug,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, email: true } },
        projectTags: { include: { tag: true } },
      },
    });

    revalidatePath("/dashboard/projects");
    revalidatePath("/projects");

    return { success: true, project };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Lỗi tạo dự án" };
  }
}

// Update project
export async function updateProject(id: string, data: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const project = await prisma.project.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!project || !canEditProject(user.role, project.authorId === user.id)) {
      throw new Error("Unauthorized");
    }

    const validated = updateProjectSchema.parse(data);

    const updated = await prisma.project.update({
      where: { id },
      data: validated,
      include: {
        author: { select: { id: true, email: true } },
        projectTags: { include: { tag: true } },
      },
    });

    revalidatePath("/dashboard/projects");
    revalidatePath(`/projects/${updated.slug}`);

    return { success: true, project: updated };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error: "Lỗi cập nhật dự án" };
  }
}

// Delete project
export async function deleteProject(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const project = await prisma.project.findUnique({
      where: { id },
      select: { authorId: true, slug: true },
    });

    if (
      !project ||
      !canDeleteProject(user.role, project.authorId === user.id)
    ) {
      throw new Error("Unauthorized");
    }

    await prisma.project.delete({ where: { id } });

    revalidatePath("/dashboard/projects");
    revalidatePath("/projects");

    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Lỗi xóa dự án" };
  }
}

// Publish project (change status to PUBLISHED)
export async function publishProject(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const project = await prisma.project.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!project || !canEditProject(user.role, project.authorId === user.id)) {
      throw new Error("Unauthorized");
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        status: "PUBLISHED",
      },
    });

    revalidatePath("/dashboard/projects");
    revalidatePath("/projects");

    return { success: true, project: updated };
  } catch (error) {
    console.error("Error publishing project:", error);
    return { success: false, error: "Lỗi công bố dự án" };
  }
}
