import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/check-auth";
import { canEditProject } from "@/lib/auth/permissions";
import {
  sanitizeArchiveFileName,
  validateProjectArchiveCandidate,
} from "@/lib/projects/archive";
import {
  removeStoredProjectArchive,
  uploadProjectArchive,
} from "@/lib/storage/project-archives";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      authorId: true,
      permissions: {
        where: { userId: user.id },
        select: { permissionType: true },
        take: 1,
      },
      files: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          filePath: true,
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = project.authorId === user.id;
  const sharedPermissionType = project.permissions[0]?.permissionType ?? null;

  if (!canEditProject(user.role, isOwner, sharedPermissionType)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const archive = formData.get("archive");
  const folderNameField = formData.get("folderName");

  if (!(archive instanceof File)) {
    return NextResponse.json(
      { error: "Không tìm thấy file ZIP để tải lên." },
      { status: 400 },
    );
  }

  try {
    validateProjectArchiveCandidate(archive);

    const folderName =
      typeof folderNameField === "string" && folderNameField.trim().length > 0
        ? folderNameField.trim()
        : archive.name.replace(/\.zip$/i, "");

    const uploadedArchive = await uploadProjectArchive({
      projectId: project.id,
      fileName: sanitizeArchiveFileName(folderName),
      file: archive,
      mimeType: archive.type || "application/zip",
    });

    try {
      const projectFile = await prisma.$transaction(async (tx) => {
        await tx.projectFile.deleteMany({
          where: { projectId: project.id },
        });

        return tx.projectFile.create({
          data: {
            projectId: project.id,
            fileName: uploadedArchive.fileName,
            filePath: uploadedArchive.filePath,
            fileType: "zip",
            mimeType: archive.type || "application/zip",
            sizeBytes: archive.size,
            uploadedBy: user.id,
          },
        });
      });

      for (const file of project.files) {
        await removeStoredProjectArchive(file.filePath).catch((error) => {
          console.error("Error removing previous archive:", error);
        });
      }

      revalidatePath("/projects");
      revalidatePath(`/projects/${project.slug}`);
      revalidatePath("/dashboard/projects");
      revalidatePath(`/dashboard/projects/${project.id}/edit`);

      return NextResponse.json({
        success: true,
        file: projectFile,
      });
    } catch (error) {
      await removeStoredProjectArchive(uploadedArchive.filePath).catch(
        (cleanupError) => {
          console.error("Error rolling back uploaded archive:", cleanupError);
        },
      );

      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Không thể tải thư mục lên lúc này.",
      },
      { status: 400 },
    );
  }
}
