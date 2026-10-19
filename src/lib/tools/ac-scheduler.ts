import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { AuthUser } from "@/types";
import {
  AC_OPERATOR_ROLE,
  AC_SCHEDULER_SETTINGS_KEY,
  DEFAULT_AC_SCHEDULER_CONFIG,
  acSchedulerConfigSchema,
  type AcSchedulerConfig,
} from "@/tools/ac-scheduler/config";
import { getAcTodayKey } from "@/tools/ac-scheduler/plan";

// An agent that has not polled for this long is shown as offline
export const AC_AGENT_ONLINE_MS = 90_000;

export async function getAcSchedulerConfig(): Promise<AcSchedulerConfig> {
  try {
    const setting = await prisma.toolSetting.findUnique({
      where: { key: AC_SCHEDULER_SETTINGS_KEY },
    });
    const parsed = acSchedulerConfigSchema.safeParse(setting?.value);

    return parsed.success ? parsed.data : DEFAULT_AC_SCHEDULER_CONFIG;
  } catch (error) {
    console.error("Unable to load AC scheduler config:", error);
    // Fail safe: an unreadable config must never let commands through
    return { ...DEFAULT_AC_SCHEDULER_CONFIG, paused: true };
  }
}

// Registration is open, so being signed in is not enough to switch units:
// admins, or users an admin granted the ac_operator role.
export async function canOperateAc(user: AuthUser | null) {
  if (!user) return false;
  if (user.role === "admin") return true;

  const grant = await prisma.userRole.findFirst({
    where: { userId: user.id, role: { name: AC_OPERATOR_ROLE } },
    select: { id: true },
  });

  return Boolean(grant);
}

export async function logAcEvent(input: {
  level?: "INFO" | "WARN" | "ERROR";
  message: string;
  unitName?: string | null;
  jobId?: string | null;
  actor?: string | null;
}) {
  await prisma.acEvent.create({
    data: {
      level: input.level ?? "INFO",
      message: input.message.slice(0, 1000),
      unitName: input.unitName ?? null,
      jobId: input.jobId ?? null,
      actor: input.actor ?? null,
    },
  });
}

export async function getAcOverview() {
  const todayKey = getAcTodayKey();
  const [config, schedules, jobs, events, units, agents] = await Promise.all([
    getAcSchedulerConfig(),
    prisma.acSchedule.findMany({
      where: { dateKey: todayKey },
      orderBy: { createdAt: "desc" },
    }),
    prisma.acJob.findMany({
      where: { schedule: { dateKey: todayKey } },
      include: { unit: { select: { name: true } } },
      orderBy: [{ runAt: "asc" }, { action: "desc" }],
    }),
    prisma.acEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.acUnit.findMany({ orderBy: [{ itmIp: "asc" }, { floorName: "asc" }, { unitIndex: "asc" }] }),
    prisma.acAgent.findMany({ where: { revokedAt: null }, orderBy: { lastSeenAt: "desc" } }),
  ]);

  return { todayKey, config, schedules, jobs, events, units, agents };
}

// ---------- agent tokens ----------

export function hashAgentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateAgentToken() {
  return `acag_${randomBytes(24).toString("base64url")}`;
}

export async function authenticateAgent(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);

  if (!match) return null;

  const agent = await prisma.acAgent.findUnique({
    where: { tokenHash: hashAgentToken(match[1]) },
  });

  return agent && !agent.revokedAt ? agent : null;
}
