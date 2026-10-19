import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { authenticateAgent, getAcSchedulerConfig, logAcEvent } from "@/lib/tools/ac-scheduler";
import { getAcTodayKey } from "@/tools/ac-scheduler/plan";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  // RUNNING = claim before sending; PENDING = release to retry later
  status: z.enum(["RUNNING", "PENDING", "DONE", "SKIPPED", "FAILED"]),
  result: z.string().trim().max(500).nullish(),
  level: z.enum(["INFO", "WARN", "ERROR"]).optional(),
  // State read back from iTM after the command, when known
  isRunning: z.boolean().nullish(),
});

const ALLOWED_FROM: Record<z.infer<typeof updateSchema>["status"], Array<"PENDING" | "RUNNING">> = {
  RUNNING: ["PENDING"],
  PENDING: ["RUNNING"],
  DONE: ["RUNNING"],
  FAILED: ["RUNNING"],
  SKIPPED: ["PENDING", "RUNNING"],
};

function conflict(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 409 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await authenticateAgent(request);
  if (!agent) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const { id } = await params;
  const body = parsed.data;
  const job = await prisma.acJob.findUnique({
    where: { id },
    include: { schedule: { select: { dateKey: true } }, unit: { select: { id: true, name: true, enabled: true } } },
  });

  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });

  // The server re-checks everything before letting the agent send a command
  if (body.status === "RUNNING") {
    const config = await getAcSchedulerConfig();
    if (config.paused) return conflict("paused");
    if (job.schedule.dateKey !== getAcTodayKey()) return conflict("not today");
    if (!job.unit.enabled) return conflict("unit disabled");
  }

  // Compare-and-set so two agents (or a cancel on the web) cannot race
  const updated = await prisma.acJob.updateMany({
    where: { id, status: { in: ALLOWED_FROM[body.status] } },
    data: {
      status: body.status,
      result: body.result ?? undefined,
      attempts: body.status === "RUNNING" ? { increment: 1 } : undefined,
    },
  });

  if (updated.count === 0) return conflict(`job is ${job.status}`);

  if (body.isRunning !== undefined && body.isRunning !== null) {
    await prisma.acUnit.update({
      where: { id: job.unit.id },
      data: { isRunning: body.isRunning, stateAt: new Date() },
    });
  }

  if (body.status !== "RUNNING" && body.status !== "PENDING" && body.result) {
    await logAcEvent({
      level: body.level ?? (body.status === "FAILED" ? "ERROR" : body.status === "SKIPPED" ? "WARN" : "INFO"),
      message: body.result,
      unitName: job.unit.name,
      jobId: job.id,
      actor: `agent:${agent.name}`,
    });
  }

  return NextResponse.json({ ok: true });
}
