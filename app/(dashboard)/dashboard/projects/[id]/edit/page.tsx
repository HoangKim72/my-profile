// app/(dashboard)/dashboard/projects/[id]/edit/page.tsx

export const dynamic = "force-dynamic";

import { ProjectForm } from "@/components/projects/ProjectForm";
import { requireAuth } from "@/lib/auth/check-auth";
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
  });

  if (!project) {
    notFound();
  }

  // Check if user can edit
  if (project.authorId !== user.id && user.role !== "admin") {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Edit Project</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Update your project details
        </p>
      </div>

      <ProjectForm project={project} />
    </div>
  );
}
