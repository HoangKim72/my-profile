// app/(dashboard)/dashboard/page.tsx

export const dynamic = "force-dynamic";

import Link from "next/link";
import { PermissionType, type Prisma } from "@prisma/client";
import {
  ChevronRight,
  Eye,
  FileArchive,
  FolderKanban,
  FolderPlus,
  Globe,
  MessageSquareText,
  PencilLine,
  Settings2,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { requireAuth } from "@/lib/auth/check-auth";
import { prisma } from "@/lib/db/prisma";
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

const VISIBILITY_LABELS: Record<string, string> = {
  PRIVATE: "Riêng tư",
  SHARED: "Chia sẻ",
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function DashboardPage() {
  const user = await requireAuth();
  const isAdmin = user.role === "admin";

  const accessibleProjectWhere: Prisma.ProjectWhereInput =
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

  const [
    projectCount,
    messageCount,
    userCount,
    publishedCount,
    archiveCount,
    recentProjects,
  ] = await Promise.all([
    prisma.project.count({ where: accessibleProjectWhere }),
    prisma.contactMessage.count(),
    prisma.user.count(),
    prisma.project.count({
      where: {
        ...accessibleProjectWhere,
        status: "PUBLISHED",
      },
    }),
    prisma.project.count({
      where: {
        ...accessibleProjectWhere,
        files: {
          some: {},
        },
      },
    }),
    prisma.project.findMany({
      where: accessibleProjectWhere,
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        visibility: true,
        updatedAt: true,
        authorId: true,
        author: {
          select: {
            email: true,
          },
        },
        files: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  const stats: Array<{
    label: string;
    value: number;
    detail: string;
    icon: LucideIcon;
  }> = [
    {
      label: isAdmin ? "Tổng số tài liệu" : "Tài liệu bạn có thể sửa",
      value: projectCount,
      detail: isAdmin
        ? "Tất cả tài liệu trong hệ thống."
        : "Tài liệu của bạn và tài liệu được cấp quyền chỉnh sửa.",
      icon: FolderKanban,
    },
    {
      label: "Đã có file ZIP",
      value: archiveCount,
      detail: "Sẵn sàng để người dùng tải xuống.",
      icon: FileArchive,
    },
    {
      label: "Đang công khai",
      value: publishedCount,
      detail: "Đang hiển thị trên website.",
      icon: Eye,
    },
    {
      label: isAdmin ? "Người dùng" : "Tin nhắn liên hệ",
      value: isAdmin ? userCount : messageCount,
      detail: isAdmin
        ? "Số tài khoản đang có trong hệ thống."
        : "Tổng số tin nhắn liên hệ đã nhận.",
      icon: isAdmin ? UsersRound : MessageSquareText,
    },
  ];

  const quickActions: Array<{
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
  }> = [
    ...(isAdmin
      ? [
          {
            title: "Thêm tài liệu",
            description: "Tạo tài liệu mới và tải thư mục lên dưới dạng ZIP.",
            href: "/dashboard/projects/new",
            icon: FolderPlus,
          },
        ]
      : []),
    {
      title: "Quản lý kho tài liệu",
      description: "Xem trạng thái, file ZIP và mở chỉnh sửa nhanh.",
      href: "/dashboard/projects",
      icon: FolderKanban,
    },
    ...(isAdmin
      ? [
          {
            title: "Cập nhật hồ sơ công khai",
            description:
              "Chỉnh trang Giới thiệu, CV, ảnh đại diện và kênh liên hệ.",
            href: "/dashboard/settings",
            icon: Settings2,
          },
        ]
      : []),
    {
      title: "Xem trang Giới thiệu",
      description: "Đối chiếu nội dung công khai sau khi cập nhật.",
      href: "/about",
      icon: UserRound,
    },
    {
      title: "Xem kho tài liệu công khai",
      description: "Kiểm tra danh sách mà người dùng đang thấy.",
      href: "/projects",
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tổng quan"
        description={`Xin chào ${user.profile?.fullName || user.email}. Theo dõi kho tài liệu và hồ sơ công khai của bạn tại đây.`}
        actions={
          isAdmin ? (
            <ButtonLink
              href="/dashboard/projects/new"
              leftIcon={<FolderPlus size={16} aria-hidden="true" />}
            >
              Thêm tài liệu
            </ButtonLink>
          ) : null
        }
      />

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Số liệu
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card as="li" key={stat.label} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-muted">{stat.label}</p>
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </span>
                </div>
                <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-ink">
                  {stat.value.toLocaleString("vi-VN")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {stat.detail}
                </p>
              </Card>
            );
          })}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          as="section"
          aria-labelledby="recent-heading"
          className="min-w-0 lg:col-span-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="recent-heading" className="text-lg font-semibold text-ink">
                Tài liệu vừa cập nhật
              </h2>
              <p className="mt-1 text-sm text-muted">
                Nên kiểm tra lại trước khi công khai hoặc gửi cho người dùng.
              </p>
            </div>
            <ButtonLink href="/dashboard/projects" variant="secondary" size="sm">
              Xem tất cả
            </ButtonLink>
          </div>

          {recentProjects.length > 0 ? (
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {recentProjects.map((project) => {
                const status = STATUS_BADGES[project.status] ?? {
                  label: project.status,
                  tone: "neutral" as const,
                };
                const visibilityLabel = VISIBILITY_LABELS[project.visibility];
                const hasArchive = project.files.length > 0;

                return (
                  <li
                    key={project.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 break-words text-base font-semibold text-ink">
                          {project.title}
                        </h3>
                        <Badge tone={status.tone}>{status.label}</Badge>
                        {visibilityLabel ? (
                          <Badge tone="neutral">{visibilityLabel}</Badge>
                        ) : null}
                        <Badge tone={hasArchive ? "accent" : "warn"}>
                          {hasArchive ? "Có file ZIP" : "Chưa có file ZIP"}
                        </Badge>
                      </div>
                      <p className="mt-1 break-words text-sm text-muted">
                        {project.authorId === user.id
                          ? "Bạn là chủ sở hữu"
                          : `Chủ sở hữu: ${project.author.email}`}
                        {" · "}
                        Cập nhật {dateFormatter.format(project.updatedAt)}
                      </p>
                    </div>

                    <ButtonLink
                      href={`/dashboard/projects/${project.id}/edit`}
                      variant="secondary"
                      size="sm"
                      leftIcon={<PencilLine size={16} aria-hidden="true" />}
                      className="self-start sm:self-auto"
                    >
                      Chỉnh sửa
                      <span className="sr-only">: {project.title}</span>
                    </ButtonLink>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              className="mt-5"
              titleAs="h3"
              title="Chưa có tài liệu nào"
              description="Tài liệu bạn tạo hoặc được cấp quyền sẽ hiện ở đây."
              action={
                isAdmin ? (
                  <ButtonLink
                    href="/dashboard/projects/new"
                    leftIcon={<FolderPlus size={16} aria-hidden="true" />}
                  >
                    Thêm tài liệu
                  </ButtonLink>
                ) : null
              }
            />
          )}
        </Card>

        <div className="min-w-0 space-y-6">
          <Card as="section" aria-labelledby="quick-heading">
            <h2 id="quick-heading" className="text-lg font-semibold text-ink">
              Lối tắt
            </h2>
            <ul className="mt-4 space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <li key={action.href}>
                    <Link
                      href={action.href}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-3 transition-colors duration-150 hover:border-line-strong hover:bg-sunken"
                    >
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sunken text-muted"
                        aria-hidden="true"
                      >
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">
                          {action.title}
                        </span>
                        <span className="block text-sm text-muted">
                          {action.description}
                        </span>
                      </span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-muted"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card as="section" aria-labelledby="tips-heading" muted>
            <h2 id="tips-heading" className="text-lg font-semibold text-ink">
              Lưu ý
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
              <li>
                Muốn đổi nội dung công khai, hãy cập nhật ở{" "}
                <strong className="text-ink">Cài đặt hồ sơ</strong>, sau đó mở
                trang <strong className="text-ink">Giới thiệu</strong> hoặc{" "}
                <strong className="text-ink">CV</strong> để đối chiếu.
              </li>
              <li>
                Với mỗi tài liệu, kiểm tra{" "}
                <strong className="text-ink">trạng thái</strong>,{" "}
                <strong className="text-ink">quyền hiển thị</strong> và{" "}
                <strong className="text-ink">file ZIP</strong> để tránh công
                khai nhầm hoặc thiếu file.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
