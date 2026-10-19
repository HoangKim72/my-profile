"use server";

import { Prisma, type AcJob } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/check-auth";
import {
  canOperateAc,
  generateAgentToken,
  getAcSchedulerConfig,
  hashAgentToken,
  logAcEvent,
} from "@/lib/tools/ac-scheduler";
import {
  AC_OPERATOR_ROLE,
  AC_SCHEDULER_SETTINGS_KEY,
  acSchedulerConfigSchema,
} from "@/tools/ac-scheduler/config";
import { acScheduleRowsSchema } from "@/tools/ac-scheduler/parser";
import {
  AcPlanError,
  acLocalTimeToDate,
  buildAcPlan,
  classifyTurnOn,
  formatDateKey,
  formatMinutes,
  getAcNowMinutes,
  getAcTodayKey,
  type AcWindow,
} from "@/tools/ac-scheduler/plan";
import { parseAcUnitsCsv } from "@/tools/ac-scheduler/units";

export type AcActionResult =
  | { success: true; message?: string }
  | { success: false; error: string; needsConfirm?: boolean };

const fail = (error: string, extra: { needsConfirm?: boolean } = {}): AcActionResult => ({
  success: false,
  error,
  ...extra,
});

async function requireOperator() {
  const user = await getCurrentUser();
  return (await canOperateAc(user)) ? user : null;
}

async function requireAdminUser() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

function revalidateAc() {
  revalidatePath("/tools/ac");
  revalidatePath("/dashboard/tools/ac");
}

const windowKey = (unitId: string, windowStart: Date) => `${unitId}|${windowStart.toISOString()}`;

// Pending OFF jobs whose ON already ran must survive a cancel or re-import,
// otherwise a unit the tool switched on would be left running.
function splitPendingJobs(jobs: AcJob[]) {
  const startedWindows = new Set(
    jobs
      .filter((job) => job.action === "ON" && (job.status === "DONE" || job.status === "RUNNING"))
      .map((job) => windowKey(job.unitId, job.windowStart)),
  );
  const pending = jobs.filter((job) => job.status === "PENDING");

  return {
    keepOff: pending.filter(
      (job) => job.action === "OFF" && startedWindows.has(windowKey(job.unitId, job.windowStart)),
    ),
    cancel: pending.filter(
      (job) => !(job.action === "OFF" && startedWindows.has(windowKey(job.unitId, job.windowStart))),
    ),
  };
}

// ---------- schedules (operators) ----------

const activateInputSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  rows: acScheduleRowsSchema,
  confirmPeak: z.boolean(),
});

