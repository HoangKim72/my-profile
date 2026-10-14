// app/(public)/projects/page.tsx

import type { Metadata } from "next";
import { Search, SearchX, X } from "lucide-react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import {
  getPublicProjects,
  getPublicResourceFacets,
} from "@/actions/projects";
import {
  parseResourceFilters,
  RESOURCE_SORT_OPTIONS,
} from "@/lib/projects/resource";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kho tài liệu",
  description: "Kho tài liệu môn học, lọc theo môn và kỳ học, tải về dạng ZIP.",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseResourceFilters(await searchParams);
  const [projectsResult, facets] = await Promise.all([
    getPublicProjects({ ...filters, limit: 100 }),
    getPublicResourceFacets(),
  ]);
  const { projects, total } = projectsResult;
  const loadFailed = !projectsResult.success;
  const hasActiveFilter = Boolean(
    filters.q || filters.subject || filters.semester,
  );

  const clearFilterLink = (
    <ButtonLink
      href="/projects"
      variant="secondary"
      leftIcon={<X size={16} aria-hidden="true" />}
    >
      Xoá lọc
    </ButtonLink>
  );

  return (
    <div className="container-custom py-10 sm:py-14">
      <PageHeader
        eyebrow="Tài liệu môn học"
        title="Kho tài liệu"
        description="Tài liệu môn học đóng gói sẵn dạng ZIP. Lọc theo môn, kỳ học hoặc tìm theo từ khoá."
      />

      <Card as="section" padding="sm" className="mt-8" aria-label="Bộ lọc tài liệu">
        <form
          method="get"
          role="search"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
        >
          <Field htmlFor="q" label="Tìm kiếm">
            <Input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Tên tài liệu, môn học, tag…"
              maxLength={120}
            />
          </Field>

          <Field htmlFor="subject" label="Môn học">
            <Select id="subject" name="subject" defaultValue={filters.subject}>
              <option value="">Tất cả môn</option>
              {facets.subjects.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value} ({item.count})
                </option>
              ))}
            </Select>
          </Field>

          <Field htmlFor="semester" label="Kỳ học">
            <Select
              id="semester"
              name="semester"
              defaultValue={filters.semester}
            >
              <option value="">Tất cả kỳ</option>
              {facets.semesters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value} ({item.count})
                </option>
              ))}
            </Select>
          </Field>

          <Field htmlFor="sort" label="Sắp xếp">
            <Select id="sort" name="sort" defaultValue={filters.sort}>
              {Object.entries(RESOURCE_SORT_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              leftIcon={<Search size={16} aria-hidden="true" />}
            >
              Lọc
            </Button>
            {hasActiveFilter && clearFilterLink}
          </div>
        </form>
      </Card>

      <section aria-labelledby="ket-qua-tai-lieu" className="mt-8">
        <h2 id="ket-qua-tai-lieu" className="sr-only">
          Kết quả
        </h2>

        {loadFailed ? (
          <ErrorState
            title="Không tải được kho tài liệu"
            description="Hệ thống đang gặp sự cố khi lấy danh sách tài liệu. Vui lòng tải lại trang sau ít phút."
            action={
              <ButtonLink href="/projects" variant="secondary">
                Tải lại
              </ButtonLink>
            }
          />
        ) : projects && projects.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted" role="status">
              {hasActiveFilter
                ? `Tìm thấy ${total} tài liệu phù hợp.`
                : `Hiện có ${total} tài liệu công khai.`}
            </p>
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <li key={project.id} className="flex">
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </>
        ) : hasActiveFilter ? (
          <EmptyState
            icon={<SearchX size={22} />}
            title="Không có tài liệu nào khớp với bộ lọc"
            description="Thử từ khoá khác, hoặc xoá lọc để xem toàn bộ tài liệu."
            action={clearFilterLink}
          />
        ) : (
          <EmptyState
            title="Chưa có tài liệu nào"
            description="Tài liệu sẽ xuất hiện ở đây khi được xuất bản."
          />
        )}
      </section>
    </div>
  );
}
