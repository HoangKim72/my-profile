// app/(dashboard)/dashboard/page.tsx

export const dynamic = "force-dynamic";

import Link from "next/link";
import { PermissionType, type Prisma } from "@prisma/client";
import {
  ArrowRight,
  Eye,
  FileArchive,
  FolderKanban,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { requireAuth } from "@/lib/auth/check-auth";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardPage() {
  const user = await requireAuth();

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

  const stats = [
    {
      label:
        user.role === "admin" ? "Tong folder quan ly" : "Folder co the sua",
      value: projectCount,
      detail:
        user.role === "admin"
          ? "Bao gom tat ca folder trong he thong."
          : "Folder cua ban va folder duoc cap quyen EDIT.",
      icon: FolderKanban,
      accent: "from-blue-600 to-cyan-400",
      surface:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-100",
    },
    {
      label: "Folder da san sang",
      value: archiveCount,
      detail: "Da co file ZIP de nguoi dung tai xuong.",
      icon: FileArchive,
      accent: "from-emerald-600 to-teal-400",
      surface:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100",
    },
    {
      label: "Folder dang public",
      value: publishedCount,
      detail: "Dang duoc cong khai tren website.",
      icon: Eye,
      accent: "from-fuchsia-600 to-pink-400",
      surface:
        "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-100",
    },
    {
      label: "Thong tin he thong",
      value: user.role === "admin" ? userCount : messageCount,
      detail:
        user.role === "admin"
          ? "So user dang ton tai trong he thong."
          : "Tong so contact message da nhan.",
      icon: user.role === "admin" ? UsersRound : MessageSquareText,
      accent: "from-slate-700 to-slate-500",
      surface:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100",
    },
  ];

  const quickActions = [
    {
      title: "Quan ly folder",
      description:
        "Xem trang thai archive, owner va mo man hinh chinh sua nhanh.",
      href: "/dashboard/projects",
      icon: FolderKanban,
    },
    {
      title: "Cap nhat profile cong khai",
      description: "Dieu chinh About, CV, avatar va cac kenh lien he.",
      href: "/dashboard/settings",
      icon: Settings2,
    },
    {
      title: "Kiem tra trang cong khai",
      description: "Mo trang public de doi chieu noi dung sau khi cap nhat.",
      href: "/about",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-blue-100 bg-[linear-gradient(135deg,rgba(37,99,235,0.1),rgba(14,165,233,0.06)_45%,rgba(255,255,255,0.94))] p-6 shadow-[0_30px_80px_-40px_rgba(37,99,235,0.45)] dark:border-blue-950/60 dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.22),rgba(15,23,42,0.92)_46%,rgba(2,6,23,0.96))] md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-blue-900 dark:bg-slate-950/60 dark:text-blue-200">
              <ShieldCheck size={14} />
              Workspace overview
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">
              {user.profile?.fullName || user.email}, day la trung tam dieu hanh
              cua ban
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Tu day ban co the quan ly folder chia se, cap nhat profile cong
              khai va nhanh chong nhin thay muc nao da san sang cho production.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-[24px] border border-white/80 bg-white/85 p-4 transition-all hover:-translate-y-1 hover:border-blue-200 dark:border-white/10 dark:bg-slate-950/75 dark:hover:border-blue-900"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">
                    {action.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent} text-white shadow-lg`}
                >
                  <Icon size={20} />
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {stat.detail}
              </p>
              <div
                className={`mt-5 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stat.surface}`}
              >
                Cap nhat theo du lieu thuc
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
                Folder vua cap nhat
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Nhung muc nen kiem tra lai truoc khi cong khai hoac gui cho nguoi
                dung.
              </p>
            </div>
            <Link href="/dashboard/projects" className="btn-secondary">
              Xem tat ca
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 transition-colors hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-blue-900"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-lg font-semibold text-slate-950 dark:text-white">
                          {project.title}
                        </h4>
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
                          {project.visibility}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                          {project.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {project.authorId === user.id
                          ? "Ban la owner cua folder nay."
                          : `Owner hien tai: ${project.author.email}`}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
                        Cap nhat lan cuoi:{" "}
                        {new Intl.DateTimeFormat("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }).format(project.updatedAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {project.files.length > 0
                          ? "Co archive"
                          : "Chua co archive"}
                      </span>
                      <Link
                        href={`/dashboard/projects/${project.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        Mo chinh sua
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Chua co folder nao de hien thi trong khu overview.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85 md:p-7">
            <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
              Goc dieu phoi
            </h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] bg-blue-50 p-4 text-sm leading-7 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                Neu ban muon doi noi dung public, uu tien vao{" "}
                <strong>Settings</strong> de cap nhat profile, sau do mo{" "}
                <strong>About</strong> hoac <strong>CV</strong> de doi chieu.
              </div>
              <div className="rounded-[24px] bg-slate-100 p-4 text-sm leading-7 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Khi quan ly folder, hay kiem tra 3 muc:{" "}
                <strong>visibility</strong>, <strong>status</strong>, va{" "}
                <strong>archive ready</strong> de tranh public nham hoac thieu
                file ZIP.
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85 md:p-7">
            <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
              Loi tat nhanh
            </h3>
            <div className="mt-5 space-y-3">
              <Link
                href="/dashboard/projects/new"
                className="flex items-center justify-between rounded-[22px] border border-slate-200 px-4 py-4 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:text-blue-200"
              >
                Tao folder moi
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-between rounded-[22px] border border-slate-200 px-4 py-4 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:text-blue-200"
              >
                Mo profile settings
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/projects"
                className="flex items-center justify-between rounded-[22px] border border-slate-200 px-4 py-4 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:text-blue-200"
              >
                Xem danh sach public
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