export async function activateAcSchedule(input: unknown): Promise<AcActionResult> {
  const user = await requireOperator();
  if (!user) return fail("Tài khoản chưa được cấp quyền điều khiển máy lạnh.");

  const parsed = activateInputSchema.safeParse(input);
  if (!parsed.success) return fail("Dữ liệu lịch gửi lên không hợp lệ.");

  const config = await getAcSchedulerConfig();
  if (config.paused) return fail("Hệ thống đang tạm dừng khẩn cấp. Admin cần bật lại trước khi kích hoạt lịch.");

  const units = await prisma.acUnit.findMany({
    where: { enabled: true },
    select: { id: true, name: true, roomCodes: true },
  });

  // The server's own clock decides what "today" is, never the browser's
  const todayKey = getAcTodayKey();
  const nowMinutes = getAcNowMinutes();
  let plan;

  try {
    plan = buildAcPlan(parsed.data.rows, { todayKey, units, config });
  } catch (error) {
    if (error instanceof AcPlanError) return fail(error.message);
    throw error;
  }

  if (plan.windows.length === 0) return fail("Lịch không có phòng nào cần bật máy lạnh.");

  if (plan.peakConcurrentUnits > config.maxConcurrentUnits && !parsed.data.confirmPeak) {
    return fail(
      `Có lúc ${plan.peakConcurrentUnits} máy chạy cùng lúc, vượt ngưỡng ${config.maxConcurrentUnits}. Hãy xác nhận lại.`,
      { needsConfirm: true },
    );
  }

  const timings = plan.windows.map((window) => ({
    window,
    timing: classifyTurnOn(nowMinutes, window, config),
  }));
  const actor = user.email;

  await prisma.$transaction(async (tx) => {
    // Cancelled schedules of today may still hold OFF jobs for running units
    const previous = await tx.acSchedule.findMany({
      where: { dateKey: todayKey },
      include: { jobs: true },
    });
    const { keepOff, cancel } = splitPendingJobs(previous.flatMap((schedule) => schedule.jobs));

    const schedule = await tx.acSchedule.create({
      data: {
        dateKey: todayKey,
        fileName: parsed.data.fileName,
        createdById: user.id,
        createdByEmail: user.email,
        summary: {
          totalRows: plan.totalRows,
          buildingRows: plan.buildingRows,
          skipped: plan.skipped.length,
          unmappedRooms: plan.unmappedRooms,
          windows: plan.windows.length,
          units: plan.unitCount,
          peakConcurrentUnits: plan.peakConcurrentUnits,
        } satisfies Prisma.InputJsonValue,
      },
    });

    if (previous.length > 0) {
      await tx.acSchedule.updateMany({
        where: { id: { in: previous.map((item) => item.id) }, status: "ACTIVE" },
        data: { status: "SUPERSEDED", endedAt: new Date() },
      });
      await tx.acJob.updateMany({
        where: { id: { in: cancel.map((job) => job.id) } },
        data: { status: "CANCELLED", result: "Lịch mới thay thế" },
      });

      // A unit already switched on by the old schedule: the new schedule
      // takes over if it still needs the unit then, else keep the old OFF.
      for (const job of keepOff) {
        const offMinutes = getAcNowMinutes(job.runAt);
        const coveredByNew = plan.windows.some(
          (window) =>
            window.unitId === job.unitId &&
            window.onAtMinutes <= offMinutes &&
            offMinutes < window.offAtMinutes,
        );

        await tx.acJob.update({
          where: { id: job.id },
          data: coveredByNew
            ? { status: "CANCELLED", result: "Lịch mới tiếp tục dùng máy" }
            : { scheduleId: schedule.id },
        });
      }
    }

    await tx.acJob.createMany({
      data: timings.flatMap(({ window, timing }) => {
        const tooLate = timing.kind === "too-late";
        const base = {
          scheduleId: schedule.id,
          unitId: window.unitId,
          windowStart: acLocalTimeToDate(todayKey, window.classStartMinutes),
          windowEnd: acLocalTimeToDate(todayKey, window.classEndMinutes),
          roomCodes: window.roomCodes,
          status: tooLate ? ("SKIPPED" as const) : ("PENDING" as const),
          result: tooLate ? "Quá muộn khi kích hoạt" : null,
        };

        return [
          { ...base, action: "ON" as const, runAt: acLocalTimeToDate(todayKey, window.onAtMinutes) },
          { ...base, action: "OFF" as const, runAt: acLocalTimeToDate(todayKey, window.offAtMinutes) },
        ];
      }),
    });
  });

  const late = timings.filter(({ timing }) => timing.kind === "late");
  const tooLate = timings.filter(({ timing }) => timing.kind === "too-late");

  await logAcEvent({
    actor,
    message:
      `Kích hoạt lịch ${formatDateKey(todayKey)} (${parsed.data.fileName}): ${plan.unitCount} máy, ${plan.windows.length} khung giờ` +
      (late.length ? `, ${late.length} khung sẽ bật trễ` : "") +
      (config.dryRun ? ". Chế độ chạy thử: agent chỉ ghi log." : "."),
  });

  for (const { window } of tooLate) {
    await logAcEvent({
      level: "WARN",
      actor,
      unitName: window.unitName,
      message: `Không bật ${describeWindow(window)}: còn chưa tới ${config.minRemainingMinutes} phút là hết giờ học.`,
    });
  }

  revalidateAc();
  return { success: true };
}

function describeWindow(window: AcWindow) {
  return `${window.unitName} (${window.roomCodes.join(", ")}, ${formatMinutes(window.classStartMinutes)}–${formatMinutes(window.classEndMinutes)})`;
}

