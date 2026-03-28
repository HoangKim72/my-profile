// src/actions/projects.ts
// Server actions for project management

"use server";

import { PermissionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/check-auth";
import {
  canChangeProjectVisibility,
  canDeleteProject,
  canEditProject,
  canManageProjectPermissions,
} from "@/lib/auth/permissions";
import {
  createProjectSchema,
  ProjectShareInput,
  updateProjectSchema,
} from "@/lib/validators/project";
import { slugifyProjectTitle } from "@/lib/projects/archive";
import { removeStoredProjectArchive } from "@/lib/storage/project-archives";
import { ProjectPermissionType } from "@/types";
import { revalidatePath } from "next/cache";

function normalizeSharedUsers(
  sharedUsers: ProjectShareInput[] | undefined,
  ownerId: string,
): Array<{ userId: string; permissionType: ProjectPermissionType }> {
  const uniqueUsers = new Map<string, ProjectPermissionType>();

  for (const item of sharedUsers ?? []) {
    if (!item.userId || item.userId === ownerId) {
      continue;
    }

    uniqueUsers.set(item.userId, item.permissionType);
  }

  return Array.from(uniqueUsers.entries()).map(([userId, permissionType]) => ({
    userId,
    permissionType,
  }));
}

async function ensureUniqueProjectSlug(
  tx: Prisma.TransactionClient,
  rawSlug: string,
) {
  const baseSlug = slugifyProjectTitle(rawSlug);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existingProject = await tx.project.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existingProject) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function getProjectAccess(projectId: string, userId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      slug: true,
      authorId: true,
      visibility: true,
      permissions: {
        where: { userId },
        select: { permissionType: true },
        take: 1,
      },
    },
  });
}

// Get all public projects
export async function getPublicProjects(limit = 10, offset = 0) {
  try {
    const projects = await prisma.project.findMany({
      where: {
        visibility: "PUBLIC",
        status: "PUBLISHED",
        files: {
          some: {},
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        subjectName: true,
        semester: true,
        techStack: true,
        visibility: true,
        thumbnailUrl: true,
        createdAt: true,
        files: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            fileName: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
        author: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.project.count({
      where: {
        visibility: "PUBLIC",
        status: "PUBLISHED",
        files: {
          some: {},
        },
      },
    });

    return { success: true, projects, total };
  } catch (error) {
    console.error("Error fetching public projects:", error);
    return { success: false, error: "Đã xảy ra lỗi" };
  }
}

// Get projects the current user can work with
export async function getUserProjects() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const where: Prisma.ProjectWhereInput =
      user.role === "admin"
        ? {}
        : {
            OR: [
              { authorId: user.id },
              {
                permissions: {
                  some: {
                    userId: user.id,
                    permissionType: PermissionType.EDIT,
                  },
                },
              },
            ],
          };

    const projects = await prisma.project.findMany({
      where,
      include: {
        author: { select: { id: true, email: true } },
        files: {
          orderBy: { createdAt: "desc" },
        },
        permissions: {
          where: { userId: user.id },
          select: { permissionType: true },
          take: 1,
        },
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
        files: {
          orderBy: { createdAt: "desc" },
        },
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
    const sharedUsers = normalizeSharedUsers(validated.sharedUsers, user.id);

    const project = await prisma.$transaction(async (tx) => {
      const slug = await ensureUniqueProjectSlug(
        tx,
        validated.slug || validated.title,
      );
      const createdProject = await tx.project.create({
        data: {
          title: validated.title,
          slug,
          shortDescription: validated.shortDescription,
          content: validated.content,
          subjectName: validated.subjectName,
          semester: validated.semester,
          techStack: validated.techStack,
          githubUrl: validated.githubUrl,
          demoUrl: validated.demoUrl,
          visibility: validated.visibility,
          status: validated.status,
          authorId: user.id,
        },
        include: {
          author: { select: { id: true, email: true } },
          permissions: {
            include: {
              user: {
                include: { profile: true },
              },
            },
          },
        },
      });

      if (validated.visibility === "SHARED" && sharedUsers.length > 0) {
        await tx.projectPermission.createMany({
          data: sharedUsers.map((item) => ({
            projectId: createdProject.id,
            userId: item.userId,
            permissionType: item.permissionType,
          })),
        });
      }

      return createdProject;
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

    const project = await getProjectAccess(id, user.id);

    if (!project) {
      throw new Error("Unauthorized");
    }

    const isOwner = project.authorId === user.id;
    const sharedPermissionType = project.permissions[0]?.permissionType ?? null;

    if (!canEditProject(user.role, isOwner, sharedPermissionType)) {
      throw new Error("Unauthorized");
    }

    const validated = updateProjectSchema.parse(data);
    const canManageSharing = canManageProjectPermissions(user.role, isOwner);
    const canChangeVisibility = canChangeProjectVisibility(user.role, isOwner);
    const sharedUsers = normalizeSharedUsers(validated.sharedUsers, project.authorId);

    const updated = await prisma.$transaction(async (tx) => {
      const updateData = {
        title: validated.title,
        slug: validated.slug,
        shortDescription: validated.shortDescription,
        content: validated.content,
        subjectName: validated.subjectName,
        semester: validated.semester,
        techStack: validated.techStack,
        githubUrl: validated.githubUrl,
        demoUrl: validated.demoUrl,
        status: validated.status,
        visibility: canChangeVisibility ? validated.visibility : undefined,
      };

      const nextProject = await tx.project.update({
        where: { id },
        data: updateData,
        include: {
          author: { select: { id: true, email: true } },
          permissions: {
            include: {
              user: {
                include: { profile: true },
              },
            },
          },
        },
      });

      if (canManageSharing) {
        await tx.projectPermission.deleteMany({
          where: { projectId: id },
        });

        if (nextProject.visibility === "SHARED" && sharedUsers.length > 0) {
          await tx.projectPermission.createMany({
            data: sharedUsers.map((item) => ({
              projectId: id,
              userId: item.userId,
              permissionType: item.permissionType,
            })),
          });
        }
      }

      return nextProject;
    });

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${id}/edit`);
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
      select: {
        authorId: true,
        slug: true,
        files: {
          select: {
            filePath: true,
          },
        },
      },
    });

    if (
      !project ||
      !canDeleteProject(user.role, project.authorId === user.id)
    ) {
      throw new Error("Unauthorized");
    }

    for (const file of project.files) {
      await removeStoredProjectArchive(file.filePath).catch((error) => {
        console.error("Error removing project archive:", error);
      });
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

    const project = await getProjectAccess(id, user.id);

    if (!project) {
      throw new Error("Unauthorized");
    }

    const isOwner = project.authorId === user.id;
    const sharedPermissionType = project.permissions[0]?.permissionType ?? null;

    if (!canEditProject(user.role, isOwner, sharedPermissionType)) {
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
