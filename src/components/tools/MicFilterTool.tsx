"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BatteryCharging,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  ImageDown,
  Loader,
  RefreshCcw,
  Sun,
  Sunrise,
  Table2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  buildAlarmSchedulePlan,
  getSpecialAlarmOfferState,
} from "@/tools/mic-filter/alarm";
import { ACCEPTED_EXCEL_EXTENSIONS } from "@/tools/mic-filter/constants";
import { formatClockValue, type MicFilterConfig } from "@/tools/mic-filter/config";
import { buildMiddayExportTable } from "@/tools/mic-filter/export";
import { processMicFilterFile } from "@/tools/mic-filter/processor";
import {
  createEmptySummary,
  getDayKey,
  MIC_SESSION_STORAGE_KEY,
  parseMicSession,
  serializeMicSession,
  type MicSession,
  type ShiftSummaryState,
} from "@/tools/mic-filter/session";
import { ShiftSummaryPanel } from "@/components/tools/ShiftSummaryPanel";
import {
  copyOrDownloadImage,
  renderTableImage,
} from "@/components/tools/table-image";
import type {
  MicFilterReport,
  SpecialAlarmCandidate,
} from "@/tools/mic-filter/types";

type ToastTone = "success" | "info" | "error";

interface ToastState {
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ScheduledAlarmState {
  status: "scheduled" | "triggered";
  scheduledForLabel: string;
}

type MicFilterTab = "filter" | "shift-summary";

type CountField =
  | "acIncrease"
  | "acDecrease"
  | "usedBatteryCount"
  | "extraBatteryCount";

type DetailField = "roomFeedbackDetails" | "borrowedItemDetails";

const FILE_INPUT_ID = "mic-filter-upload";

export function MicFilterTool({ config }: { config: MicFilterConfig }) {
  const [tab, setTab] = useState<MicFilterTab>("filter");
  const [report, setReport] = useState<MicFilterReport | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [scheduledAlarms, setScheduledAlarms] = useState<
    Record<string, ScheduledAlarmState>
  >({});
  const [summary, setSummary] = useState<ShiftSummaryState>(() =>
    createEmptySummary(new Date()),
  );
  const [sessionDayKey, setSessionDayKey] = useState(() =>
    getDayKey(new Date()),
  );
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const alarmTimeoutsRef = useRef<Map<string, number>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  const reportStudyDateLabel = report?.studyDateLabel ?? null;
  const { hasEditedSummaryDate } = summary;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 4_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  useEffect(() => {
    if (reportStudyDateLabel && !hasEditedSummaryDate) {
      setSummary((current) =>
        current.summaryDate === reportStudyDateLabel
          ? current
          : { ...current, summaryDate: reportStudyDateLabel },
      );
    }
  }, [hasEditedSummaryDate, reportStudyDateLabel]);

  // Restore today's session after mount (localStorage is not available
  // during server rendering)
  useEffect(() => {
    const now = new Date();
    const stored = parseMicSession(readStoredSession(), now);

    if (stored) {
      setReport(stored.report);
      setSummary(stored.summary);
    }

    setSessionDayKey(getDayKey(now));
    setIsSessionLoaded(true);
  }, []);

  useEffect(() => {
    if (!isSessionLoaded) {
      return;
    }

    writeStoredSession({
      version: 1,
      dayKey: sessionDayKey,
      report,
      summary,
    });
  }, [isSessionLoaded, sessionDayKey, report, summary]);

  // A tab left open overnight starts the new day with a clean session
  useEffect(() => {
    const todayKey = getDayKey(currentTime);

    if (!isSessionLoaded || todayKey === sessionDayKey) {
      return;
    }

    alarmTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    alarmTimeoutsRef.current.clear();
    setReport(null);
    setSummary(createEmptySummary(currentTime));
    setScheduledAlarms({});
    setFileError(null);
    setSessionDayKey(todayKey);
  }, [currentTime, isSessionLoaded, sessionDayKey]);

  useEffect(() => {
    const alarmTimeouts = alarmTimeoutsRef.current;

    return () => {
      alarmTimeouts.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      alarmTimeouts.clear();

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
      }
    };
  }, []);

