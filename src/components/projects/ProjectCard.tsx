// src/components/projects/ProjectCard.tsx

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Download, FolderOpen } from "lucide-react";
import { formatFileSize } from "@/lib/projects/archive";
import { parseResourceTags } from "@/lib/projects/resource";
import { Badge, ButtonLink, Card } from "@/components/ui";

interface ProjectCardProject {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  subjectName: string;
  semester: string;
  techStack: string;
  downloadCount: number;
  thumbnailUrl?: string | null;
  files?: Array<{
    id: string;
    fileName: string;
    sizeBytes: number;
    createdAt: Date;
  }>;
}

interface ProjectCardProps {
  project: ProjectCardProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const latestArchive = project.files?.[0];
  const tags = parseResourceTags(project.techStack);
  const detailHref = `/projects/${project.slug}`;

  return (
    <Card
      as="article"
      padding="none"
      interactive
      className="flex w-full flex-col overflow-hidden"
    >
      {project.thumbnailUrl && (
        <div className="relative aspect-[16/9] w-full bg-sunken">
          <Image
            src={project.thumbnailUrl}
            alt={`Ảnh minh hoạ tài liệu ${project.title}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold leading-snug text-ink">
          <Link
            href={detailHref}
            className="transition-colors hover:text-accent"
          >
            {project.title}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="accent">
            <FolderOpen size={12} aria-hidden="true" />
            <span className="sr-only">Môn học: </span>
            {project.subjectName}
          </Badge>
          <Badge>
            <CalendarDays size={12} aria-hidden="true" />
            <span className="sr-only">Kỳ học: </span>
            {project.semester}
          </Badge>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
          {project.shortDescription}
        </p>

        {tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tag">
            {tags.slice(0, 6).map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-line px-2 py-0.5 text-xs text-muted"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {latestArchive && (
          <div className="mt-4 rounded-lg bg-sunken p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Bản tải xuống
            </p>
            <p className="mt-1 break-all text-sm font-medium text-ink">
              {latestArchive.fileName}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {formatFileSize(latestArchive.sizeBytes)} ·{" "}
              {project.downloadCount.toLocaleString("vi-VN")} lượt tải
            </p>
          </div>
        )}

        <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
          {latestArchive && (
            <ButtonLink
              href={`/api/projects/${project.id}/download`}
              prefetch={false}
              variant="secondary"
              size="sm"
              leftIcon={<Download size={15} aria-hidden="true" />}
              aria-label={`Tải ZIP: ${project.title}`}
            >
              Tải ZIP
            </ButtonLink>
          )}
          <ButtonLink
            href={detailHref}
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight size={15} aria-hidden="true" />}
            aria-label={`Xem chi tiết: ${project.title}`}
          >
            Xem chi tiết
          </ButtonLink>
        </div>
        </div>
      </div>
    </Card>
  );
}
