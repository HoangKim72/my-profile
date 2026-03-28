// app/(public)/projects/page.tsx

import type { Metadata } from "next";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getPublicProjects } from "@/actions/projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared Folders",
  description: "Download shared study folders and project resources",
};

export default async function ProjectsPage() {
  const { projects, total } = await getPublicProjects(100);

  return (
    <div className="min-h-screen py-20">
      <div className="container-custom">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gradient">
            Shared Folders
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Danh sách các thư mục tài liệu đã được đóng gói sẵn để bạn tải về
            và sử dụng ngay.
          </p>
        </div>

        {projects && projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects?.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-12">
              Tổng số thư mục có thể tải xuống: {total}
            </p>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Chưa có thư mục nào sẵn sàng để tải xuống.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
