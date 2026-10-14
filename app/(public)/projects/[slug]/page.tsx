// app/(public)/projects/[slug]/page.tsx

import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/actions/projects";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Download, ExternalLink, FileArchive } from "lucide-react";
import { formatFileSize } from "@/lib/projects/archive";
import { parseArchiveManifest } from "@/lib/projects/archive-manifest";
import { parseResourceTags } from "@/lib/projects/resource";
import { ArchiveContents } from "@/components/projects/ArchiveContents";
import { Badge, ButtonLink, Card, buttonClasses } from "@/components/ui";

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
      title: "Không tìm thấy tài liệu",
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
  const manifest = parseArchiveManifest(latestArchive?.entries);
  const techTags = parseResourceTags(project.techStack);

  const facts = [
    { label: "Môn học", value: project.subjectName },
    { label: "Kỳ học", value: project.semester },
    {
      label: "Lượt tải",
      value: project.downloadCount.toLocaleString("vi-VN"),
    },
  ];

  return (
    <div className="container-custom max-w-4xl py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/projects"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Kho tài liệu
        </Link>
      </nav>

      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          Tài liệu
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {project.title}
        </h1>
        {project.shortDescription && (
          <p className="mt-3 text-base leading-7 text-muted">
            {project.shortDescription}
          </p>
        )}
      </header>

      {latestArchive && (
        <Card
          as="section"
          aria-labelledby="tai-xuong"
          className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
              aria-hidden="true"
            >
              <FileArchive size={20} />
            </div>
            <div className="min-w-0">
              <h2 id="tai-xuong" className="text-base font-semibold text-ink">
                Tải về file ZIP
              </h2>
              <p className="mt-1 break-all text-sm text-muted">
                {latestArchive.fileName} ·{" "}
                {formatFileSize(latestArchive.sizeBytes)}
              </p>
            </div>
          </div>

          <ButtonLink
            href={`/api/projects/${project.id}/download`}
            prefetch={false}
            size="md"
            leftIcon={<Download size={18} aria-hidden="true" />}
            className="sm:self-center"
          >
            Tải ZIP
          </ButtonLink>
        </Card>
      )}

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-lg bg-sunken px-4 py-3">
            <dt className="text-sm text-muted">{fact.label}</dt>
            <dd className="mt-1 font-semibold text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {project.coverImageUrl && (
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-xl border border-line bg-sunken">
          <Image
            src={project.coverImageUrl}
            alt={`Ảnh bìa tài liệu ${project.title}`}
            fill
            sizes="(min-width: 896px) 896px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {project.content && (
        <section aria-labelledby="mo-ta" className="mt-10">
          <h2 id="mo-ta" className="text-lg font-semibold text-ink">
            Mô tả
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-ink">
            {project.content}
          </p>
        </section>
      )}

      {manifest && (
        <div className="mt-10">
          <ArchiveContents manifest={manifest} />
        </div>
      )}

      {techTags.length > 0 && (
        <section aria-labelledby="tag" className="mt-10">
          <h2 id="tag" className="text-lg font-semibold text-ink">
            Tag
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {techTags.map((tag: string) => (
              <li key={tag}>
                <Badge tone="accent" className="text-sm">
                  {tag}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(project.githubUrl || project.demoUrl) && (
        <div className="mt-10 flex flex-wrap gap-3">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "secondary" })}
            >
              Xem trên GitHub
              <ExternalLink size={16} aria-hidden="true" />
              <span className="sr-only">(mở tab mới)</span>
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "secondary" })}
            >
              Xem bản demo
              <ExternalLink size={16} aria-hidden="true" />
              <span className="sr-only">(mở tab mới)</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
