import type { MicFilterReport } from "@/tools/mic-filter/types";

// Persists one working day of the mic tool in localStorage: the filtered
// report and the "Kết ca" form. Anything from another day is
// dropped so a new shift always starts clean.

export const MIC_SESSION_STORAGE_KEY = "mic-filter:session:v1";

export type ShiftSummaryShift = "morning" | "afternoon";

export interface ShiftSummaryState {
  shift: ShiftSummaryShift;
  summaryDate: string;
  hasEditedSummaryDate: boolean;
  acIncrease: number;
  acDecrease: number;
  roomFeedbackDetails: string[];
  borrowedItemDetails: string[];
  usedBatteryCount: number;
  extraBatteryCount: number;
}

export interface MicSession {
  version: 1;
  dayKey: string;
  report: MicFilterReport | null;
  summary: ShiftSummaryState;
}

export function getDayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getDateLabel(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export function createEmptySummary(now: Date): ShiftSummaryState {
  return {
    shift: now.getHours() >= 12 ? "afternoon" : "morning",
    summaryDate: getDateLabel(now),
    hasEditedSummaryDate: false,
    acIncrease: 0,
    acDecrease: 0,
    roomFeedbackDetails: [],
    borrowedItemDetails: [],
    usedBatteryCount: 0,
    extraBatteryCount: 0,
  };
}

export function createEmptySession(now: Date): MicSession {
  return {
    version: 1,
    dayKey: getDayKey(now),
    report: null,
    summary: createEmptySummary(now),
  };
}

export function serializeMicSession(session: MicSession) {
  return JSON.stringify(session);
}

// Returns null when there is nothing usable for today
export function parseMicSession(
  raw: string | null | undefined,
  now: Date,
): MicSession | null {
  if (!raw) {
    return null;
  }

  let value: unknown;

  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(value) || value.version !== 1) {
    return null;
  }

  if (value.dayKey !== getDayKey(now)) {
    return null;
  }

  const fallbackSummary = createEmptySummary(now);
  const summary = isRecord(value.summary) ? value.summary : {};

  return {
    version: 1,
    dayKey: value.dayKey,
    report: isReport(value.report) ? value.report : null,
    summary: {
      shift:
        summary.shift === "afternoon" || summary.shift === "morning"
          ? summary.shift
          : fallbackSummary.shift,
      summaryDate:
        typeof summary.summaryDate === "string"
          ? summary.summaryDate
          : fallbackSummary.summaryDate,
      hasEditedSummaryDate: summary.hasEditedSummaryDate === true,
      acIncrease: toCount(summary.acIncrease),
      acDecrease: toCount(summary.acDecrease),
      roomFeedbackDetails: toStringList(summary.roomFeedbackDetails),
      borrowedItemDetails: toStringList(summary.borrowedItemDetails),
      usedBatteryCount: toCount(summary.usedBatteryCount),
      extraBatteryCount: toCount(summary.extraBatteryCount),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isReport(value: unknown): value is MicFilterReport {
  return (
    isRecord(value) &&
    Array.isArray(value.morningRows) &&
    Array.isArray(value.middayRows) &&
    Array.isArray(value.specialAlarmCandidates) &&
    typeof value.sheetName === "string"
  );
}

function toStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 500)
    : [];
}

function toCount(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? Math.min(value, 9999)
    : 0;
}
