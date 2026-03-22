// app/(dashboard)/dashboard/projects/page.tsx

export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/check-auth";
import { getUserProjects } from "@/actions/projects";
import Link from "next/link";

export default async function ProjectsPage() {
  const user = await requireAuth();
  const { projects } = await getUserProjects();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">My Projects</h1>
        <Link href="/dashboard/projects/new" className="btn-primary">
          + New Project
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {projects?.map((project: any) => (
            <div
              key={project.id}
              className="card p-6 flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="text-xl font-bold">{project.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {project.subjectName} • {project.semester}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">
                  {project.shortDescription}
                </p>
              </div>
              <div className="ml-6 flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === "PUBLISHED"
                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                      : project.status === "DRAFT"
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                        : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
                  }`}
                >
                  {project.status}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.visibility === "PUBLIC"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                      : project.visibility === "PRIVATE"
                        ? "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100"
                        : "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100"
                  }`}
                >
                  {project.visibility}
                </span>
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
            You haven't created any projects yet.
          </p>
          <Link href="/dashboard/projects/new" className="btn-primary">
            Create your first project
          </Link>
        </div>
      )}
    </div>
  );
}