  const alarmLines = report
    ? report.specialAlarmCandidates.filter((candidate) => {
        const offerState = getSpecialAlarmOfferState(candidate, currentTime);

        return offerState.reason !== "too-late" || Boolean(scheduledAlarms[candidate.id]);
      })
    : [];

  return (
    <div className="space-y-5">
      <ToastNotice toast={toast} onClose={() => setToast(null)} />

      <input
        key={inputKey}
        id={FILE_INPUT_ID}
        type="file"
        accept={ACCEPTED_EXCEL_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />

      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Lọc mic</h1>
        {reportStudyDateLabel && (
          <span className="text-sm text-mic-muted">
            Ngày học {reportStudyDateLabel}
          </span>
        )}
        {report && (
          <div className="ml-auto flex min-w-0 items-center gap-3 text-sm text-mic-muted">
            <span className="max-w-60 truncate font-[family-name:var(--font-mic-mono)]">
              {report.fileName}
            </span>
            <label
              htmlFor={FILE_INPUT_ID}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-mic-line-strong bg-mic-surface px-2.5 text-[13px] font-semibold text-mic-ink transition hover:border-mic-primary"
            >
              {isLoading ? (
                <Loader size={15} className="animate-spin" />
              ) : (
                <RefreshCcw size={15} />
              )}
              Đổi file
            </label>
          </div>
        )}
      </header>

      <div role="tablist" className="flex gap-1 border-b border-mic-line-strong">
        <TabButton
          isActive={tab === "filter"}
          icon={<Table2 size={18} />}
          label="Lọc mic"
          onClick={() => setTab("filter")}
        />
        <TabButton
          isActive={tab === "shift-summary"}
          icon={<ClipboardCheck size={18} />}
          label="Kết ca"
          onClick={() => setTab("shift-summary")}
        />
      </div>

      {tab === "shift-summary" ? (
        <ShiftSummaryPanel
          summary={summary}
          reportDateLabel={reportStudyDateLabel}
          onShiftChange={(nextShift) => updateSummary({ shift: nextShift })}
          onSummaryDateChange={(value) => {
            updateSummary({ summaryDate: value, hasEditedSummaryDate: true });
          }}
          onUseReportDate={
            reportStudyDateLabel
              ? () => {
                  updateSummary({
                    summaryDate: reportStudyDateLabel,
                    hasEditedSummaryDate: false,
                  });
                }
              : undefined
          }
          onAdjustCount={adjustCount}
          onAddDetail={(field) => updateDetailList(field, (items) => [...items, ""])}
          onUpdateDetail={(field, index, value) =>
            updateDetailList(field, (items) =>
              items.map((item, itemIndex) => (itemIndex === index ? value : item)),
            )
          }
          onRemoveDetail={(field, index) =>
            updateDetailList(field, (items) =>
              items.filter((_, itemIndex) => itemIndex !== index),
            )
          }
          onResetSummary={handleResetSummary}
        />
      ) : !report ? (
        <DropZone
          isLoading={isLoading}
          fileError={fileError}
          onFile={(file) => void processFile(file)}
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <MorningCard report={report} />

          <div className="grid min-w-0 gap-2.5">
            {alarmLines.map((candidate) => (
              <AlarmLine
                key={candidate.id}
                candidate={candidate}
                currentTime={currentTime}
                scheduledAlarm={scheduledAlarms[candidate.id]}
                onSchedule={() => void handleScheduleAlarm(candidate)}
                onCancel={() => handleCancelAlarm(candidate)}
              />
            ))}
            <MiddayCard report={report} onCopyImage={handleCopyMiddayImage} />
          </div>
        </div>
      )}
    </div>
  );

  async function processFile(file: File) {
    clearAllAlarmTimeouts();
    setScheduledAlarms({});
    setIsLoading(true);
    setReport(null);
    setFileError(null);
    setToast(null);

    try {
      const nextReport = await processMicFilterFile(file, config);

      setReport(nextReport);
      setToast({
        tone: "success",
        title: nextReport.studyDateLabel
          ? `Đã lọc lịch ngày ${nextReport.studyDateLabel}.`
          : "Đã lọc xong file.",
      });
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : "Không thể xử lý file Excel.",
      );
      setInputKey((current) => current + 1);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.currentTarget.value = "";

    if (file) {
      setTab("filter");
      void processFile(file);
    }
  }

  function clearAllAlarmTimeouts() {
    alarmTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    alarmTimeoutsRef.current.clear();
  }

  function updateSummary(patch: Partial<ShiftSummaryState>) {
    setSummary((current) => ({ ...current, ...patch }));
  }

  function adjustCount(field: CountField, delta: number) {
    setSummary((current) => ({
      ...current,
      [field]: Math.max(0, current[field] + delta),
    }));
  }

  function updateDetailList(
    field: DetailField,
    update: (items: string[]) => string[],
  ) {
    setSummary((current) => ({ ...current, [field]: update(current[field]) }));
  }

  function handleResetSummary() {
    const freshSummary = createEmptySummary(new Date());

    setSummary({
      ...freshSummary,
      shift: summary.shift,
      summaryDate: reportStudyDateLabel ?? freshSummary.summaryDate,
    });
    setToast({ tone: "info", title: "Đã xoá số liệu kết ca." });
  }

  async function handleCopyMiddayImage() {
    if (!report) {
      return;
    }

    try {
      const blob = await renderTableImage(buildMiddayExportTable(report));
      const result = await copyOrDownloadImage(
        blob,
        `thu-phat-trua-${sessionDayKey}.png`,
      );

      setToast({
        tone: "success",
        title:
          result === "copied" ? "Đã copy ảnh bảng." : "Đã tải ảnh bảng về máy.",
        description:
          result === "copied"
            ? "Dán (Ctrl+V) vào Zalo để gửi."
            : "Trình duyệt không cho copy ảnh nên ảnh được lưu thành file PNG.",
      });
    } catch {
      setToast({
        tone: "error",
        title: "Chưa xuất được ảnh.",
        description: "Trình duyệt đã chặn thao tác. Hãy thử lại.",
      });
    }
  }

  async function handleScheduleAlarm(candidate: SpecialAlarmCandidate) {
    if (!report) {
      return;
    }

    const offerState = getSpecialAlarmOfferState(candidate, new Date());

    if (!offerState.shouldShow) {
      setToast({
        tone: "error",
        title: "Chưa tới khung giờ đặt báo thức.",
        description: `Đặt được từ ${formatClockValue(candidate.promptWindowStartMinutes)} đến ${formatClockValue(candidate.promptWindowEndMinutes)}.`,
      });
      return;
    }

    await ensureAudioContext();
    await requestNotificationPermission();

    const plan = buildAlarmSchedulePlan(candidate, new Date());
    const scheduledForLabel = formatTimeLabel(plan.targetDate);

    if (plan.shouldTriggerImmediately) {
      await triggerAlarm(candidate, {
        scheduledForLabel,
        immediate: true,
      });
      return;
    }

    const existingTimeoutId = alarmTimeoutsRef.current.get(candidate.id);

    if (existingTimeoutId) {
      window.clearTimeout(existingTimeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      void triggerAlarm(candidate, {
        scheduledForLabel,
        immediate: false,
      });
    }, plan.delayMs);

    alarmTimeoutsRef.current.set(candidate.id, timeoutId);
    setScheduledAlarms((previous) => ({
      ...previous,
      [candidate.id]: {
        status: "scheduled",
        scheduledForLabel,
      },
    }));
    setToast({
      tone: "info",
      title: `Đã đặt báo thức lúc ${candidate.alarmLabel}.`,
      description: "Chuông chỉ kêu khi tab này còn mở.",
    });
  }

  function handleCancelAlarm(candidate: SpecialAlarmCandidate) {
    const timeoutId = alarmTimeoutsRef.current.get(candidate.id);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      alarmTimeoutsRef.current.delete(candidate.id);
    }

    setScheduledAlarms((previous) => {
      const nextState = { ...previous };
      delete nextState[candidate.id];
      return nextState;
    });
    setToast({ tone: "info", title: "Đã huỷ báo thức." });
  }

