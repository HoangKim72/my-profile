// app/(dashboard)/dashboard/projects/new/page.tsx

export const dynamic = "force-dynamic";

import { ProjectForm } from "@/components/projects/ProjectForm";
import { requireAdmin } from "@/lib/auth/check-auth";
import { PageHeader } from "@/components/ui";

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        title="Thêm tài liệu"
        description="Tải lên cả thư mục để người dùng có thể tải trọn bộ tài liệu trong một lần."
      />

      <ProjectForm />
    </div>
  );
}
