import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateAgent, getAcSchedulerConfig } from "@/lib/tools/ac-scheduler";
import { getClientIpFromRequest } from "@/lib/security/request";
import { getAcNowMinutes, getAcTodayKey } from "@/tools/ac-scheduler/plan";

export const dynamic = "force-dynamic";

// Polled by the LAN agent every ~30s; doubles as its heartbeat. Only jobs of
// today's schedules that still wait or run are returned.
export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date();
  const todayKey = getAcTodayKey(now);

  const [config, jobs] = await Promise.all([
    getAcSchedulerConfig(),
    prisma.acJob.findMany({
      where: {
        status: { in: ["PENDING", "RUNNING"] },
        schedule: { dateKey: todayKey },
        unit: { enabled: true },
      },
      include: {
        unit: { select: { id: true, name: true, itmIp: true, floorName: true, unitIndex: true, roomCodes: true } },
      },
      orderBy: [{ runAt: "asc" }, { action: "desc" }],
    }),
    prisma.acAgent.update({
      where: { id: agent.id },
      data: { lastSeenAt: now, lastIp: getClientIpFromRequest(request) },
    }),
  ]);

  return NextResponse.json({
    serverTime: now.toISOString(),
    todayKey,
    nowMinutes: getAcNowMinutes(now),
    config,
    jobs: jobs.map((job) => ({
      id: job.id,
      action: job.action,
      status: job.status,
      attempts: job.attempts,
      runAt: job.runAt.toISOString(),
      windowStart: job.windowStart.toISOString(),
      windowEnd: job.windowEnd.toISOString(),
      roomCodes: job.roomCodes,
      unit: job.unit,
    })),
  });
}