  async function triggerAlarm(
    candidate: SpecialAlarmCandidate,
    options: {
      scheduledForLabel: string;
      immediate: boolean;
    },
  ) {
    alarmTimeoutsRef.current.delete(candidate.id);

    await playAlarmSound();
    showBrowserNotification(candidate);

    setScheduledAlarms((previous) => ({
      ...previous,
      [candidate.id]: {
        status: "triggered",
        scheduledForLabel: options.scheduledForLabel,
      },
    }));
    setToast({
      tone: "success",
      title: options.immediate
        ? `Đã qua ${candidate.alarmLabel}, chuông phát ngay.`
        : `Đã đến giờ ${candidate.alarmLabel}.`,
      description: `Bật máy lạnh cho lớp ${candidate.classStartLabel}.`,
    });
  }

  async function ensureAudioContext() {
    if (typeof window === "undefined") {
      return null;
    }

    const browserWindow = window as Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextConstructor =
      window.AudioContext ?? browserWindow.webkitAudioContext;

    if (!AudioContextConstructor) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }

  async function playAlarmSound() {
    const audioContext = await ensureAudioContext();

    if (!audioContext) {
      return;
    }

    const startAt = audioContext.currentTime + 0.05;

    [0, 0.35, 0.7].forEach((offsetSeconds) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, startAt + offsetSeconds);
      gainNode.gain.setValueAtTime(0.0001, startAt + offsetSeconds);
      gainNode.gain.exponentialRampToValueAtTime(
        0.22,
        startAt + offsetSeconds + 0.03,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        startAt + offsetSeconds + 0.28,
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startAt + offsetSeconds);
      oscillator.stop(startAt + offsetSeconds + 0.3);
    });
  }

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        return;
      }
    }
  }

  function showBrowserNotification(candidate: SpecialAlarmCandidate) {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    new Notification("Nhắc bật máy lạnh", {
      body: `Đã đến giờ ${candidate.alarmLabel}. Có lớp lúc ${candidate.classStartLabel}.`,
    });
  }
}

