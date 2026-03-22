// src/components/projects/ProjectCard.tsx

import Link from "next/link";
import Image from "next/image";
import { ProjectWithDetails, Visibility } from "@/types";

interface ProjectCardProps {
  project: Omit<ProjectWithDetails, "content">;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const visibilityLabel: Record<Visibility, string> = {
    PUBLIC: "🌐 Public",
    PRIVATE: "🔒 Private",
    SHARED: "👥 Shared",
  };

  const techTags = project.techStack.split(",").map((tech) => tech.trim());

  return (
    <div className="card overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-105">
      {/* Thumbnail */}
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
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
            {project.title}
          </h3>
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded whitespace-nowrap ml-2">
            {project.subjectName}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {project.subjectName} • {project.semester}
        </p>

        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
          {project.shortDescription}
        </p>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2 mb-4">
          {techTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
          {techTags.length > 3 && (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              +{techTags.length - 3} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {visibilityLabel[project.visibility]}
          </span>
          <Link
            href={`/projects/${project.slug}`}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}
