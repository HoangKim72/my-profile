import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { authenticateAgent, logAcEvent } from "@/lib/tools/ac-scheduler";

export const dynamic = "force-dynamic";

const eventSchema = z.object({
  level: z.enum(["INFO", "WARN", "ERROR"]).default("INFO"),
  message: z.string().trim().min(1).max(1000),
  unitName: z.string().max(80).nullish(),
});

// Free-form agent log lines (start-up, iTM login failures...)
export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  await logAcEvent({ ...parsed.data, actor: `agent:${agent.name}` });
  return NextResponse.json({ ok: true });
}
