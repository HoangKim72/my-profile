import type { Metadata } from "next";
import { AcSchedulerWorkspace } from "@/components/tools/AcSchedulerWorkspace";
import { PageHeader } from "@/components/ui";
import { requireAuth } from "@/lib/auth/check-auth";
import { canOperateAc, getAcOverview } from "@/lib/tools/ac-scheduler";

export const metadata: Metadata = {
  title: "Máy lạnh theo lịch",
  description: "Bật máy lạnh E1 theo lịch học và xem nhật ký trực tiếp",
};

export const dynamic = "force-dynamic";

export default async function AcSchedulerPage() {
  const user = await requireAuth();
  const [overview, canOperate] = await Promise.all([getAcOverview(), canOperateAc(user)]);

  return (
    <div className="container-custom max-w-6xl py-10 md:py-14">
      <PageHeader eyebrow="Công cụ" title="Máy lạnh theo lịch" />
      <div className="mt-8">
        <AcSchedulerWorkspace
          todayKey={overview.todayKey}
          config={overview.config}
          canOperate={canOperate}
          isAdmin={user.role === "admin"}
          schedules={overview.schedules.map((schedule) => ({
            id: schedule.id,
            status: schedule.status,
            fileName: schedule.fileName,
            createdByEmail: schedule.createdByEmail,
            createdAt: schedule.createdAt.toISOString(),
          }))}
          jobs={overview.jobs.map((job) => ({
            id: job.id,
            scheduleId: job.scheduleId,
            action: job.action,
            status: job.status,
            runAt: job.runAt.toISOString(),
            windowStart: job.windowStart.toISOString(),
            windowEnd: job.windowEnd.toISOString(),
            roomCodes: job.roomCodes,
            unitName: job.unit.name,
            result: job.result,
          }))}
          events={overview.events.map((event) => ({
            id: event.id,
            level: event.level,
            message: event.message,
            unitName: event.unitName,
            actor: event.actor,
            createdAt: event.createdAt.toISOString(),
          }))}
          units={overview.units.map((unit) => ({
            id: unit.id,
            name: unit.name,
            roomCodes: unit.roomCodes,
            enabled: unit.enabled,
            isRunning: unit.isRunning,
            stateAt: unit.stateAt?.toISOString() ?? null,
          }))}
          agents={overview.agents.map((agent) => ({
            id: agent.id,
            name: agent.name,
            lastSeenAt: agent.lastSeenAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
