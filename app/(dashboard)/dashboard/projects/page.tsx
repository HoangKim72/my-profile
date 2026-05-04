// app/(dashboard)/dashboard/projects/page.tsx

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Download, Eye, FolderPlus, PencilLine } from "lucide-react";
import { requireAuth } from "@/lib/auth/check-auth";
import { getUserProjects } from "@/actions/projects";
import { formatFileSize } from "@/lib/projects/archive";

function getVisibilityClasses(visibility: string) {
  switch (visibility) {
    case "PUBLIC":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100";
    case "SHARED":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
    default:
      return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-100";
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-100";
    case "ARCHIVED":
      return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-100";
    default:
      return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-100";
  }
}

export default async function ProjectsPage() {
  const user = await requireAuth();
  const result = await getUserProjects();
  const projects = result.success ? result.projects ?? [] : [];

  const totalProjects = projects.length;
  const readyArchives = projects.filter((project) => project.files.length > 0).length;
  const publicProjects = projects.filter(
    (project) => project.visibility === "PUBLIC",
  ).length;
  const ownedProjects = projects.filter(
    (project) => project.authorId === user.id,
  ).length;

  const summaryCards = [
    {
      label: "Tổng folder",
      value: totalProjects,
      detail: "Danh sách hiện tại bạn có thể quản lý.",
    },
    {
      label: "Đã có archive",
      value: readyArchives,
      detail: "Sẵn sàng để tải xuống hoặc đối chiếu.",
    },
    {
      label: "Đang public",
      value: publicProjects,
      detail: "Đang hiển thị trên trang công khai.",
    },
    {
      label: "Bạn là owner",
      value: ownedProjects,
      detail: "Những folder do bạn tạo trực tiếp.",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <FolderPlus size={14} />
              Project manager
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Folder management
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Theo dõi owner, file archive, visibility và trạng thái của từng
              folder để biết mục nào đã sẵn sàng cho người dùng.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/projects/new" className="btn-primary">
              <FolderPlus size={16} />
              Tạo folder mới
            </Link>
            <Link href="/projects" className="btn-secondary">
              <Eye size={16} />
              Xem trang public
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
              {card.value}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {card.detail}
            </p>
          </article>
        ))}
      </section>

      {projects.length > 0 ? (
        <section className="space-y-5">
          {projects.map((project) => {
            const latestFile = project.files[0] ?? null;

            return (
              <article
                key={project.id}
                className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900/85 dark:hover:border-blue-900 md:p-7"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
                        {project.title}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getVisibilityClasses(project.visibility)}`}
                      >
                        {project.visibility}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                          Slug
                        </p>
                        <p className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-white">
                          /projects/{project.slug}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                          Quyền truy cập
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                          {project.authorId === user.id
                            ? "Owner access"
                            : user.role === "admin"
                              ? `Admin access • Owner: ${project.author.email}`
                              : "Shared editor access"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                          Archive
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                          {latestFile
                            ? `${latestFile.fileName} • ${formatFileSize(latestFile.sizeBytes)}`
                            : "Chưa có file ZIP"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {project.shortDescription}
                    </p>
                  </div>

                  <div className="xl:w-72">
                    <div className="rounded-[26px] border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
                        Hành động nhanh
                      </p>
                      <div className="mt-4 flex flex-col gap-3">
                        <Link
                          href={`/dashboard/projects/${project.id}/edit`}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                          <PencilLine size={16} />
                          Mở chỉnh sửa
                        </Link>
                        {latestFile && (
                          <Link
                            href={`/api/projects/${project.id}/download`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                          >
                            <Download size={16} />
                            Tải archive
                          </Link>
                        )}
                        <Link
                          href={`/projects/${project.slug}`}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100 dark:hover:bg-blue-950/70"
                        >
                          <Eye size={16} />
                          Xem trang public
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-[30px] border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900/85">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
            Chưa có thư mục chia sẻ nào được tạo.
          </p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Bắt đầu bằng cách tạo folder mới, tải archive lên và kiểm tra lại
            trang public.
          </p>
          <Link href="/dashboard/projects/new" className="btn-primary mt-6">
            Tạo folder đầu tiên
          </Link>
        </section>
      )}
    </div>
  );
}
