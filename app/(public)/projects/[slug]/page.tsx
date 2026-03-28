// app/(public)/projects/[slug]/page.tsx

import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/actions/projects";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { formatFileSize } from "@/lib/projects/archive";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { project } = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: project.title,
    description: project.shortDescription,
  };
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, success } = await getProjectBySlug(slug);

  if (!success || !project) {
    notFound();
  }

  const latestArchive = project.files?.[0] ?? null;
  const techTags = project.techStack.split(",").map((t: string) => t.trim());

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <Link
          href="/projects"
          className="text-blue-600 hover:text-blue-700 font-medium mb-8 inline-flex items-center gap-2"
        >
          ← Back to Shared Folders
        </Link>

        <h1 className="text-5xl font-bold mb-4 text-gradient">
          {project.title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          {project.shortDescription}
        </p>

        {latestArchive && (
          <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Download This Folder</h2>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  {latestArchive.fileName} •{" "}
                  {formatFileSize(latestArchive.sizeBytes)}
                </p>
              </div>

              <Link
                href={`/api/projects/${project.id}/download`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Download size={18} />
                Download ZIP
              </Link>
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Subject
            </span>
            <p className="font-semibold">{project.subjectName}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Delivery
            </span>
            <p className="font-semibold">
              {latestArchive ? "ZIP download" : "Preparing archive"}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Status
            </span>
            <p className="font-semibold">{project.status}</p>
          </div>
        </div>

        {/* Cover Image */}
        {project.coverImageUrl && (
          <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={project.coverImageUrl}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none mb-12">
          <p className="whitespace-pre-wrap">{project.content}</p>
        </div>

        {/* Tech Stack */}
        {techTags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Technologies</h3>
            <div className="flex flex-wrap gap-2">
              {techTags.map((tag: string) => (
                <span
                  key={tag}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-4 py-2 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {(project.githubUrl || project.demoUrl) && (
          <div className="flex flex-wrap gap-4">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                View on GitHub →
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Live Demo →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
