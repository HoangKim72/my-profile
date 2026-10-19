"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XOctagon, Play, Radio, Snowflake, X } from "lucide-react";
import { Badge, Button, Card, type BadgeTone } from "@/components/ui";
import { AcImportPanel } from "@/components/tools/AcImportPanel";
import { cancelAcJob, cancelAcSchedule, setAcPaused } from "@/actions/ac";
import { createClient } from "@/lib/supabase/client";
import type { AcSchedulerConfig } from "@/tools/ac-scheduler/config";
import {
  AC_JOB_STATUS_LABELS,
  formatAcClock,
  type AcViewAgent,
  type AcViewEvent,
  type AcViewJob,
  type AcViewJobStatus,
  type AcViewSchedule,
  type AcViewUnit,
} from "@/tools/ac-scheduler/view";

const AGENT_ONLINE_MS = 90_000;
const MAX_EVENTS = 200;

const STATUS_TONES: Record<AcViewJobStatus, BadgeTone> = {
  PENDING: "neutral",
  RUNNING: "accent",
  DONE: "success",
  SKIPPED: "warn",
  FAILED: "danger",
  CANCELLED: "neutral",
};

const LEVEL_CLASSES: Record<AcViewEvent["level"], string> = {
  INFO: "text-ink",
  WARN: "text-warn",
  ERROR: "text-danger font-medium",
};

interface AcSchedulerWorkspaceProps {
  todayKey: string;
  config: AcSchedulerConfig;
  canOperate: boolean;
  isAdmin: boolean;
  schedules: AcViewSchedule[];
  jobs: AcViewJob[];
  events: AcViewEvent[];
  units: AcViewUnit[];
  agents: AcViewAgent[];
}