export async function cancelAcSchedule(scheduleId: string): Promise<AcActionResult> {
  const user = await requireOperator();
  if (!user) return fail("Tài khoản chưa được cấp quyền điều khiển máy lạnh.");

  const schedule = await prisma.acSchedule.findUnique({
    where: { id: String(scheduleId) },
    include: { jobs: true },
  });
  if (!schedule || schedule.status !== "ACTIVE") return fail("Lịch không còn hiệu lực.");

  const { keepOff, cancel } = splitPendingJobs(schedule.jobs);

  await prisma.$transaction([
    prisma.acSchedule.update({
      where: { id: schedule.id },
      data: { status: "CANCELLED", endedAt: new Date() },
    }),
    prisma.acJob.updateMany({
      where: { id: { in: cancel.map((job) => job.id) } },
      data: { status: "CANCELLED", result: `Huỷ bởi ${user.email}` },
    }),
  ]);

  await logAcEvent({
    level: "WARN",
    actor: user.email,
    message:
      `Huỷ lịch ${formatDateKey(schedule.dateKey)}: huỷ ${cancel.length} lệnh` +
      (keepOff.length ? `, giữ ${keepOff.length} lệnh tắt cho máy đang chạy.` : "."),
  });

  revalidateAc();
  return { success: true };
}

export async function cancelAcJob(jobId: string): Promise<AcActionResult> {
  const user = await requireOperator();
  if (!user) return fail("Tài khoản chưa được cấp quyền điều khiển máy lạnh.");

  const job = await prisma.acJob.findUnique({
    where: { id: String(jobId) },
    include: { unit: { select: { name: true } } },
  });
  if (!job || job.status !== "PENDING") return fail("Lệnh này không còn chờ chạy.");

  // Cancelling a turn-on also drops its turn-off: nothing to switch off
  const ids = [job.id];
  if (job.action === "ON") {
    const pairedOff = await prisma.acJob.findFirst({
      where: {
        scheduleId: job.scheduleId,
        unitId: job.unitId,
        windowStart: job.windowStart,
        action: "OFF",
        status: "PENDING",
      },
    });
    if (pairedOff) ids.push(pairedOff.id);
  }

  await prisma.acJob.updateMany({
    where: { id: { in: ids }, status: "PENDING" },
    data: { status: "CANCELLED", result: `Huỷ bởi ${user.email}` },
  });

  await logAcEvent({
    level: job.action === "OFF" ? "WARN" : "INFO",
    actor: user.email,
    unitName: job.unit.name,
    message:
      job.action === "ON"
        ? `Huỷ lệnh bật ${job.unit.name}.`
        : `Huỷ lệnh tắt ${job.unit.name}: máy sẽ không được tắt tự động.`,
  });

  revalidateAc();
  return { success: true };
}

// Any operator may stop everything; only an admin may resume
export async function setAcPaused(paused: boolean): Promise<AcActionResult> {
  const user = paused ? await requireOperator() : await requireAdminUser();
  if (!user) return fail(paused ? "Không có quyền." : "Chỉ admin được bật lại hệ thống.");

  const config = await getAcSchedulerConfig();
  await saveConfig({ ...config, paused: Boolean(paused) }, user.id);

  await logAcEvent({
    level: paused ? "ERROR" : "INFO",
    actor: user.email,
    message: paused ? "DỪNG KHẨN CẤP: agent ngừng gửi mọi lệnh." : "Bật lại hệ thống điều khiển tự động.",
  });

  revalidateAc();
  return { success: true };
}

// ---------- admin ----------

async function saveConfig(value: unknown, userId: string) {
  const data = acSchedulerConfigSchema.parse(value) as unknown as Prisma.InputJsonValue;

  await prisma.toolSetting.upsert({
    where: { key: AC_SCHEDULER_SETTINGS_KEY },
    update: { value: data, updatedBy: userId },
    create: { key: AC_SCHEDULER_SETTINGS_KEY, value: data, updatedBy: userId },
  });
}