function TabButton({
  isActive,
  icon,
  label,
  onClick,
}: {
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`-mb-px inline-flex h-11 items-center gap-2 border-b-[3px] px-4 text-[15px] font-semibold transition ${
        isActive
          ? "border-mic-ink text-mic-ink"
          : "border-transparent text-mic-muted hover:text-mic-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DropZone({
  isLoading,
  fileError,
  onFile,
}: {
  isLoading: boolean;
  fileError: string | null;
  onFile: (file: File) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <label
      htmlFor={FILE_INPUT_ID}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);

        const file = event.dataTransfer.files[0];

        if (file && !isLoading) {
          onFile(file);
        }
      }}
      className={`grid cursor-pointer justify-items-center gap-3 rounded-2xl border-2 border-dashed px-5 py-16 text-center transition ${
        isDragging
          ? "border-mic-primary bg-mic-morn-soft"
          : "border-mic-line-strong bg-mic-surface hover:border-mic-primary"
      } ${isLoading ? "cursor-wait opacity-80" : ""}`}
    >
      <span className="grid h-15 w-15 place-items-center rounded-2xl bg-mic-morn-soft text-mic-morn">
        {isLoading ? (
          <Loader size={28} className="animate-spin" />
        ) : (
          <UploadCloud size={28} />
        )}
      </span>
      <span className="text-xl font-bold">
        {isLoading ? "Đang đọc file…" : "Thả file lịch học vào đây"}
      </span>
      <span className="text-[13px] text-mic-muted">
        {ACCEPTED_EXCEL_EXTENSIONS.join(" hoặc ")}
      </span>
      {!isLoading && (
        <span className="inline-flex h-10 items-center rounded-[10px] bg-mic-primary px-4 text-sm font-semibold text-mic-on-primary">
          Chọn file
        </span>
      )}
      {fileError && (
        <span className="mt-2 inline-flex items-center gap-2 rounded-xl bg-mic-danger-soft px-3 py-2 text-sm font-medium text-mic-danger">
          <AlertCircle size={16} />
          {fileError}
        </span>
      )}
    </label>
  );
}

function CardHeader({
  icon,
  iconClassName,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span
        className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] ${iconClassName}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold leading-[22px]">{title}</h2>
        <p className="text-[13px] leading-[18px] text-mic-muted">{subtitle}</p>
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

const TH_CLASS =
  "whitespace-nowrap border-y border-mic-line bg-mic-sunken px-4 py-2 text-left text-[13px] font-semibold text-mic-muted";
const FLOOR_CELL_CLASS =
  "w-px whitespace-nowrap px-4 py-2.5 align-top font-[family-name:var(--font-mic-mono)] text-sm font-semibold text-mic-muted";
const ROOM_CELL_CLASS =
  "px-4 py-2.5 align-top font-[family-name:var(--font-mic-mono)] text-[15px] font-medium";

function MorningCard({ report }: { report: MicFilterReport }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-t-4 border-mic-line border-t-mic-morn bg-mic-surface">
      <CardHeader
        icon={<Sunrise size={21} />}
        iconClassName="bg-mic-morn-soft text-mic-morn"
        title="Soạn mic ca sáng"
        subtitle={joinParts(report.studyDateLabel, `${report.morningRoomCount} phòng`)}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={TH_CLASS}>Tầng</th>
              <th className={TH_CLASS}>Phòng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mic-line">
            {report.morningRows.length === 0 ? (
              <EmptyRow colSpan={2} message="Không có phòng nào dùng mic ca sáng." />
            ) : (
              report.morningRows.map((row) => (
                <tr key={row.floor}>
                  <td className={FLOOR_CELL_CLASS}>{row.floor}</td>
                  <td className={ROOM_CELL_CLASS}>{row.rooms.join(", ")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MiddayCard({
  report,
  onCopyImage,
}: {
  report: MicFilterReport;
  onCopyImage: () => Promise<void>;
}) {
  const [isBusy, setIsBusy] = useState(false);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-t-4 border-mic-line border-t-mic-noon bg-mic-surface">
      <CardHeader
        icon={<Sun size={21} />}
        iconClassName="bg-mic-noon-soft text-mic-noon"
        title="Thu · Phát · Thay pin"
        subtitle={joinParts(
          report.studyDateLabel ? `Trưa ${report.studyDateLabel}` : null,
          `${report.middayActionCount} thao tác`,
        )}
        action={
          <button
            type="button"
            disabled={isBusy}
            onClick={async () => {
              setIsBusy(true);

              try {
                await onCopyImage();
              } finally {
                setIsBusy(false);
              }
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-mic-primary px-3 text-[13px] font-semibold text-mic-on-primary transition hover:opacity-90 disabled:opacity-60"
          >
            {isBusy ? (
              <Loader size={15} className="animate-spin" />
            ) : (
              <ImageDown size={15} />
            )}
            Copy ảnh
          </button>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={TH_CLASS}>Tầng</th>
              <th className={TH_CLASS}>
                <ActionTag className="bg-mic-thu-soft text-mic-muted" icon={<ArrowDownToLine size={14} />} label="Thu" />
              </th>
              <th className={TH_CLASS}>
                <ActionTag className="bg-mic-morn-soft text-mic-morn" icon={<ArrowUpFromLine size={14} />} label="Phát" />
              </th>
              <th className={TH_CLASS}>
                <ActionTag className="bg-mic-noon-soft text-mic-noon" icon={<BatteryCharging size={14} />} label="Thay pin" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mic-line">
            {report.middayRows.length === 0 ? (
              <EmptyRow colSpan={4} message="Không có thao tác buổi trưa nào." />
            ) : (
              report.middayRows.map((row) => (
                <tr key={row.floor}>
                  <td className={FLOOR_CELL_CLASS}>{row.floor}</td>
                  <RoomsCell rooms={row.collectRooms} />
                  <RoomsCell rooms={row.distributeRooms} />
                  <RoomsCell rooms={row.replaceBatteryRooms} />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActionTag({
  className,
  icon,
  label,
}: {
  className: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 ${className}`}>
      {icon}
      {label}
    </span>
  );
}

