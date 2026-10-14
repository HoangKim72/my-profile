import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublicProjects } from "@/actions/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { EmptyState, ErrorState } from "@/components/ui";

const HOME_RESOURCE_LIMIT = 6;

export async function ResourcesSection() {
  const result = await getPublicProjects({ limit: HOME_RESOURCE_LIMIT });

  return (
    <section aria-labelledby="kho-tai-lieu-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h2
            id="kho-tai-lieu-title"
            className="text-2xl font-semibold text-ink"
          >
            Kho tài liệu
          </h2>
        </div>
        <Link
          href="/projects"
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
        >
          Xem tất cả
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {!result.success ? (
        <ErrorState
          titleAs="h3"
          description="Kho tài liệu tạm thời chưa tải được. Bạn thử tải lại trang sau ít phút."
        />
      ) : result.projects.length === 0 ? (
        <EmptyState
          titleAs="h3"
          title="Chưa có tài liệu nào"
          description="Tài liệu mới sẽ xuất hiện ở đây khi được đăng."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}
