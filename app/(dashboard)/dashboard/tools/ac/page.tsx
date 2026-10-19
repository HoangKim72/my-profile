// app/(dashboard)/dashboard/tools/ac/page.tsx

export const dynamic = "force-dynamic";

import { ExternalLink } from "lucide-react";
import { ButtonLink, PageHeader } from "@/components/ui";
import { AcAdminPanel } from "@/components/tools/AcAdminPanel";
import { requireAdmin } from "@/lib/auth/check-auth";
import { prisma } from "@/lib/db/prisma";
import { getAcSchedulerConfig } from "@/lib/tools/ac-scheduler";
import { AC_OPERATOR_ROLE } from "@/tools/ac-scheduler/config";
import { formatAcUnitsCsv } from "@/tools/ac-scheduler/units";

export default async function AcSchedulerSettingsPage() {
  await requireAdmin();

  const [config, units, users, agents] = await Promise.all([
    getAcSchedulerConfig(),
    prisma.acUnit.findMany({
      where: { enabled: true },
      orderBy: [{ itmIp: "asc" }, { floorName: "asc" }, { unitIndex: "asc" }],
    }),
    prisma.user.findMany({
      orderBy: { email: "asc" },
      select: { id: true, email: true, userRoles: { select: { role: { select: { name: true } } } } },
    }),
    prisma.acAgent.findMany({ where: { revokedAt: null }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        title="Cấu hình máy lạnh theo lịch"
        description="Danh sách máy, người được điều khiển, token agent và ngưỡng an toàn."
        actions={
          <ButtonLink href="/tools/ac" variant="secondary" leftIcon={<ExternalLink size={16} aria-hidden="true" />}>
            Mở tool
          </ButtonLink>
        }
      />
      <AcAdminPanel
        config={config}
        unitsCsv={units.length > 0 ? formatAcUnitsCsv(units) : ""}
        unitCount={units.length}
        users={users.map((user) => {
          const roles = user.userRoles.map((item) => item.role.name);
          return {
            id: user.id,
            email: user.email,
            isAdmin: roles.includes("admin"),
            isOperator: roles.includes(AC_OPERATOR_ROLE),
          };
        })}
        agents={agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          lastSeenAt: agent.lastSeenAt?.toISOString() ?? null,
          lastIp: agent.lastIp,
        }))}
      />
    </div>
  );
}
