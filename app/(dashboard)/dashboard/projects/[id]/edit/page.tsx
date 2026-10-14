// app/(dashboard)/dashboard/projects/[id]/edit/page.tsx

export const dynamic = "force-dynamic";

import { ProjectForm } from "@/components/projects/ProjectForm";
import { requireAuth } from "@/lib/auth/check-auth";
import { PageHeader } from "@/components/ui";
import {
  canEditProject,
} from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      files: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      permissions: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  fullName: true,
                  headline: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const isOwner = project.authorId === user.id;
  const sharedPermissionType =
    project.permissions.find((permission) => permission.userId === user.id)
      ?.permissionType ?? null;

  if (!canEditProject(user.role, isOwner, sharedPermissionType)) {
    notFound();
  }

  const existingArchive = project.files[0]
    ? {
        fileName: project.files[0].fileName,
        sizeBytes: project.files[0].sizeBytes,
        createdAt: project.files[0].createdAt.toISOString(),
      }
    : null;

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        title="Chỉnh sửa tài liệu"
        description="Cập nhật thông tin tài liệu hoặc thay thế file ZIP mà người dùng đang tải xuống."
      />

      <ProjectForm project={project} existingArchive={existingArchive} />
    </div>
  );
}
