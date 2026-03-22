// app/(public)/projects/page.tsx

import type { Metadata } from "next";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getPublicProjects } from "@/actions/projects";

export const metadata: Metadata = {
  title: "My Projects",
  description: "View all my projects and learning works",
};

export default async function ProjectsPage() {
  const { projects, total } = await getPublicProjects(100);

  return (
    <div className="min-h-screen py-20">
      <div className="container-custom">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gradient">My Projects</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            A collection of projects from various subjects and learning
            experiences.
          </p>
        </div>

        {projects && projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects?.map((project: any) => (
                <ProjectCard key={project.id} project={project as any} />
              ))}
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-12">
              Total projects: {total}
            </p>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No projects available yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
