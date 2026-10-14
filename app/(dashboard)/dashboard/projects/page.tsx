// app/(dashboard)/dashboard/projects/page.tsx

export const dynamic = "force-dynamic";

import { Download, Eye, FolderPlus, PencilLine } from "lucide-react";
import { requireAuth } from "@/lib/auth/check-auth";
import { getUserProjects } from "@/actions/projects";
import { formatFileSize } from "@/lib/projects/archive";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  type BadgeTone,
} from "@/components/ui";

const STATUS_BADGES: Record<string, { label: string; tone: BadgeTone }> = {
  PUBLISHED: { label: "Công khai", tone: "success" },
  DRAFT: { label: "Nháp", tone: "neutral" },
  ARCHIVED: { label: "Lưu trữ", tone: "warn" },
};

const VISIBILITY_BADGES: Record<string, { label: string; tone: BadgeTone }> = {
  PUBLIC: { label: "Ai cũng xem được", tone: "accent" },
  SHARED: { label: "Chia sẻ", tone: "warn" },
  PRIVATE: { label: "Riêng tư", tone: "neutral" },
};

function getStatusBadge(status: string) {
  return STATUS_BADGES[status] ?? { label: status, tone: "neutral" as const };
}

function getVisibilityBadge(visibility: string) {
  return (
    VISIBILITY_BADGES[visibility] ?? {
      label: visibility,
      tone: "neutral" as const,
    }
  );
}

