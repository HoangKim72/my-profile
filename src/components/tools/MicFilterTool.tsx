"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
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
import {
  ACCEPTED_EXCEL_EXTENSIONS,
  ENFORCE_TOMORROW_STUDY_DATE,
  SHIFT_WINDOWS,
} from "@/tools/mic-filter/constants";
import { processMicFilterFile } from "@/tools/mic-filter/processor";
import {
  ShiftSummaryPanel,
  type ShiftSummaryShift,
} from "@/components/tools/ShiftSummaryPanel";
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
}

export function MicFilterTool({
  mode,
  onModeChange,
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
  const [shift, setShift] = useState<ShiftSummaryShift>("morning");
  const [summaryDate, setSummaryDate] = useState(() => getTodayLabel());
  const [hasEditedSummaryDate, setHasEditedSummaryDate] = useState(false);
  const [acIncrease, setAcIncrease] = useState(0);
  const [acDecrease, setAcDecrease] = useState(0);
  const [roomFeedbackCount, setRoomFeedbackCount] = useState(0);
  const [roomFeedbackDetails, setRoomFeedbackDetails] = useState<string[]>([]);
  const [borrowedItemCount, setBorrowedItemCount] = useState(0);
  const [borrowedItemDetails, setBorrowedItemDetails] = useState<string[]>([]);
  const [usedBatteryCount, setUsedBatteryCount] = useState(0);
  const [extraBatteryCount, setExtraBatteryCount] = useState(0);
  const alarmTimeoutsRef = useRef<Map<string, number>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  const expectedDateLabel = getTomorrowLabel();
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
    if (report?.studyDateLabel && !hasEditedSummaryDate) {
      setSummaryDate(report.studyDateLabel);
    }
  }, [hasEditedSummaryDate, report?.studyDateLabel]);

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
      const nextReport = await processMicFilterFile(file);

      setReport(nextReport);
      setToast({
        tone: "success",
        title: `Đã lọc xong file cho ngày ${nextReport.studyDateLabel}.`,
        description: `Sheet đang xử lý: ${nextReport.sheetName}. Hai bảng kết quả đã sẵn sàng để bạn thao tác.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xử lý file Excel.";

      setFileError({
        title: message,
        description:
          message === "Ngày học không phải ngày mai, bạn có tải lên đúng file?"
            ? `Ngày cần có trong file là ${expectedDateLabel}. Bạn hãy chọn lại file lịch học của ngày mai.`
            : "Bạn có thể kiểm tra lại file rồi tải lên lại ngay ở khung chọn file bên trên.",
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
    setInputKey((current) => current + 1);

    if (!hasEditedSummaryDate) {
      setSummaryDate(getTodayLabel());
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
          reportDateLabel={report?.studyDateLabel ?? null}
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
          onShiftChange={setShift}
          onSummaryDateChange={(value) => {
            setSummaryDate(value);
            setHasEditedSummaryDate(true);
          }}
          onUseReportDate={
            report?.studyDateLabel
              ? () => {
                  setSummaryDate(report.studyDateLabel);
                  setHasEditedSummaryDate(false);
                }
              : undefined
          }
          onAdjustAcIncrease={(delta) => adjustCounter(setAcIncrease, delta)}
          onAdjustAcDecrease={(delta) => adjustCounter(setAcDecrease, delta)}
          onIncreaseRoomFeedback={increaseRoomFeedback}
          onDecreaseRoomFeedback={decreaseRoomFeedback}
          onUpdateRoomFeedbackDetail={updateRoomFeedbackDetail}
          onIncreaseBorrowedItem={increaseBorrowedItem}
          onDecreaseBorrowedItem={decreaseBorrowedItem}
          onUpdateBorrowedItemDetail={updateBorrowedItemDetail}
          onAdjustUsedBattery={(delta) =>
            adjustCounter(setUsedBatteryCount, delta)
          }
          onAdjustExtraBattery={(delta) =>
            adjustCounter(setExtraBatteryCount, delta)
          }
          onCopySummary={() => void handleCopySummary()}
        />
      ) : (
        <>
          <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-5">
            <UploadCard
              expectedDateLabel={expectedDateLabel}
              isLoading={isLoading}
              selectedFileName={selectedFileName}
              fileError={fileError}
              canReset={canReset}
              inputKey={inputKey}
              onReset={handleReset}
              onFileChange={handleFileChange}
            />

            <AlarmCard
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
                    ? `Đang hiển thị kết quả từ sheet ${report.sheetName} cho ngày ${report.studyDateLabel}.`
                    : "Tải file Excel để hệ thống cập nhật ngay Bảng 1 và Bảng 2 ở khu vực này."}
                </p>
              </div>

              {report && (
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 lg:self-auto">
                  <CheckCircle2 size={16} />
                  Ngày học {report.studyDateLabel}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <MorningResultCard report={report} />
              <MiddayResultCard report={report} />
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
                  caption={`Chuẩn bị cho ngày ${report.studyDateLabel}`}
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
                studyDateLabel={report.studyDateLabel}
                expectedDateLabel={expectedDateLabel}
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

  function adjustCounter(
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number,
  ) {
    setter((current) => Math.max(0, current + delta));
  }

  function increaseRoomFeedback() {
    setRoomFeedbackCount((current) => current + 1);
    setRoomFeedbackDetails((current) => [...current, ""]);
  }

  function decreaseRoomFeedback() {
    setRoomFeedbackCount((current) => Math.max(0, current - 1));
    setRoomFeedbackDetails((current) => current.slice(0, -1));
  }

  function updateRoomFeedbackDetail(index: number, value: string) {
    setRoomFeedbackDetails((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function increaseBorrowedItem() {
    setBorrowedItemCount((current) => current + 1);
    setBorrowedItemDetails((current) => [...current, ""]);
  }

  function decreaseBorrowedItem() {
    setBorrowedItemCount((current) => Math.max(0, current - 1));
    setBorrowedItemDetails((current) => current.slice(0, -1));
  }

  function updateBorrowedItemDetail(index: number, value: string) {
    setBorrowedItemDetails((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
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
  expectedDateLabel,
  isLoading,
  selectedFileName,
  fileError,
  canReset,
  inputKey,
  onReset,
  onFileChange,
}: {
  expectedDateLabel: string;
  isLoading: boolean;
  selectedFileName: string | null;
  fileError: InlineErrorState | null;
  canReset: boolean;
  inputKey: number;
  onReset: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-cyan-400/15 bg-[linear-gradient(180deg,_rgba(7,17,38,0.98)_0%,_rgba(5,14,31,0.98)_100%)] p-5 shadow-[0_24px_70px_-36px_rgba(14,165,233,0.4)] xl:col-span-3">
      <LogicHoverCard expectedDateLabel={expectedDateLabel} />

      <div className="pr-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-100 shadow-lg shadow-cyan-400/10">
              <UploadCloud size={22} />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white">
              Tải lịch học
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Chọn file Excel để lọc nhanh. Sau khi xử lý xong, hai bảng kết quả
              bên dưới sẽ cập nhật ngay.
            </p>
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
          {ENFORCE_TOMORROW_STUDY_DATE ? (
            <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
              Ngày cần có trong file: {expectedDateLabel}
            </span>
          ) : (
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
              Tạm tắt kiểm tra ngày học
            </span>
          )}
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
  report,
  currentTime,
  visibleAlarmCandidates,
  scheduledAlarms,
  onScheduleAlarm,
  onCancelAlarm,
}: {
  report: MicFilterReport | null;
  currentTime: Date;
  visibleAlarmCandidates: SpecialAlarmCandidate[];
  scheduledAlarms: Record<string, ScheduledAlarmState>;
  onScheduleAlarm: (candidate: SpecialAlarmCandidate) => Promise<void>;
  onCancelAlarm: (candidate: SpecialAlarmCandidate) => void;
}) {
  const hasAnyAlarmCandidates = Boolean(report?.specialAlarmCandidates.length);

  return (
    <section className="h-full rounded-[1.75rem] border border-sky-400/15 bg-[linear-gradient(180deg,_rgba(8,24,43,0.98)_0%,_rgba(6,17,34,0.98)_100%)] p-5 shadow-[0_24px_70px_-36px_rgba(56,189,248,0.35)] xl:col-span-2">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/12 text-sky-100 shadow-lg shadow-sky-400/10">
        <Bell size={22} />
      </div>

      <h3 className="mt-4 text-2xl font-bold text-white">
        Đặt báo thức máy lạnh
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Gợi ý tự động dựa trên ca 9h20 và nhóm ca 15h - 16h. Card này luôn nằm
        cạnh upload để bạn thao tác nhanh khi cần.
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
                : "Hiện tool chỉ gợi ý báo thức cho các ca 9h20 và nhóm ca bắt đầu từ 15h đến 16h."}
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

function MorningResultCard({ report }: { report: MicFilterReport | null }) {
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
                    <RoomTextList rooms={row.rooms} />
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

function MiddayResultCard({ report }: { report: MicFilterReport | null }) {
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
                    <RoomTextList rooms={row.collectRooms} />
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <RoomTextList rooms={row.distributeRooms} />
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <RoomTextList rooms={row.replaceBatteryRooms} />
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
  expectedDateLabel,
}: {
  fileName: string;
  sheetName: string;
  studyDateLabel: string;
  expectedDateLabel: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-800 bg-[#07101f]/90 p-6">
      <h3 className="text-2xl font-bold text-white">Thông tin đọc file</h3>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Tên file" value={fileName} />
        <InfoItem label="Sheet đang đọc" value={sheetName} />
        <InfoItem label="Ngày học trong file" value={studyDateLabel} />
        <InfoItem
          label="Kiểm tra ngày học"
          value={
            ENFORCE_TOMORROW_STUDY_DATE
              ? `Đang so với ${expectedDateLabel}`
              : "Đang tạm tắt"
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

function LogicHoverCard({
  expectedDateLabel,
}: {
  expectedDateLabel: string;
}) {
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
          <p>
            Ca sáng: <span className="font-semibold text-white">07:30 - 11:35</span>
          </p>
          <p>
            Ca chiều:{" "}
            <span className="font-semibold text-white">12:30 - 16:35</span>
          </p>
          <p>
            Ca tối: <span className="font-semibold text-white">18:00 - 20:15</span>
          </p>
          <p>
            Bảng 1 hiển thị các phòng mic không dây có học trong{" "}
            <span className="font-semibold text-white">
              {SHIFT_WINDOWS.morning.label}
            </span>
            .
          </p>
          <p>
            Bảng 2 chia theo tầng: Thu nếu chỉ dùng sáng, Phát nếu chỉ dùng
            chiều, Thay Pin nếu dùng cả sáng và chiều.
          </p>
          <p>
            {ENFORCE_TOMORROW_STUDY_DATE
              ? `Cột Ngày học đang được so với ngày mai: ${expectedDateLabel}.`
              : "Hiện đang tạm tắt kiểm tra Ngày học để bạn thử bằng file cũ."}
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

function RoomTextList({ rooms }: { rooms: string[] }) {
  if (rooms.length === 0) {
    return <span className="text-slate-500">-</span>;
  }

  return <span>{rooms.join(", ")}</span>;
}

function getTomorrowLabel() {
  const tomorrow = new Date();

  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toLocaleDateString("vi-VN");
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
