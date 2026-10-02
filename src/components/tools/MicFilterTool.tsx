"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  FileSpreadsheet,
  ImageDown,
  Loader,
  RefreshCcw,
  TableProperties,
  UploadCloud,
  Volume2,
  X,
} from "lucide-react";
import {
  buildAlarmSchedulePlan,
  getSpecialAlarmOfferState,
} from "@/tools/mic-filter/alarm";
import { ACCEPTED_EXCEL_EXTENSIONS } from "@/tools/mic-filter/constants";
import {
  describeAlarmRule,
  formatClockValue,
  SHIFT_LABELS,
  type MicFilterConfig,
} from "@/tools/mic-filter/config";
import {
  buildMiddayExportTable,
  buildMiddayText,
  buildMorningExportTable,
  buildMorningText,
} from "@/tools/mic-filter/export";
import { processMicFilterFile } from "@/tools/mic-filter/processor";
import {
  buildChecklistKey,
  CHECKLIST_KIND_LABELS,
  createEmptySummary,
  getChecklistProgress,
  getDayKey,
  MIC_SESSION_STORAGE_KEY,
  parseMicSession,
  serializeMicSession,
  type ChecklistKind,
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

interface InlineErrorState {
  title: string;
  description: string;
}

type ToastTone = "success" | "info" | "error";

interface ToastState {
  tone: ToastTone;
  title: string;
  description: string;
}

interface ScheduledAlarmState {
  status: "scheduled" | "triggered";
  scheduledForLabel: string;
}

export type MicFilterMode = "filter" | "shift-summary";

interface MicFilterToolProps {
  mode: MicFilterMode;
  onModeChange: (mode: MicFilterMode) => void;
  config: MicFilterConfig;
}

type ResultTableKind = "morning" | "midday";

type CountField =
  | "acIncrease"
  | "acDecrease"
  | "usedBatteryCount"
  | "extraBatteryCount";

export function MicFilterTool({
  mode,
  onModeChange,
  config,
}: MicFilterToolProps) {
  const [report, setReport] = useState<MicFilterReport | null>(null);
  const [fileError, setFileError] = useState<InlineErrorState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [scheduledAlarms, setScheduledAlarms] = useState<
    Record<string, ScheduledAlarmState>
  >({});
  const [checked, setChecked] = useState<string[]>([]);
  const [summary, setSummary] = useState<ShiftSummaryState>(() =>
    createEmptySummary(new Date()),
  );
  const [sessionDayKey, setSessionDayKey] = useState(() =>
    getDayKey(new Date()),
  );
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const alarmTimeoutsRef = useRef<Map<string, number>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  const checkedSet = useMemo(() => new Set(checked), [checked]);
  const {
    shift,
    summaryDate,
    hasEditedSummaryDate,
    acIncrease,
    acDecrease,
    roomFeedbackDetails,
    borrowedItemDetails,
    usedBatteryCount,
    extraBatteryCount,
  } = summary;
  const roomFeedbackCount = roomFeedbackDetails.length;
  const borrowedItemCount = borrowedItemDetails.length;

  const reportStudyDateLabel = report?.studyDateLabel ?? null;
  const canReset = Boolean(report || selectedFileName || fileError);
  const acTotal = acIncrease + acDecrease;
  const totalBattery = usedBatteryCount + extraBatteryCount;
  const shiftLabel = shift === "morning" ? "ca sáng" : "ca chiều";
  const shiftHeadingLabel = shift === "morning" ? "Ca sáng" : "Ca chiều";
  const summaryText = buildShiftSummaryText({
    shiftLabel,
    summaryDate,
    acIncrease,
    acDecrease,
    roomFeedbackCount,
    roomFeedbackDetails,
    borrowedItemCount,
    borrowedItemDetails,
    usedBatteryCount,
    extraBatteryCount,
  });

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
    }, 5_000);

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
      setChecked(stored.checked);
      setSummary(stored.summary);

      if (stored.report) {
        setSelectedFileName(stored.report.fileName);
        setToast({
          tone: "info",
          title: "Đã khôi phục phiên làm việc hôm nay.",
          description:
            "Bảng kết quả, checklist và dữ liệu kết ca được giữ lại sau khi tải lại trang. Dữ liệu tự xoá khi sang ngày mới.",
        });
      }
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
      checked,
      summary,
    });
  }, [isSessionLoaded, sessionDayKey, report, checked, summary]);

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
    setChecked([]);
    setSummary(createEmptySummary(currentTime));
    setScheduledAlarms({});
    setSelectedFileName(null);
    setFileError(null);
    setSessionDayKey(todayKey);
  }, [currentTime, isSessionLoaded, sessionDayKey]);

  useEffect(() => {
    return () => {
      clearAllAlarmTimeouts();

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
      }
    };
  }, []);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    clearAllAlarmTimeouts();
    setScheduledAlarms({});
    setSelectedFileName(file.name);
    setIsLoading(true);
    setReport(null);
    setFileError(null);
    setToast(null);

    try {
      const nextReport = await processMicFilterFile(file, config);

      setReport(nextReport);
      setChecked([]);
      setToast({
        tone: "success",
        title: nextReport.studyDateLabel
          ? `Đã lọc xong file cho ngày ${nextReport.studyDateLabel}.`
          : "Đã lọc xong file.",
        description: nextReport.hasStudyDateColumn
          ? `Sheet đang xử lý: ${nextReport.sheetName}. Hai bảng kết quả đã sẵn sàng để bạn thao tác.`
          : `Sheet đang xử lý: ${nextReport.sheetName}. Hai bảng kết quả đã sẵn sàng để bạn thao tác.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xử lý file Excel.";

      setFileError({
        title: message,
        description:
          "Bạn có thể kiểm tra lại file rồi tải lên lại ngay ở khung chọn file bên trên.",
      });
      setInputKey((current) => current + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    clearAllAlarmTimeouts();
    setReport(null);
    setFileError(null);
    setToast(null);
    setSelectedFileName(null);
    setScheduledAlarms({});
    setChecked([]);
    setInputKey((current) => current + 1);

    if (!hasEditedSummaryDate) {
      updateSummary({ summaryDate: getTodayLabel() });
    }
  };

  const visibleAlarmCandidates = report
    ? report.specialAlarmCandidates.filter((candidate) => {
        const offerState = getSpecialAlarmOfferState(candidate, currentTime);

        return offerState.shouldShow || Boolean(scheduledAlarms[candidate.id]);
      })
    : [];

  return (
    <div className="relative space-y-8">
      <ToastNotice toast={toast} onClose={() => setToast(null)} />

      {mode === "shift-summary" ? (
        <ShiftSummaryPanel
          shift={shift}
          shiftLabel={shiftLabel}
          shiftHeadingLabel={shiftHeadingLabel}
          summaryDate={summaryDate}
          reportDateLabel={reportStudyDateLabel}
          acIncrease={acIncrease}
          acDecrease={acDecrease}
          acTotal={acTotal}
          roomFeedbackCount={roomFeedbackCount}
          roomFeedbackDetails={roomFeedbackDetails}
          borrowedItemCount={borrowedItemCount}
          borrowedItemDetails={borrowedItemDetails}
          usedBatteryCount={usedBatteryCount}
          extraBatteryCount={extraBatteryCount}
          totalBattery={totalBattery}
          summaryText={summaryText}
          onBack={() => onModeChange("filter")}
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
          onAdjustAcIncrease={(delta) => adjustCount("acIncrease", delta)}
          onAdjustAcDecrease={(delta) => adjustCount("acDecrease", delta)}
          onIncreaseRoomFeedback={increaseRoomFeedback}
          onDecreaseRoomFeedback={decreaseRoomFeedback}
          onUpdateRoomFeedbackDetail={updateRoomFeedbackDetail}
          onIncreaseBorrowedItem={increaseBorrowedItem}
          onDecreaseBorrowedItem={decreaseBorrowedItem}
          onUpdateBorrowedItemDetail={updateBorrowedItemDetail}
          onAdjustUsedBattery={(delta) =>
            adjustCount("usedBatteryCount", delta)
          }
          onAdjustExtraBattery={(delta) =>
            adjustCount("extraBatteryCount", delta)
          }
          onCopySummary={() => void handleCopySummary()}
          onResetSummary={handleResetSummary}
        />
      ) : (
        <>
          <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-5">
            <UploadCard
              isLoading={isLoading}
              selectedFileName={selectedFileName}
              fileError={fileError}
              canReset={canReset}
              inputKey={inputKey}
              config={config}
              onReset={handleReset}
              onFileChange={handleFileChange}
            />

            <AlarmCard
              config={config}
              report={report}
              currentTime={currentTime}
              visibleAlarmCandidates={visibleAlarmCandidates}
              scheduledAlarms={scheduledAlarms}
              onScheduleAlarm={handleScheduleAlarm}
              onCancelAlarm={handleCancelAlarm}
            />
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                  Kết quả chính
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                  Hai bảng cần dùng ngay sau khi lọc
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                  {report
                    ? report.studyDateLabel
                      ? `Đang hiển thị kết quả từ sheet ${report.sheetName} cho ngày ${report.studyDateLabel}.`
                      : `Đang hiển thị kết quả từ sheet ${report.sheetName}. File này không có cột Ngày học nên hệ thống lọc trực tiếp theo lịch hiện có.`
                    : "Tải file Excel để hệ thống cập nhật ngay Bảng 1 và Bảng 2 ở khu vực này."}
                </p>
              </div>

              {report?.studyDateLabel && (
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 lg:self-auto">
                  <CheckCircle2 size={16} />
                  Ngày học {report.studyDateLabel}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <MorningResultCard
                report={report}
                checked={checkedSet}
                onToggle={toggleChecklist}
                onExport={handleExportTable}
              />
              <MiddayResultCard
                report={report}
                checked={checkedSet}
                onToggle={toggleChecklist}
                onExport={handleExportTable}
              />
            </div>
          </section>

          {report && (
            <section className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  title="Dòng lịch đã đọc"
                  value={String(report.totalScheduleCount)}
                  caption={`Bỏ qua ${report.ignoredScheduleCount} dòng không thuộc phòng mic không dây`}
                />
                <SummaryCard
                  title="Phòng mic không dây"
                  value={String(report.uniqueWirelessRoomCount)}
                  caption={`${report.wirelessScheduleCount} dòng lịch thuộc danh sách mic không dây`}
                />
                <SummaryCard
                  title="Phòng cần soạn buổi sáng"
                  value={String(report.morningRoomCount)}
                  caption={
                    report.studyDateLabel
                      ? `Chuẩn bị cho ngày ${report.studyDateLabel}`
                      : "Chuẩn bị theo dữ liệu lịch vừa lọc"
                  }
                />
                <SummaryCard
                  title="Thao tác buổi trưa"
                  value={String(report.middayActionCount)}
                  caption="Tổng số phòng cần Thu, Phát hoặc Thay Pin"
                />
              </div>

              <FileReadInfoCard
                fileName={report.fileName ?? selectedFileName ?? "Không xác định"}
                sheetName={report.sheetName}
                hasStudyDateColumn={report.hasStudyDateColumn}
                studyDateLabel={report.studyDateLabel}
              />
            </section>
          )}
        </>
      )}
    </div>
  );

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
    field: "roomFeedbackDetails" | "borrowedItemDetails",
    update: (items: string[]) => string[],
  ) {
    setSummary((current) => ({ ...current, [field]: update(current[field]) }));
  }

  function increaseRoomFeedback() {
    updateDetailList("roomFeedbackDetails", (items) => [...items, ""]);
  }

  function decreaseRoomFeedback() {
    updateDetailList("roomFeedbackDetails", (items) => items.slice(0, -1));
  }

  function updateRoomFeedbackDetail(index: number, value: string) {
    updateDetailList("roomFeedbackDetails", (items) =>
      items.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function increaseBorrowedItem() {
    updateDetailList("borrowedItemDetails", (items) => [...items, ""]);
  }

  function decreaseBorrowedItem() {
    updateDetailList("borrowedItemDetails", (items) => items.slice(0, -1));
  }

  function updateBorrowedItemDetail(index: number, value: string) {
    updateDetailList("borrowedItemDetails", (items) =>
      items.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function handleResetSummary() {
    const freshSummary = createEmptySummary(new Date());

    setSummary({
      ...freshSummary,
      shift,
      summaryDate: reportStudyDateLabel ?? freshSummary.summaryDate,
    });
    setToast({
      tone: "info",
      title: "Đã xoá dữ liệu kết ca.",
      description: "Các bộ đếm và ghi chú đã về 0, ca đang chọn được giữ nguyên.",
    });
  }

  function toggleChecklist(key: string) {
    setChecked((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  async function handleExportTable(
    kind: ResultTableKind,
    format: "text" | "image",
  ) {
    if (!report) {
      return;
    }

    try {
      if (format === "text") {
        if (!navigator.clipboard) {
          throw new Error("clipboard");
        }

        await navigator.clipboard.writeText(
          kind === "morning" ? buildMorningText(report) : buildMiddayText(report),
        );
        setToast({
          tone: "success",
          title: "Đã copy bảng dạng chữ.",
          description: "Dán thẳng vào Zalo hoặc Messenger.",
        });
        return;
      }

      const table =
        kind === "morning"
          ? buildMorningExportTable(report)
          : buildMiddayExportTable(report);
      const blob = await renderTableImage(table);
      const fileName = `${kind === "morning" ? "soan-mic-sang" : "thu-phat-trua"}-${sessionDayKey}.png`;
      const result = await copyOrDownloadImage(blob, fileName);

      setToast({
        tone: "success",
        title:
          result === "copied" ? "Đã copy ảnh bảng." : "Đã tải ảnh bảng về máy.",
        description:
          result === "copied"
            ? "Dán (Ctrl+V) vào Zalo để gửi ảnh."
            : "Trình duyệt không cho copy ảnh nên ảnh được lưu thành file PNG.",
      });
    } catch {
      setToast({
        tone: "error",
        title: "Chưa xuất được bảng.",
        description: "Trình duyệt đã chặn thao tác. Hãy thử lại.",
      });
    }
  }

  async function handleCopySummary() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setToast({
        tone: "error",
        title: "Trình duyệt chưa hỗ trợ copy tự động.",
        description: "Bạn hãy copy thủ công phần preview nội dung kết ca.",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(summaryText);
      setToast({
        tone: "success",
        title: "Đã copy nội dung kết ca.",
        description: "Bạn có thể dán nhanh sang Zalo, Messenger hoặc báo cáo.",
      });
    } catch {
      setToast({
        tone: "error",
        title: "Copy chưa thành công.",
        description:
          "Trình duyệt đã chặn thao tác copy. Bạn hãy thử lại hoặc copy thủ công từ phần preview.",
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
        title: "Hiện không nằm trong khung giờ đặt báo thức.",
        description:
          "Báo thức chỉ được gợi ý đúng ngày học và trong khoảng thời gian bạn yêu cầu.",
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
      description: `Chuông sẽ phát vào ${scheduledForLabel} để bạn bật máy lạnh trước ca ${candidate.classStartLabel}.`,
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
    setToast({
      tone: "info",
      title: "Đã hủy báo thức.",
      description: `Báo thức cho ca ${candidate.classStartLabel} đã được hủy.`,
    });
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
        ? `Đã phát chuông ngay cho ca ${candidate.classStartLabel}.`
        : `Đã đến giờ ${candidate.alarmLabel}.`,
      description: options.immediate
        ? `Hiện đã qua ${candidate.alarmLabel}, nên chuông được phát ngay để bạn kịp bật máy lạnh trước ca ${candidate.classStartLabel}.`
        : `Chuông đã phát để bạn bật máy lạnh cho ca học bắt đầu lúc ${candidate.classStartLabel}.`,
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
      oscillator.frequency.setValueAtTime(
        880,
        startAt + offsetSeconds,
      );
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
      body: `Đã đến giờ ${candidate.alarmLabel}. Có ca học lúc ${candidate.classStartLabel}.`,
    });
  }
}

function UploadCard({
  isLoading,
  selectedFileName,
  fileError,
  canReset,
  inputKey,
  config,
  onReset,
  onFileChange,
}: {
  isLoading: boolean;
  selectedFileName: string | null;
  fileError: InlineErrorState | null;
  canReset: boolean;
  inputKey: number;
  config: MicFilterConfig;
  onReset: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-cyan-400/15 bg-[linear-gradient(180deg,_rgba(7,17,38,0.98)_0%,_rgba(5,14,31,0.98)_100%)] p-5 shadow-[0_24px_70px_-36px_rgba(14,165,233,0.4)] xl:col-span-3">
      <LogicHoverCard config={config} />

      <div className="pr-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="group relative inline-flex">
              <button
                type="button"
                aria-label="Xem hướng dẫn tải lịch học"
                className="inline-flex h-12 w-12 cursor-help items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/12 text-cyan-100 shadow-lg shadow-cyan-400/10 transition duration-200 hover:border-cyan-300/40 hover:bg-cyan-400/18 hover:text-white hover:shadow-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 focus:ring-offset-2 focus:ring-offset-[#071120]"
              >
                <UploadCloud size={22} />
              </button>

              <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[min(22rem,calc(100vw-5rem))] translate-y-2 rounded-[1.25rem] border border-cyan-400/15 bg-[linear-gradient(180deg,_rgba(7,20,40,0.98)_0%,_rgba(5,14,28,0.98)_100%)] p-4 text-sm text-slate-200 opacity-0 shadow-2xl shadow-slate-950/50 backdrop-blur transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <p className="font-semibold text-white">
                  Tải file Excel ({ACCEPTED_EXCEL_EXTENSIONS.join(" / ")}) để hệ
                  thống tự động xử lý và hiển thị kết quả ngay bên dưới.
                </p>
                <p className="mt-2 leading-6 text-slate-300">
                  Hỗ trợ định dạng: {ACCEPTED_EXCEL_EXTENSIONS.join(", ")}. Dữ
                  liệu sẽ được cập nhật ngay sau khi tải lên.
                </p>
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white">
              Tải lịch học
            </h2>
          </div>

          {canReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
            >
              <RefreshCcw size={16} />
              Làm lại
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Hỗ trợ {ACCEPTED_EXCEL_EXTENSIONS.join(" / ")}
          </span>
        </div>
      </div>

      <label
        htmlFor="mic-filter-upload"
        className={`mt-5 flex rounded-[1.5rem] border border-dashed px-4 py-4 transition ${
          isLoading
            ? "cursor-wait border-cyan-400/20 bg-slate-900/60 opacity-80"
            : "cursor-pointer border-cyan-400/25 bg-slate-900/45 hover:border-cyan-300/45 hover:bg-slate-900/70"
        }`}
      >
        <div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
          <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-100">
            {isLoading ? (
              <Loader size={24} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={24} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-white">
              {isLoading
                ? "Đang đọc file Excel..."
                : selectedFileName ?? "Chọn file .xls hoặc .xlsx"}
            </span>
            <span className="mt-1 block text-sm leading-6 text-slate-300">
              {isLoading
                ? "Hệ thống đang tách dữ liệu để đưa ngay vào Bảng 1 và Bảng 2."
                : "File sẽ được xử lý ngay sau khi bạn chọn."}
            </span>
          </div>

          <span className="inline-flex shrink-0 items-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/20">
            {isLoading ? "Đang xử lý" : "Tải file"}
          </span>
        </div>
      </label>

      <input
        key={inputKey}
        id="mic-filter-upload"
        type="file"
        accept={ACCEPTED_EXCEL_EXTENSIONS.join(",")}
        className="hidden"
        onChange={onFileChange}
      />

      {selectedFileName && (
        <div className="mt-4 rounded-[1.25rem] border border-slate-800 bg-slate-950/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            File đang chọn
          </p>
          <p className="mt-2 text-sm font-medium text-slate-100">
            {selectedFileName}
          </p>
        </div>
      )}

      {fileError && (
        <div className="mt-4 rounded-[1.25rem] border border-red-400/25 bg-red-500/10 px-4 py-4 text-red-50">
          <p className="text-sm font-semibold">{fileError.title}</p>
          <p className="mt-2 text-sm leading-6 text-red-100/90">
            {fileError.description}
          </p>
        </div>
      )}
    </section>
  );
}

function AlarmCard({
  config,
  report,
  currentTime,
  visibleAlarmCandidates,
  scheduledAlarms,
  onScheduleAlarm,
  onCancelAlarm,
}: {
  config: MicFilterConfig;
  report: MicFilterReport | null;
  currentTime: Date;
  visibleAlarmCandidates: SpecialAlarmCandidate[];
  scheduledAlarms: Record<string, ScheduledAlarmState>;
  onScheduleAlarm: (candidate: SpecialAlarmCandidate) => Promise<void>;
  onCancelAlarm: (candidate: SpecialAlarmCandidate) => void;
}) {
  const hasAnyAlarmCandidates = Boolean(report?.specialAlarmCandidates.length);
  const ruleSummary =
    config.alarmRules.length > 0
      ? config.alarmRules
          .map((rule) => `ca ${describeAlarmRule(rule).classStartLabel}`)
          .join(", ")
      : null;

  return (
    <section className="h-full rounded-[1.75rem] border border-sky-400/15 bg-[linear-gradient(180deg,_rgba(8,24,43,0.98)_0%,_rgba(6,17,34,0.98)_100%)] p-5 shadow-[0_24px_70px_-36px_rgba(56,189,248,0.35)] xl:col-span-2">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/12 text-sky-100 shadow-lg shadow-sky-400/10">
        <Bell size={22} />
      </div>

      <h3 className="mt-4 text-2xl font-bold text-white">
        Đặt báo thức máy lạnh
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        {ruleSummary
          ? `Gợi ý tự động cho ${ruleSummary}. Card này luôn nằm cạnh upload để bạn thao tác nhanh khi cần.`
          : "Chưa có rule nhắc máy lạnh nào. Admin có thể thêm trong dashboard."}
      </p>

      <div className="mt-4 rounded-[1.5rem] border border-slate-800 bg-slate-950/55 p-4">
        {!report ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">
              Chưa có dữ liệu để gợi ý báo thức.
            </p>
            <p className="text-sm leading-6 text-slate-300">
              Tải file lịch học để hệ thống kiểm tra các ca cần bật máy lạnh và
              hiển thị nút đặt báo thức ngay tại đây.
            </p>
          </div>
        ) : visibleAlarmCandidates.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">
              {hasAnyAlarmCandidates
                ? "File có ca phù hợp, nhưng hiện không nằm trong khung giờ gợi ý."
                : "Không phát hiện ca nào cần bật máy lạnh theo rule hiện tại."}
            </p>
            <p className="text-sm leading-6 text-slate-300">
              {hasAnyAlarmCandidates
                ? "Bạn vẫn có thể chờ tới đúng khung giờ để card này hiện nút đặt báo thức."
                : ruleSummary
                  ? `Hiện tool chỉ gợi ý báo thức cho ${ruleSummary}.`
                  : "Chưa có rule nhắc máy lạnh nào được cấu hình."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAlarmCandidates.map((candidate) => {
              const scheduledAlarm = scheduledAlarms[candidate.id];

              return (
                <div
                  key={candidate.id}
                  className="rounded-[1.25rem] border border-sky-400/12 bg-sky-400/10 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Ca {candidate.classStartLabel}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {candidate.matchedScheduleCount} lịch học. Phòng liên
                        quan:{" "}
                        <span className="font-medium text-sky-100">
                          {candidate.matchedRooms.join(", ")}
                        </span>
                      </p>
                    </div>

                    {scheduledAlarm && (
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                        {scheduledAlarm.status === "scheduled"
                          ? `Đã đặt ${scheduledAlarm.scheduledForLabel}`
                          : `Đã phát ${scheduledAlarm.scheduledForLabel}`}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {candidate.promptMessage}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {scheduledAlarm ? (
                      scheduledAlarm.status === "scheduled" ? (
                        <button
                          type="button"
                          onClick={() => onCancelAlarm(candidate)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-sky-400/35 hover:text-white"
                        >
                          Hủy báo thức
                        </button>
                      ) : (
                        <span className="text-sm font-medium text-emerald-100">
                          Chuông đã phát xong.
                        </span>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => void onScheduleAlarm(candidate)}
                        className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                      >
                        <Volume2 size={16} />
                        Đặt báo thức
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/70">
        <Clock3 size={14} />
        Đang theo dõi lúc {formatTimeLabel(currentTime)} · Chuông chỉ phát khi
        tab vẫn đang mở
      </div>
    </section>
  );
}

interface ResultCardProps {
  report: MicFilterReport | null;
  checked: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onExport: (kind: ResultTableKind, format: "text" | "image") => Promise<void>;
}

function MorningResultCard({
  report,
  checked,
  onToggle,
  onExport,
}: ResultCardProps) {
  const progress = report ? getChecklistProgress(report, checked) : null;

  return (
    <section className="rounded-[1.75rem] border border-slate-700/90 bg-[linear-gradient(180deg,_rgba(12,23,42,0.98)_0%,_rgba(7,16,31,0.98)_100%)] p-6 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.95)]">
      <div className="mb-6 flex items-start gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-100">
          <TableProperties size={22} />
        </div>

        <div>
          <h3 className="text-3xl font-bold tracking-tight text-white">
            Bảng 1: Soạn mic ca sáng
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            Các phòng được gộp theo tầng để bạn chuẩn bị mic nhanh hơn.
          </p>
        </div>
      </div>

      {report && progress && (
        <ResultCardToolbar
          kind="morning"
          progress={[{ kind: "morning", ...progress.morning }]}
          onExport={onExport}
        />
      )}

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-800 bg-[#07101f]/90">
        <table className="min-w-full text-sm text-slate-200">
          <thead className="bg-[#0e1b31] text-left text-slate-300">
            <tr>
              <th className="px-4 py-3 font-semibold">Tầng</th>
              <th className="px-4 py-3 font-semibold">Phòng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {!report ? (
              <EmptyTableRow
                colSpan={2}
                message="Tải file Excel để hiển thị danh sách phòng cần soạn mic vào buổi sáng."
              />
            ) : report.morningRows.length === 0 ? (
              <EmptyTableRow
                colSpan={2}
                message="Không có phòng mic không dây nào dùng trong ca sáng."
              />
            ) : (
              report.morningRows.map((row) => (
                <tr key={row.floor}>
                  <td className="px-4 py-3 font-semibold text-white">
                    {row.floor}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <RoomChecklist
                      kind="morning"
                      floor={row.floor}
                      rooms={row.rooms}
                      checked={checked}
                      onToggle={onToggle}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MiddayResultCard({
  report,
  checked,
  onToggle,
  onExport,
}: ResultCardProps) {
  const progress = report ? getChecklistProgress(report, checked) : null;

  return (
    <section className="rounded-[1.75rem] border border-slate-700/90 bg-[linear-gradient(180deg,_rgba(16,25,39,0.98)_0%,_rgba(9,16,28,0.98)_100%)] p-6 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.95)]">
      <div className="mb-6 flex items-start gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-100">
          <TableProperties size={22} />
        </div>

        <div>
          <h3 className="text-3xl font-bold tracking-tight text-white">
            Bảng 2: Thu, Phát, Thay Pin
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            Kết quả được gộp theo tầng để bạn xử lý nhanh sau ca sáng.
          </p>
        </div>
      </div>

      {report && progress && (
        <ResultCardToolbar
          kind="midday"
          progress={[
            { kind: "collect", ...progress.collect },
            { kind: "distribute", ...progress.distribute },
            { kind: "replaceBattery", ...progress.replaceBattery },
          ]}
          onExport={onExport}
        />
      )}

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-800 bg-[#07101f]/90">
        <table className="min-w-full text-sm text-slate-200">
          <thead className="bg-[#141f33] text-left text-slate-300">
            <tr>
              <th className="px-4 py-3 font-semibold">Tầng</th>
              <th className="px-4 py-3 font-semibold">Thu</th>
              <th className="px-4 py-3 font-semibold">Phát</th>
              <th className="px-4 py-3 font-semibold">Thay Pin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {!report ? (
              <EmptyTableRow
                colSpan={4}
                message="Sau khi lọc file, bảng này sẽ hiển thị các thao tác cần làm cho buổi trưa."
              />
            ) : report.middayRows.length === 0 ? (
              <EmptyTableRow
                colSpan={4}
                message="Không có thao tác buổi trưa nào cho file này."
              />
            ) : (
              report.middayRows.map((row) => (
                <tr key={row.floor} className="align-top">
                  <td className="px-4 py-3 font-semibold text-white">
                    {row.floor}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <RoomChecklist
                      kind="collect"
                      floor={row.floor}
                      rooms={row.collectRooms}
                      checked={checked}
                      onToggle={onToggle}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <RoomChecklist
                      kind="distribute"
                      floor={row.floor}
                      rooms={row.distributeRooms}
                      checked={checked}
                      onToggle={onToggle}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <RoomChecklist
                      kind="replaceBattery"
                      floor={row.floor}
                      rooms={row.replaceBatteryRooms}
                      checked={checked}
                      onToggle={onToggle}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyTableRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-400">
        {message}
      </td>
    </tr>
  );
}

function SummaryCard({
  title,
  value,
  caption,
}: {
  title: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-[#07101f]/90 p-5">
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className="mt-3 text-4xl font-bold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{caption}</p>
    </div>
  );
}

function FileReadInfoCard({
  fileName,
  sheetName,
  studyDateLabel,
  hasStudyDateColumn,
}: {
  fileName: string;
  sheetName: string;
  studyDateLabel: string | null;
  hasStudyDateColumn: boolean;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-800 bg-[#07101f]/90 p-6">
      <h3 className="text-2xl font-bold text-white">Thông tin đọc file</h3>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Tên file" value={fileName} />
        <InfoItem label="Sheet đang đọc" value={sheetName} />
        <InfoItem
          label="Ngày học trong file"
          value={studyDateLabel ?? "Không có cột Ngày học"}
        />
        <InfoItem
          label="Cột Ngày học"
          value={
            hasStudyDateColumn
              ? "Có trong file"
              : "Không có trong file"
          }
        />
      </div>
    </section>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-800 bg-slate-950/55 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function LogicHoverCard({ config }: { config: MicFilterConfig }) {
  return (
    <div className="group absolute right-4 top-4 z-10">
      <button
        type="button"
        aria-label="Xem logic đang áp dụng"
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-slate-950/75 text-cyan-100 shadow-lg shadow-cyan-400/10 transition hover:border-cyan-300/35 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
      >
        <CalendarClock size={20} />
      </button>

      <div className="pointer-events-none absolute right-0 top-full mt-3 w-[min(24rem,calc(100vw-3rem))] rounded-[1.5rem] border border-slate-800 bg-[#07101f] p-5 text-sm text-slate-300 opacity-0 shadow-2xl shadow-slate-950/50 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <h3 className="text-lg font-bold text-white">Logic đang áp dụng</h3>

        <div className="mt-4 space-y-3 leading-7">
          {(["morning", "afternoon", "evening"] as const).map((key) => (
            <p key={key}>
              {SHIFT_LABELS[key]}:{" "}
              <span className="font-semibold text-white">
                {formatClockValue(config.shifts[key].startMinutes)} -{" "}
                {formatClockValue(config.shifts[key].endMinutes)}
              </span>
            </p>
          ))}
          <p>
            Đang theo dõi{" "}
            <span className="font-semibold text-white">
              {config.wirelessRooms.length} phòng mic không dây
            </span>
            . Admin chỉnh danh sách phòng, khung giờ và rule nhắc trong
            dashboard.
          </p>
          <p>
            Bảng 1 hiển thị các phòng mic không dây có học trong{" "}
            <span className="font-semibold text-white">
              {SHIFT_LABELS.morning.toLowerCase()}
            </span>
            .
          </p>
          <p>
            Bảng 2 chia theo tầng: Thu nếu chỉ dùng sáng, Phát nếu chỉ dùng
            chiều, Thay Pin nếu dùng cả sáng và chiều.
          </p>
          <p>
            Bấm vào số phòng trên bảng để đánh dấu đã làm xong. Kết quả và
            checklist được giữ tới hết ngày, kể cả khi tải lại trang.
          </p>
        </div>
      </div>
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

  const toneClasses = {
    success:
      "border-emerald-400/30 bg-[#06281f]/95 text-emerald-50 shadow-emerald-950/50",
    info: "border-sky-400/30 bg-[#061d30]/95 text-sky-50 shadow-slate-950/50",
    error: "border-red-400/30 bg-[#2a0b10]/95 text-red-50 shadow-red-950/50",
  } satisfies Record<ToastTone, string>;

  const badgeClasses = {
    success: "bg-emerald-400/15 text-emerald-100",
    info: "bg-sky-400/15 text-sky-100",
    error: "bg-red-400/15 text-red-100",
  } satisfies Record<ToastTone, string>;

  const Icon =
    toast.tone === "success"
      ? CheckCircle2
      : toast.tone === "error"
        ? AlertCircle
        : Bell;

  return (
    <div className="fixed right-4 top-6 z-50 w-[min(26rem,calc(100vw-2rem))] slide-up">
      <div
        className={`rounded-[1.5rem] border px-4 py-4 shadow-2xl backdrop-blur ${toneClasses[toast.tone]}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${badgeClasses[toast.tone]}`}
          >
            <Icon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{toast.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-200">
              {toast.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/5 hover:text-white"
            aria-label="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultCardToolbar({
  kind,
  progress,
  onExport,
}: {
  kind: ResultTableKind;
  progress: Array<{ kind: ChecklistKind; done: number; total: number }>;
  onExport: (kind: ResultTableKind, format: "text" | "image") => Promise<void>;
}) {
  const [busyFormat, setBusyFormat] = useState<"text" | "image" | null>(null);

  const runExport = async (format: "text" | "image") => {
    setBusyFormat(format);

    try {
      await onExport(kind, format);
    } finally {
      setBusyFormat(null);
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {progress
          .filter((item) => item.total > 0)
          .map((item) => {
            const isDone = item.done === item.total;

            return (
              <span
                key={item.kind}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  isDone
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                    : "border-slate-700 bg-slate-900/70 text-slate-300"
                }`}
              >
                {CHECKLIST_KIND_LABELS[item.kind]} {item.done}/{item.total}
              </span>
            );
          })}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void runExport("text")}
          disabled={busyFormat !== null}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400/35 hover:text-white disabled:opacity-60"
        >
          <Copy size={14} />
          Copy chữ
        </button>
        <button
          type="button"
          onClick={() => void runExport("image")}
          disabled={busyFormat !== null}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400/35 hover:text-white disabled:opacity-60"
        >
          {busyFormat === "image" ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <ImageDown size={14} />
          )}
          Copy ảnh
        </button>
      </div>
    </div>
  );
}