export default async function ProjectsPage() {
  const user = await requireAuth();
  const result = await getUserProjects();
  const projects = result.success ? result.projects ?? [] : [];

  const isAdmin = user.role === "admin";
  const totalProjects = projects.length;
  const readyArchives = projects.filter((project) => project.files.length > 0).length;
  const publicProjects = projects.filter(
    (project) => project.visibility === "PUBLIC",
  ).length;
  const totalDownloads = projects.reduce(
    (total, project) => total + project.downloadCount,
    0,
  );

  const summaryCards = [
    {
      label: "Tổng số tài liệu",
      value: totalProjects.toLocaleString("vi-VN"),
      detail: "Tài liệu bạn đang có thể quản lý.",
    },
    {
      label: "Đã có file ZIP",
      value: readyArchives.toLocaleString("vi-VN"),
      detail: "Sẵn sàng để tải xuống hoặc đối chiếu.",
    },
    {
      label: "Ai cũng xem được",
      value: publicProjects.toLocaleString("vi-VN"),
      detail: "Đang hiển thị trên trang công khai.",
    },
    {
      label: "Tổng lượt tải",
      value: totalDownloads.toLocaleString("vi-VN"),
      detail: "Không tính lượt tải của tác giả và admin.",
    },
  ];

  const rows = projects.map((project) => {
    const latestFile = project.files[0] ?? null;

    return {
      project,
      latestFile,
      status: getStatusBadge(project.status),
      visibility: getVisibilityBadge(project.visibility),
      access:
        project.authorId === user.id
          ? "Bạn là chủ sở hữu"
          : user.role === "admin"
            ? `Quyền admin · Chủ sở hữu: ${project.author.email}`
            : "Được chia sẻ quyền chỉnh sửa",
      archive: latestFile
        ? `${latestFile.fileName} · ${formatFileSize(latestFile.sizeBytes)}`
        : "Chưa có file ZIP",
      downloads: `${project.downloadCount.toLocaleString("vi-VN")} lượt tải`,
    };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kho tài liệu"
        description="Theo dõi chủ sở hữu, file ZIP, quyền hiển thị và trạng thái của từng tài liệu để biết mục nào đã sẵn sàng cho người dùng."
        actions={
          <>
            {isAdmin && (
              <ButtonLink
                href="/dashboard/projects/new"
                leftIcon={<FolderPlus size={16} aria-hidden="true" />}
              >
                Thêm tài liệu
              </ButtonLink>
            )}
            <ButtonLink
              href="/projects"
              variant="secondary"
              leftIcon={<Eye size={16} aria-hidden="true" />}
            >
              Xem trang công khai
            </ButtonLink>
          </>
        }
      />

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="sr-only">
          Số liệu kho tài liệu
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card as="li" key={card.label} padding="sm">
              <p className="text-sm font-medium text-muted">{card.label}</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-ink">
                {card.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">{card.detail}</p>
            </Card>
          ))}
        </ul>
      </section>

      {projects.length > 0 ? (
        <section aria-labelledby="list-heading" className="space-y-4">
          <h2 id="list-heading" className="text-lg font-semibold text-ink">
            Danh sách tài liệu
          </h2>

          {/* Desktop: table */}
          <Card padding="none" className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-sunken text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Tài liệu
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    File ZIP
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Quyền truy cập
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.project.id} className="align-top">
                    <td className="max-w-sm px-4 py-4">
                      <p className="break-words font-semibold text-ink">
                        {row.project.title}
                      </p>
                      <p className="mt-1 text-muted">
                        {row.project.subjectName} · {row.project.semester}
                      </p>
                      <p className="mt-1 line-clamp-2 text-muted">
                        {row.project.shortDescription}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <Badge tone={row.status.tone}>{row.status.label}</Badge>
                        <Badge tone={row.visibility.tone}>
                          {row.visibility.label}
                        </Badge>
                      </div>
                    </td>
                    <td className="max-w-56 px-4 py-4">
                      <p className="break-words text-ink">{row.archive}</p>
                      <p className="mt-1 tabular-nums text-muted">
                        {row.downloads}
                      </p>
                    </td>
                    <td className="max-w-56 px-4 py-4">
                      <p className="break-words text-muted">{row.access}</p>
                    </td>
                    <td className="px-4 py-4">
                      <RowActions
                        projectId={row.project.id}
                        slug={row.project.slug}
                        title={row.project.title}
                        hasArchive={Boolean(row.latestFile)}
                        className="justify-end"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile/tablet: stacked cards */}
          <ul className="space-y-4 lg:hidden">
            {rows.map((row) => (
              <Card as="li" key={row.project.id} padding="sm">
                <h3 className="break-words text-base font-semibold text-ink">
                  {row.project.title}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={row.status.tone}>{row.status.label}</Badge>
                  <Badge tone={row.visibility.tone}>{row.visibility.label}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {row.project.shortDescription}
                </p>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="text-muted">Môn học · Kỳ học</dt>
                    <dd className="break-words text-ink">
                      {row.project.subjectName} · {row.project.semester}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted">File ZIP</dt>
                    <dd className="break-words text-ink">
                      {row.archive}{" "}
                      <span className="text-muted">({row.downloads})</span>
                    </dd>
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <dt className="text-muted">Quyền truy cập</dt>
                    <dd className="break-words text-ink">{row.access}</dd>
                  </div>
                </dl>
                <RowActions
                  projectId={row.project.id}
                  slug={row.project.slug}
                  title={row.project.title}
                  hasArchive={Boolean(row.latestFile)}
                  className="mt-4 border-t border-line pt-4"
                />
              </Card>
            ))}
          </ul>
        </section>
      ) : (
        <EmptyState
          title="Chưa có tài liệu nào"
          description="Bắt đầu bằng cách thêm tài liệu mới, tải thư mục lên và kiểm tra lại trang công khai."
          action={
            isAdmin ? (
              <ButtonLink
                href="/dashboard/projects/new"
                leftIcon={<FolderPlus size={16} aria-hidden="true" />}
              >
                Thêm tài liệu đầu tiên
              </ButtonLink>
            ) : null
          }
        />
      )}
    </div>
  );
}

function RowActions({
  projectId,
  slug,
  title,
  hasArchive,
  className = "",
}: {
  projectId: string;
  slug: string;
  title: string;
  hasArchive: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <ButtonLink
        href={`/dashboard/projects/${projectId}/edit`}
        size="sm"
        leftIcon={<PencilLine size={16} aria-hidden="true" />}
      >
        Chỉnh sửa
        <span className="sr-only">: {title}</span>
      </ButtonLink>
      {hasArchive && (
        <ButtonLink
          href={`/api/projects/${projectId}/download`}
          variant="secondary"
          size="sm"
          leftIcon={<Download size={16} aria-hidden="true" />}
        >
          Tải ZIP
          <span className="sr-only">: {title}</span>
        </ButtonLink>
      )}
      <ButtonLink
        href={`/projects/${slug}`}
        variant="ghost"
        size="sm"
        leftIcon={<Eye size={16} aria-hidden="true" />}
      >
        Xem công khai
        <span className="sr-only">: {title}</span>
      </ButtonLink>
    </div>
  );
}