function RoomsCell({ rooms }: { rooms: string[] }) {
  return rooms.length > 0 ? (
    <td className={ROOM_CELL_CLASS}>{rooms.join(", ")}</td>
  ) : (
    <td className={`${ROOM_CELL_CLASS} text-mic-line-strong`}>–</td>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-mic-muted">
        {message}
      </td>
    </tr>
  );
}

function AlarmLine({
  candidate,
  currentTime,
  scheduledAlarm,
  onSchedule,
  onCancel,
}: {
  candidate: SpecialAlarmCandidate;
  currentTime: Date;
  scheduledAlarm?: ScheduledAlarmState;
  onSchedule: () => void;
  onCancel: () => void;
}) {
  const offerState = getSpecialAlarmOfferState(candidate, currentTime);

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl bg-mic-noon-soft py-2 pl-3 pr-2 text-sm">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-mic-surface text-mic-noon">
        <Bell size={16} />
      </span>
      <span>
        Báo thức bật máy lạnh{" "}
        <b className="font-[family-name:var(--font-mic-mono)]">{candidate.alarmLabel}</b>
        {" · "}lớp {candidate.classStartLabel}
      </span>
      <span className="ml-auto">
        {scheduledAlarm?.status === "triggered" ? (
          <span className="inline-flex items-center gap-1.5 px-2 font-medium text-mic-done">
            <CheckCircle2 size={16} />
            Đã phát chuông
          </span>
        ) : scheduledAlarm ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-8 items-center rounded-lg border border-mic-noon bg-mic-noon px-3 text-[13px] font-semibold text-mic-surface"
          >
            Đã đặt · Huỷ
          </button>
        ) : offerState.shouldShow ? (
          <button
            type="button"
            onClick={onSchedule}
            className="inline-flex h-8 items-center rounded-lg border border-mic-line-strong bg-mic-surface px-3 text-[13px] font-semibold transition hover:border-mic-noon"
          >
            Đặt báo thức
          </button>
        ) : (
          <span className="px-2 text-[13px] text-mic-muted">
            Đặt được từ {formatClockValue(candidate.promptWindowStartMinutes)}
          </span>
        )}
      </span>
    </div>
  );
}

