// app/(public)/projects/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import {
  getPublicProjects,
  getPublicResourceFacets,
} from "@/actions/projects";
import {
  parseResourceFilters,
  RESOURCE_SORT_OPTIONS,
} from "@/lib/projects/resource";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kho tài liệu",
  description: "Kho tài liệu môn học, lọc theo môn và kỳ học, tải về dạng ZIP",
};

const SELECT_CLASS =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseResourceFilters(await searchParams);
  const [{ projects, total }, facets] = await Promise.all([
    getPublicProjects({ ...filters, limit: 100 }),
    getPublicResourceFacets(),
  ]);
  const hasActiveFilter = Boolean(
    filters.q || filters.subject || filters.semester,
  );

  return (
    <div className="min-h-screen py-20">
      <div className="container-custom">
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-4 text-gradient">
            Kho tài liệu
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Tài liệu môn học đóng gói sẵn dạng ZIP. Lọc theo môn, kỳ học hoặc
            tìm theo từ khoá.
          </p>
        </div>

        <form
          method="get"
          className="card mb-10 grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
        >
          <div>
            <label htmlFor="q" className="mb-1.5 block text-sm font-medium">
              Tìm kiếm
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Tên tài liệu, môn học, tag..."
              className={SELECT_CLASS}
              maxLength={120}
            />
          </div>

          <div>
            <label htmlFor="subject" className="mb-1.5 block text-sm font-medium">
              Môn học
            </label>
            <select
              id="subject"
              name="subject"
              defaultValue={filters.subject}
              className={SELECT_CLASS}
            >
              <option value="">Tất cả môn</option>
              {facets.subjects.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value} ({item.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="semester" className="mb-1.5 block text-sm font-medium">
              Kỳ học
            </label>
            <select
              id="semester"
              name="semester"
              defaultValue={filters.semester}
              className={SELECT_CLASS}
            >
              <option value="">Tất cả kỳ</option>
              {facets.semesters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value} ({item.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="mb-1.5 block text-sm font-medium">
              Sắp xếp
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={filters.sort}
              className={SELECT_CLASS}
            >
              {Object.entries(RESOURCE_SORT_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary whitespace-nowrap">
              <Search size={16} />
              Lọc
            </button>
            {hasActiveFilter && (
              <Link href="/projects" className="btn-secondary whitespace-nowrap">
                Xoá lọc
              </Link>
            )}
          </div>
        </form>

        {projects && projects.length > 0 ? (
          <>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              {hasActiveFilter
                ? `Tìm thấy ${total} tài liệu phù hợp.`
                : `Hiện có ${total} tài liệu công khai.`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {hasActiveFilter
                ? "Không có tài liệu nào khớp với bộ lọc."
                : "Chưa có tài liệu nào được xuất bản."}
            </p>
            {hasActiveFilter && (
              <Link href="/projects" className="btn-secondary mt-6">
                Xem tất cả tài liệu
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
