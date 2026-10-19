"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileSpreadsheet, Power, Upload, X } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { activateAcSchedule } from "@/actions/ac";
import type { AcSchedulerConfig } from "@/tools/ac-scheduler/config";
import { readAcScheduleFile, type AcScheduleRow } from "@/tools/ac-scheduler/parser";
import {
  AC_SKIP_REASON_LABELS,
  buildAcPlan,
  classifyTurnOn,
  formatDateKey,
  formatMinutes,
  getAcNowMinutes,
  type AcPlan,
  type AcSkipReason,
  type AcUnitRef,
} from "@/tools/ac-scheduler/plan";

interface AcImportPanelProps {
  todayKey: string;
  config: AcSchedulerConfig;
  units: AcUnitRef[];
  hasActiveSchedule: boolean;
}

interface LoadedFile {
  fileName: string;
  rows: AcScheduleRow[];
}

export function AcImportPanel({ todayKey, config, units, hasActiveSchedule }: AcImportPanelProps) {
  const router = useRouter();
  const [loaded, setLoaded] = useState<LoadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmPeak, setConfirmPeak] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Preview with the same rules the server re-runs on activation
  const preview = useMemo((): { plan: AcPlan } | { error: string } | null => {
    if (!loaded) return null;
    try {
      return { plan: buildAcPlan(loaded.rows, { todayKey, units, config }) };
    } catch (planError) {
      return { error: planError instanceof Error ? planError.message : "Không đọc được lịch." };
    }
  }, [loaded, todayKey, units, config]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setConfirmPeak(false);
    try {
      setLoaded(await readAcScheduleFile(file));
    } catch (readError) {
      setLoaded(null);
      setError(readError instanceof Error ? readError.message : "Không đọc được file.");
    }
  }

  function activate() {
    if (!loaded) return;
    setError(null);
    startTransition(async () => {
      const result = await activateAcSchedule({ ...loaded, confirmPeak });
      if (result.success) {
        setLoaded(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const plan = preview && "plan" in preview ? preview.plan : null;
  const nowMinutes = getAcNowMinutes();
  const overPeak = plan ? plan.peakConcurrentUnits > config.maxConcurrentUnits : false;

  return (
    <Card as="section" aria-labelledby="ac-import-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="ac-import-title" className="text-lg font-semibold text-ink">
            Nhập lịch hôm nay ({formatDateKey(todayKey)})
          </h2>
          <p className="text-sm text-muted">
            Bật trước {config.leadMinutes} phút, tắt đúng giờ kết thúc. Chỉ phòng E1 có máy lạnh.
          </p>
        </div>
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-sunken focus-within:ring-2 focus-within:ring-accent">
          <Upload size={16} aria-hidden="true" />
          {loaded ? "Đổi file" : "Chọn file Excel"}
          <input type="file" accept=".xls,.xlsx" className="sr-only" onChange={handleFile} />
        </label>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}
      {preview && "error" in preview && <Alert tone="danger">{preview.error}</Alert>}

      {plan && loaded && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <FileSpreadsheet size={16} aria-hidden="true" />
            <span className="font-medium text-ink">{loaded.fileName}</span>
            <span>· {plan.totalRows} dòng · {plan.buildingRows} dòng E1</span>
            <span>· {plan.unitCount} máy · {plan.windows.length} khung giờ</span>
            <span>· cao nhất {plan.peakConcurrentUnits} máy cùng lúc</span>
          </div>

          {plan.noteWarnings.length > 0 && (
            <Alert tone="warn">
              Ghi chú lạ, hãy đọc lại trước khi kích hoạt:
              <ul className="mt-1 list-disc pl-5">
                {plan.noteWarnings.map((item) => (
                  <li key={item.rowNumber}>
                    Dòng {item.rowNumber} · {item.roomCode}: “{item.note}”
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-sunken text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">Máy</th>
                  <th className="px-3 py-2">Phòng</th>
                  <th className="px-3 py-2">Giờ học</th>
                  <th className="px-3 py-2">Bật</th>
                  <th className="px-3 py-2">Tắt</th>
                  <th className="px-3 py-2">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {plan.windows.map((window) => {
                  const timing = classifyTurnOn(nowMinutes, window, config);
                  return (
                    <tr key={`${window.unitId}-${window.onAtMinutes}`} className="border-t border-line">
                      <td className="px-3 py-2 font-medium text-ink">{window.unitName}</td>
                      <td className="px-3 py-2">{window.roomCodes.join(", ")}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatMinutes(window.classStartMinutes)}–{formatMinutes(window.classEndMinutes)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{formatMinutes(window.onAtMinutes)}</td>
                      <td className="px-3 py-2 tabular-nums">{formatMinutes(window.offAtMinutes)}</td>
                      <td className="px-3 py-2">
                        {timing.kind === "late" && <Badge tone="warn">Bật trễ {timing.lateMinutes}′</Badge>}
                        {timing.kind === "too-late" && <Badge tone="danger">Quá muộn, không bật</Badge>}
                        {window.rowNumbers.length > 1 && <Badge className="ml-1">Gộp {window.rowNumbers.length} ca</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <SkippedList plan={plan} />

          {overPeak && (
            <label className="flex items-start gap-2 rounded-lg border border-warn/40 bg-warn-soft p-3 text-sm text-ink">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmPeak}
                onChange={(event) => setConfirmPeak(event.target.checked)}
              />
              Có lúc {plan.peakConcurrentUnits} máy chạy cùng lúc, vượt ngưỡng {config.maxConcurrentUnits}. Tôi đã kiểm tra và
              xác nhận số lượng này.
            </label>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={activate}
              loading={isPending}
              disabled={plan.windows.length === 0 || (overPeak && !confirmPeak) || config.paused}
              leftIcon={<Power size={16} aria-hidden="true" />}
            >
              Kích hoạt lịch
            </Button>
            <Button variant="ghost" onClick={() => setLoaded(null)} leftIcon={<X size={16} aria-hidden="true" />}>
              Bỏ file
            </Button>
            {hasActiveSchedule && (
              <span className="text-sm text-warn">
                Đã có lịch hôm nay: kích hoạt sẽ thay lịch cũ (máy đang chạy vẫn được tắt đúng giờ).
              </span>
            )}
            {config.dryRun && <Badge tone="accent">Chạy thử: agent chỉ ghi log</Badge>}
          </div>
        </div>
      )}
    </Card>
  );
}

function SkippedList({ plan }: { plan: AcPlan }) {
  const groups = new Map<AcSkipReason, AcPlan["skipped"]>();
  plan.skipped.forEach((item) => {
    groups.set(item.reason, [...(groups.get(item.reason) ?? []), item]);
  });

  if (groups.size === 0) return null;

  return (
    <details className="rounded-lg border border-line bg-sunken p-3 text-sm">
      <summary className="cursor-pointer font-medium text-ink">
        {plan.skipped.length} dòng không bật máy lạnh
      </summary>
      <div className="mt-2 space-y-2">
        {[...groups.entries()].map(([reason, items]) => (
          <p key={reason} className="text-muted">
            <span className="font-medium text-ink">
              {AC_SKIP_REASON_LABELS[reason]} ({items.length}):
            </span>{" "}
            {[...new Set(items.map((item) => item.roomCode))].join(", ")}
          </p>
        ))}
      </div>
    </details>
  );
}

function Alert({ tone, children }: { tone: "danger" | "warn"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={
        tone === "danger"
          ? "flex gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-ink"
          : "flex gap-2 rounded-lg border border-warn/30 bg-warn-soft p-3 text-sm text-ink"
      }
    >
      <AlertTriangle size={16} className={tone === "danger" ? "mt-0.5 shrink-0 text-danger" : "mt-0.5 shrink-0 text-warn"} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
