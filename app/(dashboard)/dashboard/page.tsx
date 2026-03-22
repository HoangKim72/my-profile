// app/(dashboard)/dashboard/page.tsx

export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/check-auth";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardPage() {
  const user = await requireAuth();

  const [projectCount, messageCount, userCount] = await Promise.all([
    prisma.project.count({ where: { authorId: user.id } }),
    prisma.contactMessage.count(),
    prisma.user.count(),
  ]);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            My Projects
          </h3>
          <p className="text-4xl font-bold">{projectCount}</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Contact Messages
          </h3>
          <p className="text-4xl font-bold">{messageCount}</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Users
          </h3>
          <p className="text-4xl font-bold">{userCount}</p>
        </div>
      </div>

      {/* Welcome */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold mb-4">
          Welcome, {user.profile?.fullName || user.email}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You're logged in to your portfolio dashboard. Use the sidebar to
          navigate to different sections.
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
          <li>Create and manage your projects</li>
          <li>Upload images and files</li>
          <li>Manage user access and permissions</li>
          <li>View contact messages from visitors</li>
          <li>Update your profile information</li>
        </ul>
      </div>
    </div>
  );
}
