// app/(dashboard)/dashboard/projects/new/page.tsx

export const dynamic = "force-dynamic";

import { ProjectForm } from "@/components/projects/ProjectForm";
import { requireAuth } from "@/lib/auth/check-auth";

export default async function NewProjectPage() {
  await requireAuth();

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create Project</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tạo project dạng folder để người dùng có thể tải xuống trọn bộ tài
          liệu trong một lần.
        </p>
      </div>

      <ProjectForm />
    </div>
  );
}