function RoomChecklist({
  kind,
  floor,
  rooms,
  checked,
  onToggle,
}: {
  kind: ChecklistKind;
  floor: string;
  rooms: string[];
  checked: ReadonlySet<string>;
  onToggle: (key: string) => void;
}) {
  if (rooms.length === 0) {
    return <span className="text-slate-500">-</span>;
  }

  const actionLabel = CHECKLIST_KIND_LABELS[kind].toLowerCase();

  return (
    <div className="flex flex-wrap gap-1.5">
      {rooms.map((room) => {
        const key = buildChecklistKey(kind, floor, room);
        const isDone = checked.has(key);

        return (
          <button
            key={room}
            type="button"
            onClick={() => onToggle(key)}
            aria-pressed={isDone}
            title={
              isDone
                ? `Phòng ${room}: ${actionLabel}. Bấm để bỏ đánh dấu.`
                : `Bấm khi ${actionLabel.replace("đã ", "")} xong phòng ${room}`
            }
            className={`inline-flex min-w-9 items-center justify-center gap-1 rounded-lg border px-2.5 py-1 text-sm font-medium transition ${
              isDone
                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100 line-through decoration-emerald-300/70"
                : "border-slate-700 bg-slate-900/70 text-slate-100 hover:border-cyan-400/40 hover:text-white"
            }`}
          >
            {isDone && <Check size={13} />}
            {room}
          </button>
        );
      })}
    </div>
  );
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

function getTodayLabel() {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today.toLocaleDateString("vi-VN");
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildShiftSummaryText({
  shiftLabel,
  summaryDate,
  acIncrease,
  acDecrease,
  roomFeedbackCount,
  roomFeedbackDetails,
  borrowedItemCount,
  borrowedItemDetails,
  usedBatteryCount,
  extraBatteryCount,
}: {
  shiftLabel: string;
  summaryDate: string;
  acIncrease: number;
  acDecrease: number;
  roomFeedbackCount: number;
  roomFeedbackDetails: string[];
  borrowedItemCount: number;
  borrowedItemDetails: string[];
  usedBatteryCount: number;
  extraBatteryCount: number;
}) {
  const normalizedSummaryDate = summaryDate.trim() || getTodayLabel();
  const acTotal = acIncrease + acDecrease;
  const totalBattery = usedBatteryCount + extraBatteryCount;
  const roomDetailsBlock =
    roomFeedbackCount > 0
      ? `:\n${roomFeedbackDetails
          .map((item) => `  + ${item.trim() || "(chưa nhập nội dung)"}`)
          .join("\n")}`
      : ".";
  const borrowedDetailsBlock =
    borrowedItemCount > 0
      ? `:\n${borrowedItemDetails
          .map((item) => `  + ${item.trim() || "(chưa nhập nội dung)"}`)
          .join("\n")}`
      : ".";

  return [
    `Kết ${shiftLabel} ngày ${normalizedSummaryDate}:`,
    `- Có ${acTotal} phản hồi máy lạnh (${acIncrease} tăng, ${acDecrease} giảm)`,
    `- Có ${roomFeedbackCount} phản hồi phòng học${roomDetailsBlock}`,
    `- Đã cho mượn ${borrowedItemCount} vật tư${borrowedDetailsBlock}`,
    `- ${
      shiftLabel.charAt(0).toUpperCase() + shiftLabel.slice(1)
    } sử dụng ${usedBatteryCount} viên pin, phát sinh thêm ${extraBatteryCount} viên, tổng ${totalBattery} viên`,
  ].join("\n");
}