export async function saveAcSchedulerConfig(input: unknown): Promise<AcActionResult> {
  const user = await requireAdminUser();
  if (!user) return fail("Chỉ admin được sửa cấu hình.");

  const current = await getAcSchedulerConfig();
  const parsed = acSchedulerConfigSchema.safeParse({
    ...current,
    ...(typeof input === "object" && input ? input : {}),
    // The kill switch has its own action and log entry
    paused: current.paused,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Cấu hình không hợp lệ.");

  await saveConfig(parsed.data, user.id);

  if (parsed.data.dryRun !== current.dryRun) {
    await logAcEvent({
      level: "WARN",
      actor: user.email,
      message: parsed.data.dryRun
        ? "Chuyển sang chạy thử: agent chỉ ghi log, không gửi lệnh."
        : "Tắt chạy thử: agent sẽ gửi lệnh thật tới máy lạnh.",
    });
  }

  revalidateAc();
  return { success: true };
}

export async function saveAcUnits(csvText: string): Promise<AcActionResult> {
  const user = await requireAdminUser();
  if (!user) return fail("Chỉ admin được sửa danh sách máy.");

  let units;
  try {
    units = parseAcUnitsCsv(String(csvText ?? ""));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Không đọc được danh sách máy.");
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.acUnit.findMany({ select: { id: true, itmIp: true, floorName: true, unitIndex: true } });
    const keptIds = new Set<string>();

    for (const unit of units) {
      const saved = await tx.acUnit.upsert({
        where: {
          itmIp_floorName_unitIndex: { itmIp: unit.itmIp, floorName: unit.floorName, unitIndex: unit.unitIndex },
        },
        update: { name: unit.name, roomCodes: unit.roomCodes, enabled: true },
        create: { ...unit, enabled: true },
      });
      keptIds.add(saved.id);
    }

    // Rows removed from the list are disabled, not deleted, to keep history
    await tx.acUnit.updateMany({
      where: { id: { in: existing.filter((unit) => !keptIds.has(unit.id)).map((unit) => unit.id) } },
      data: { enabled: false },
    });
  });

  await logAcEvent({ actor: user.email, message: `Cập nhật danh sách máy lạnh: ${units.length} máy.` });

  revalidateAc();
  return { success: true, message: `Đã lưu ${units.length} máy.` };
}

export async function setAcOperator(userId: string, grant: boolean): Promise<AcActionResult> {
  const admin = await requireAdminUser();
  if (!admin) return fail("Chỉ admin được cấp quyền.");

  const target = await prisma.user.findUnique({ where: { id: String(userId) }, select: { id: true, email: true } });
  if (!target) return fail("Không tìm thấy tài khoản.");

  const role = await prisma.role.upsert({
    where: { name: AC_OPERATOR_ROLE },
    update: {},
    create: { name: AC_OPERATOR_ROLE, description: "Can import and activate AC schedules" },
  });

  if (grant) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: target.id, roleId: role.id } },
      update: {},
      create: { userId: target.id, roleId: role.id },
    });
  } else {
    await prisma.userRole.deleteMany({ where: { userId: target.id, roleId: role.id } });
  }

  await logAcEvent({
    actor: admin.email,
    message: `${grant ? "Cấp" : "Thu hồi"} quyền điều khiển máy lạnh cho ${target.email}.`,
  });

  revalidateAc();
  return { success: true };
}

export async function createAcAgent(
  name: string,
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  const admin = await requireAdminUser();
  if (!admin) return { success: false, error: "Chỉ admin được tạo agent." };

  const label = String(name ?? "").trim().slice(0, 60);
  if (!label) return { success: false, error: "Cần đặt tên cho agent." };

  const token = generateAgentToken();
  await prisma.acAgent.create({ data: { name: label, tokenHash: hashAgentToken(token) } });
  await logAcEvent({ actor: admin.email, message: `Tạo token cho agent "${label}".` });

  revalidateAc();
  // Shown once; only the hash is stored
  return { success: true, token };
}

export async function revokeAcAgent(agentId: string): Promise<AcActionResult> {
  const admin = await requireAdminUser();
  if (!admin) return fail("Chỉ admin được thu hồi agent.");

  const agent = await prisma.acAgent.update({
    where: { id: String(agentId) },
    data: { revokedAt: new Date() },
  });
  await logAcEvent({ level: "WARN", actor: admin.email, message: `Thu hồi token agent "${agent.name}".` });

  revalidateAc();
  return { success: true };
}
