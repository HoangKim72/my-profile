import { Hero } from "@/components/features/Hero";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getPublicProjects } from "@/actions/projects";
import Link from "next/link";

export default async function Home() {
  const { projects } = await getPublicProjects(6);

  return (
    <>
      <Hero />

      {/* Featured Projects */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Projects</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore a selection of my recent projects spanning various
              subjects and technologies.
            </p>
          </div>

          {projects && projects.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {projects?.map((project: any) => (
                  <ProjectCard key={project.id} project={project as any} />
                ))}
              </div>

              <div className="text-center">
                <Link href="/projects" className="btn-primary text-lg">
                  View All Projects
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No projects yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to collaborate?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            I'm always interested in hearing about new projects and
            opportunities.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  );
}