function ToastNotice({
  toast,
  onClose,
}: {
  toast: ToastState | null;
  onClose: () => void;
}) {
  if (!toast) {
    return null;
  }

  const Icon =
    toast.tone === "success"
      ? CheckCircle2
      : toast.tone === "error"
        ? AlertCircle
        : Bell;
  const iconClassName = {
    success: "bg-mic-done-soft text-mic-done",
    info: "bg-mic-morn-soft text-mic-morn",
    error: "bg-mic-danger-soft text-mic-danger",
  } satisfies Record<ToastTone, string>;

  return (
    <div
      role="status"
      className="fixed right-4 top-6 z-50 w-[min(24rem,calc(100vw-2rem))] slide-up"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-mic-line bg-mic-surface p-3.5 text-mic-ink shadow-xl">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${iconClassName[toast.tone]}`}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description && (
            <p className="mt-0.5 text-sm text-mic-muted">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg text-mic-muted transition hover:bg-mic-sunken hover:text-mic-ink"
          aria-label="Đóng thông báo"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function joinParts(...parts: Array<string | null>) {
  return parts.filter(Boolean).join(" · ");
}

function readStoredSession() {
  try {
    return window.localStorage.getItem(MIC_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredSession(session: MicSession) {
  try {
    window.localStorage.setItem(
      MIC_SESSION_STORAGE_KEY,
      serializeMicSession(session),
    );
  } catch {
    // Private mode or full storage: the tool still works, just without restore
  }
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
