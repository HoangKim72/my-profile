// app/(dashboard)/dashboard/projects/page.tsx

export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/check-auth";
import { getUserProjects } from "@/actions/projects";
import Link from "next/link";
import { Download } from "lucide-react";
import { formatFileSize } from "@/lib/projects/archive";

export default async function ProjectsPage() {
  const user = await requireAuth();
  const result = await getUserProjects();
  const projects = result.success ? result.projects ?? [] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Shared Folders</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Quản lý các thư mục tài liệu mà người dùng sẽ nhìn thấy và tải xuống.
          </p>
        </div>
        <Link href="/dashboard/projects/new" className="btn-primary">
          + New Folder
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="card p-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold">{project.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Folder chia sẻ công khai • slug: /projects/{project.slug}
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {project.authorId === user.id
                    ? "Owner access"
                    : user.role === "admin"
                      ? `Admin access • Owner: ${project.author.email}`
                      : "Shared editor access"}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">
                  {project.shortDescription}
                </p>
                {project.files[0] ? (
                  <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
                    Archive ready: {project.files[0].fileName} •{" "}
                    {formatFileSize(project.files[0].sizeBytes)}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                    Chưa có file ZIP nào. Mở chỉnh sửa để tải folder lên.
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  {project.visibility}
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                  {project.status}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                  {project.authorId === user.id
                    ? "Owner"
                    : user.role === "admin"
                      ? "Admin"
                      : "Editor"}
                </span>
                {project.files[0] && (
                  <Link
                    href={`/api/projects/${project.id}/download`}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <Download size={16} />
                    Download
                  </Link>
                )}
                <Link
                  href={`/dashboard/projects/${project.id}/edit`}
                  className="btn-secondary text-sm"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Chưa có thư mục chia sẻ nào được tạo.
          </p>
          <Link href="/dashboard/projects/new" className="btn-primary">
            Tạo thư mục đầu tiên
          </Link>
        </div>
      )}
    </div>
  );
}