export function AcSchedulerWorkspace(props: AcSchedulerWorkspaceProps) {
  const { todayKey, config, canOperate, isAdmin, schedules, jobs, agents } = props;
  const router = useRouter();
  // Realtime rows received since the last server render, merged below
  const [liveEvents, setLiveEvents] = useState<AcViewEvent[]>([]);
  const [liveUnits, setLiveUnits] = useState<Record<string, Pick<AcViewUnit, "isRunning" | "stateAt">>>({});
  const [live, setLive] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Realtime: new log lines and unit states are applied in place; job
  // changes need the unit name, so they trigger a (debounced) refresh.
  useEffect(() => {
    const supabase = createClient();
    const scheduleRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 800);
    };

    const channel = supabase
      .channel("ac-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ac_events" }, (payload) => {
        const row = payload.new as AcViewEvent & { createdAt: string };
        setLiveEvents((current) =>
          [{ ...row, createdAt: fromDbTimestamp(row.createdAt)! }, ...current].slice(0, MAX_EVENTS),
        );
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "ac_units" }, (payload) => {
        const row = payload.new as AcViewUnit;
        setLiveUnits((current) => ({
          ...current,
          [row.id]: { isRunning: row.isRunning, stateAt: fromDbTimestamp(row.stateAt) },
        }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ac_jobs" }, scheduleRefresh)
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  // Agent heartbeat is not pushed; re-read the page once a minute
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    const refresh = setInterval(() => router.refresh(), 60_000);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [router]);

  const onlineAgent = agents.find(
    (agent) => agent.lastSeenAt && now - new Date(agent.lastSeenAt).getTime() < AGENT_ONLINE_MS,
  );
  const lastSeen = agents.find((agent) => agent.lastSeenAt)?.lastSeenAt ?? null;
  const activeSchedule = schedules.find((schedule) => schedule.status === "ACTIVE") ?? null;
  const events = useMemo(() => {
    const seen = new Set<string>();
    return [...liveEvents, ...props.events]
      .filter((event) => !seen.has(event.id) && Boolean(seen.add(event.id)))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, MAX_EVENTS);
  }, [liveEvents, props.events]);
  const enabledUnits = useMemo(
    () =>
      props.units
        .filter((unit) => unit.enabled)
        .map((unit) => {
          const live = liveUnits[unit.id];
          // Keep whichever state is newer: the realtime push or the server render
          return live && (live.stateAt ?? "") >= (unit.stateAt ?? "") ? { ...unit, ...live } : unit;
        }),
    [props.units, liveUnits],
  );
  const planUnits = useMemo(
    () => enabledUnits.map((unit) => ({ id: unit.id, name: unit.name, roomCodes: unit.roomCodes })),
    [enabledUnits],
  );
  const runningCount = enabledUnits.filter((unit) => unit.isRunning).length;

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setActionError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) setActionError(result.error ?? "Không thực hiện được.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card padding="sm" className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatusDot ok={Boolean(onlineAgent)} />
        <span className="text-sm text-ink">
          {onlineAgent
            ? `Agent “${onlineAgent.name}” đang kết nối`
            : lastSeen
              ? `Agent mất kết nối từ ${formatAcClock(lastSeen)}`
              : "Chưa có agent nào kết nối"}
        </span>
        <span className="inline-flex items-center gap-1 text-sm text-muted">
          <Radio size={14} aria-hidden="true" className={live ? "text-success" : "text-muted"} />
          {live ? "Log trực tiếp" : "Đang nối log trực tiếp…"}
        </span>
        <span className="inline-flex items-center gap-1 text-sm text-muted">
          <Snowflake size={14} aria-hidden="true" />
          {runningCount}/{enabledUnits.length} máy đang chạy
        </span>
        {config.dryRun && <Badge tone="accent">Chạy thử</Badge>}
        {config.paused && <Badge tone="danger">Đang dừng khẩn cấp</Badge>}
        <div className="ml-auto flex gap-2">
          {canOperate && !config.paused && (
            <Button
              variant="danger"
              size="sm"
              loading={isPending}
              leftIcon={<XOctagon size={16} aria-hidden="true" />}
              onClick={() => {
                if (window.confirm("Dừng khẩn cấp: agent sẽ ngừng gửi mọi lệnh. Tiếp tục?")) run(() => setAcPaused(true));
              }}
            >
              Dừng khẩn cấp
            </Button>
          )}
          {isAdmin && config.paused && (
            <Button size="sm" loading={isPending} leftIcon={<Play size={16} aria-hidden="true" />} onClick={() => run(() => setAcPaused(false))}>
              Bật lại
            </Button>
          )}
        </div>
      </Card>

      {actionError && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-ink">
          {actionError}
        </p>
      )}

      {canOperate ? (
        <AcImportPanel todayKey={todayKey} config={config} units={planUnits} hasActiveSchedule={Boolean(activeSchedule)} />
      ) : (
        <p className="rounded-lg border border-line bg-sunken p-3 text-sm text-muted">
          Bạn đang ở chế độ chỉ xem. Nhờ admin cấp quyền điều khiển máy lạnh để nhập lịch.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card as="section" aria-labelledby="ac-jobs-title" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="ac-jobs-title" className="text-lg font-semibold text-ink">
              Lệnh hôm nay
            </h2>
            {activeSchedule && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <span>
                  {activeSchedule.fileName} · {activeSchedule.createdByEmail} · {formatAcClock(activeSchedule.createdAt)}
                </span>
                {canOperate && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={isPending}
                    onClick={() => {
                      if (window.confirm("Huỷ lịch hôm nay? Máy đang chạy vẫn được tắt đúng giờ.")) {
                        run(() => cancelAcSchedule(activeSchedule.id));
                      }
                    }}
                  >
                    Huỷ lịch
                  </Button>
                )}
              </div>
            )}
          </div>

          {jobs.length === 0 ? (
            <p className="text-sm text-muted">Chưa có lịch nào được kích hoạt hôm nay.</p>
          ) : (
            <div className="max-h-[480px] overflow-auto rounded-lg border border-line">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="sticky top-0 bg-sunken text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">Giờ</th>
                    <th className="px-3 py-2">Lệnh</th>
                    <th className="px-3 py-2">Máy · phòng</th>
                    <th className="px-3 py-2">Trạng thái</th>
                    <th className="px-3 py-2 sr-only">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-t border-line align-top">
                      <td className="px-3 py-2 tabular-nums">{formatAcClock(job.runAt)}</td>
                      <td className="px-3 py-2">{job.action === "ON" ? "Bật" : "Tắt"}</td>
                      <td className="px-3 py-2">
                        <span className="font-medium text-ink">{job.unitName}</span>
                        <span className="block text-xs text-muted">{job.roomCodes.join(", ")}</span>
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={STATUS_TONES[job.status]}>{AC_JOB_STATUS_LABELS[job.status]}</Badge>
                        {job.result && <span className="mt-1 block text-xs text-muted">{job.result}</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canOperate && job.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Huỷ lệnh ${job.action === "ON" ? "bật" : "tắt"} ${job.unitName}`}
                            onClick={() => run(() => cancelAcJob(job.id))}
                          >
                            <X size={16} aria-hidden="true" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card as="section" aria-labelledby="ac-log-title" className="space-y-3">
          <h2 id="ac-log-title" className="text-lg font-semibold text-ink">
            Nhật ký
          </h2>
          <ol className="max-h-[480px] space-y-2 overflow-auto font-mono text-xs" aria-live="polite">
            {events.length === 0 && <li className="text-muted">Chưa có nhật ký.</li>}
            {events.map((event) => (
              <li key={event.id} className="border-b border-line pb-2 last:border-0">
                <span className="text-muted">{formatAcClock(event.createdAt, true)}</span>{" "}
                <span className={LEVEL_CLASSES[event.level]}>{event.message}</span>
                {event.actor && <span className="block text-muted">{event.actor}</span>}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {enabledUnits.length > 0 && (
        <Card as="section" aria-labelledby="ac-units-title" className="space-y-3">
          <h2 id="ac-units-title" className="text-lg font-semibold text-ink">
            Trạng thái máy
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {enabledUnits.map((unit) => (
              <li key={unit.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <StatusDot ok={unit.isRunning === true} unknown={unit.isRunning === null} />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{unit.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {unit.isRunning === null ? "Chưa rõ" : unit.isRunning ? "Đang chạy" : "Đang tắt"}
                    {unit.stateAt ? ` · ${formatAcClock(unit.stateAt)}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// Realtime sends Prisma's `timestamp(3)` columns without a zone; they are UTC
function fromDbTimestamp(value: string | null) {
  if (!value) return null;
  return new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`).toISOString();
}

function StatusDot({ ok, unknown = false }: { ok: boolean; unknown?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${unknown ? "bg-line-strong" : ok ? "bg-success" : "bg-danger"}`}
    />
  );
}
