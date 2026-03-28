import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/check-auth";
import { downloadStoredProjectArchive } from "@/lib/storage/project-archives";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      visibility: true,
      authorId: true,
      files: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          fileName: true,
          filePath: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
      permissions: user
        ? {
            where: { userId: user.id },
            select: { permissionType: true },
            take: 1,
          }
        : false,
    },
  });

  if (!project || project.files.length === 0) {
    return NextResponse.json(
      { error: "Không tìm thấy thư mục tải xuống." },
      { status: 404 },
    );
  }

  const hasSharedAccess = Boolean(project.permissions?.[0]);
  const canReadPrivateProject =
    user && (project.authorId === user.id || user.role === "admin");

  if (project.visibility === "PRIVATE" && !canReadPrivateProject) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    project.visibility === "SHARED" &&
    !canReadPrivateProject &&
    !hasSharedAccess
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const archive = project.files[0];

  try {
    const archiveBlob = await downloadStoredProjectArchive(archive.filePath);
    const downloadFileName = archive.fileName || `${project.slug}.zip`;

    return new NextResponse(archiveBlob, {
      headers: {
        "Content-Type": archive.mimeType || "application/zip",
        "Content-Disposition": `attachment; filename="${downloadFileName.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(downloadFileName)}`,
        "Content-Length": String(archive.sizeBytes),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Error downloading project archive:", error);

    return NextResponse.json(
      { error: "Không thể tải thư mục lúc này." },
      { status: 500 },
    );
  }
}
