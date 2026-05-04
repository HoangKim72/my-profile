// src/components/projects/ProjectCard.tsx

import Link from "next/link";
import Image from "next/image";
import { Download, FolderOpen } from "lucide-react";
import { formatFileSize } from "@/lib/projects/archive";
import { Visibility } from "@/types";

interface ProjectCardProject {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  subjectName: string;
  semester: string;
  techStack: string;
  visibility: Visibility;
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
  const visibilityLabel: Record<Visibility, string> = {
    PUBLIC: "Public",
    PRIVATE: "Private",
    SHARED: "Shared",
  };

  const latestArchive = project.files?.[0];
  const metaLine =
    project.subjectName !== project.title
      ? project.subjectName
      : project.semester || null;

  return (
    <div className="card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
      {project.thumbnailUrl && (
        <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-800">
          <Image
            src={project.thumbnailUrl}
            alt={project.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {project.title}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                <FolderOpen size={12} />
                {visibilityLabel[project.visibility]}
              </span>
            </div>
            {metaLine ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {metaLine}
              </p>
            ) : null}
          </div>
        </div>

        <p className="mb-4 line-clamp-2 text-gray-700 dark:text-gray-300">
          {project.shortDescription}
        </p>

        {latestArchive && (
          <div className="mb-5 rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              Bản tải xuống
            </p>
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {latestArchive.fileName}
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {formatFileSize(latestArchive.sizeBytes)}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {latestArchive && (
              <Link
                href={`/api/projects/${project.id}/download`}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Download size={15} />
                Tải ZIP
              </Link>
            )}
            <Link
              href={`/projects/${project.slug}`}
              className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
