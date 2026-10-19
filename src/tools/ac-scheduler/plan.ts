import { normalizeSearchableText } from "@/tools/mic-filter/processor";
import {
  AC_BUILDING,
  AC_EARLIEST_START_MINUTES,
  AC_LATEST_END_MINUTES,
  AC_UTC_OFFSET_MINUTES,
  type AcSchedulerConfig,
} from "@/tools/ac-scheduler/config";
import type { AcScheduleRow } from "@/tools/ac-scheduler/parser";

// "E1-12.02", "E1-04.05/1"
const BUILDING_ROOM_PATTERN = new RegExp(`^${AC_BUILDING}-\\d{2}\\.\\d{2}(/\\d+)?$`);

// Notes that cancel the class ("Đã báo nghỉ", "Da bao nghi", "báo nghỉ")
const CANCEL_NOTE_KEYWORDS = ["bao nghi"];
// Notes that are known to have nothing to do with the room being used
const HARMLESS_NOTE_KEYWORDS = ["khong phat mic"];

export type AcSkipReason = "not-building" | "cancelled" | "no-ac";

export const AC_SKIP_REASON_LABELS: Record<AcSkipReason, string> = {
  "not-building": `Không thuộc ${AC_BUILDING}`,
  cancelled: "Đã báo nghỉ",
  "no-ac": "Phòng không có máy lạnh / chưa ánh xạ",
};

export interface AcUnitRef {
  id: string;
  name: string;
  roomCodes: string[];
}

// One continuous period a unit must run: classes of its rooms that follow
// each other within the pre-cool lead are merged so the unit is not
// switched off and straight back on.
export interface AcWindow {
  unitId: string;
  unitName: string;
  roomCodes: string[];
  rowNumbers: number[];
  classStartMinutes: number;
  classEndMinutes: number;
  onAtMinutes: number;
  offAtMinutes: number;
}

export interface AcPlan {
  dateKey: string;
  totalRows: number;
  buildingRows: number;
  skipped: Array<{
    rowNumber: number;
    roomCode: string;
    reason: AcSkipReason;
    note: string | null;
  }>;
  // Unusual notes on rows that will still run; a human should read them
  noteWarnings: Array<{ rowNumber: number; roomCode: string; note: string }>;
  unmappedRooms: string[];
  windows: AcWindow[];
  unitCount: number;
  // Highest number of units running at the same moment
  peakConcurrentUnits: number;
}

export class AcPlanError extends Error {}

export function isBuildingRoom(roomCode: string) {
  return BUILDING_ROOM_PATTERN.test(roomCode);
}

export function isCancelledNote(note: string | null) {
  const text = normalizeSearchableText(note);

  return CANCEL_NOTE_KEYWORDS.some((keyword) => text.includes(keyword));
}

function isHarmlessNote(note: string | null) {
  const text = normalizeSearchableText(note);

  return (
    text.length === 0 || HARMLESS_NOTE_KEYWORDS.some((keyword) => text.includes(keyword))
  );
}

export function buildAcPlan(
  rows: AcScheduleRow[],
  options: {
    todayKey: string;
    units: AcUnitRef[];
    config: Pick<AcSchedulerConfig, "leadMinutes">;
  },
): AcPlan {
  if (rows.length === 0) {
    throw new AcPlanError("File không có dòng lịch nào.");
  }

  assertSingleDate(rows, options.todayKey);

  const unitsByRoom = new Map<string, AcUnitRef[]>();

  options.units.forEach((unit) => {
    unit.roomCodes.forEach((roomCode) => {
      const list = unitsByRoom.get(roomCode) ?? [];
      list.push(unit);
      unitsByRoom.set(roomCode, list);
    });
  });

  const skipped: AcPlan["skipped"] = [];
  const noteWarnings: AcPlan["noteWarnings"] = [];
  const unmapped = new Set<string>();
  const classesByUnit = new Map<
    string,
    { unit: AcUnitRef; classes: Array<{ row: AcScheduleRow; start: number; end: number }> }
  >();
  let buildingRows = 0;

  rows.forEach((row) => {
    if (!isBuildingRoom(row.roomCode)) {
      skipped.push({ rowNumber: row.rowNumber, roomCode: row.roomCode, reason: "not-building", note: row.note });
      return;
    }

    buildingRows += 1;
    const { start, end } = assertValidTimes(row);

    if (isCancelledNote(row.note)) {
      skipped.push({ rowNumber: row.rowNumber, roomCode: row.roomCode, reason: "cancelled", note: row.note });
      return;
    }

    const units = unitsByRoom.get(row.roomCode);

    if (!units || units.length === 0) {
      unmapped.add(row.roomCode);
      skipped.push({ rowNumber: row.rowNumber, roomCode: row.roomCode, reason: "no-ac", note: row.note });
      return;
    }

    if (row.note && !isHarmlessNote(row.note)) {
      noteWarnings.push({ rowNumber: row.rowNumber, roomCode: row.roomCode, note: row.note });
    }

    units.forEach((unit) => {
      const entry = classesByUnit.get(unit.id) ?? { unit, classes: [] };
      entry.classes.push({ row, start, end });
      classesByUnit.set(unit.id, entry);
    });
  });

  const windows = [...classesByUnit.values()]
    .flatMap(({ unit, classes }) => mergeClasses(unit, classes, options.config.leadMinutes))
    .sort(
      (left, right) =>
        left.onAtMinutes - right.onAtMinutes ||
        left.unitName.localeCompare(right.unitName, "vi-VN", { numeric: true }),
    );

  return {
    dateKey: options.todayKey,
    totalRows: rows.length,
    buildingRows,
    skipped,
    noteWarnings,
    unmappedRooms: [...unmapped].sort(),
    windows,
    unitCount: classesByUnit.size,
    peakConcurrentUnits: peakConcurrency(windows),
  };
}

function assertSingleDate(rows: AcScheduleRow[], todayKey: string) {
  const missing = rows.find((row) => !row.dateKey);

  if (missing) {
    throw new AcPlanError(`Dòng ${missing.rowNumber} thiếu hoặc sai "Ngày học".`);
  }

  const dateKeys = new Set(rows.map((row) => row.dateKey));

  if (dateKeys.size > 1) {
    throw new AcPlanError(
      `File có lịch của nhiều ngày (${[...dateKeys].map((key) => formatDateKey(key!)).join(", ")}). Chỉ nhận file của đúng một ngày.`,
    );
  }

  const [dateKey] = dateKeys;

  if (dateKey !== todayKey) {
    throw new AcPlanError(
      `Lịch là của ngày ${formatDateKey(dateKey!)}, hôm nay là ${formatDateKey(todayKey)}. Chỉ nhận lịch của hôm nay.`,
    );
  }
}

function assertValidTimes(row: AcScheduleRow) {
  const { startMinutes: start, endMinutes: end } = row;

  if (start === null || end === null) {
    throw new AcPlanError(`Không đọc được giờ học ở dòng ${row.rowNumber} (${row.roomCode}).`);
  }

  if (start >= end) {
    throw new AcPlanError(`Giờ bắt đầu không trước giờ kết thúc ở dòng ${row.rowNumber} (${row.roomCode}).`);
  }

  if (start < AC_EARLIEST_START_MINUTES || end > AC_LATEST_END_MINUTES) {
    throw new AcPlanError(
      `Giờ học ${formatMinutes(start)}–${formatMinutes(end)} ở dòng ${row.rowNumber} (${row.roomCode}) nằm ngoài ${formatMinutes(AC_EARLIEST_START_MINUTES)}–${formatMinutes(AC_LATEST_END_MINUTES)}.`,
    );
  }

  return { start, end };
}

function mergeClasses(
  unit: AcUnitRef,
  classes: Array<{ row: AcScheduleRow; start: number; end: number }>,
  leadMinutes: number,
): AcWindow[] {
  const sorted = [...classes].sort((left, right) => left.start - right.start || left.end - right.end);
  const windows: AcWindow[] = [];

  sorted.forEach(({ row, start, end }) => {
    const current = windows[windows.length - 1];

    // The next class would need the unit on before the current one ends
    if (current && start - leadMinutes <= current.offAtMinutes) {
      current.classEndMinutes = Math.max(current.classEndMinutes, end);
      current.offAtMinutes = current.classEndMinutes;
      current.rowNumbers.push(row.rowNumber);
      if (!current.roomCodes.includes(row.roomCode)) current.roomCodes.push(row.roomCode);
      return;
    }

    windows.push({
      unitId: unit.id,
      unitName: unit.name,
      roomCodes: [row.roomCode],
      rowNumbers: [row.rowNumber],
      classStartMinutes: start,
      classEndMinutes: end,
      onAtMinutes: Math.max(0, start - leadMinutes),
      offAtMinutes: end,
    });
  });

  return windows;
}

function peakConcurrency(windows: AcWindow[]) {
  let peak = 0;

  windows.forEach((window) => {
    const running = new Set(
      windows
        .filter((other) => other.onAtMinutes <= window.onAtMinutes && other.offAtMinutes > window.onAtMinutes)
        .map((other) => other.unitId),
    );
    peak = Math.max(peak, running.size);
  });

  return peak;
}

export type AcTurnOnTiming =
  | { kind: "scheduled" }
  | { kind: "late"; lateMinutes: number }
  | { kind: "too-late" };

// What happens to a window's turn-on when the schedule is used at `nowMinutes`.
// Mirrored in agent/ac-agent/agent.py (classify_turn_on).
export function classifyTurnOn(
  nowMinutes: number,
  window: Pick<AcWindow, "onAtMinutes" | "offAtMinutes">,
  config: Pick<AcSchedulerConfig, "minRemainingMinutes">,
): AcTurnOnTiming {
  if (nowMinutes <= window.onAtMinutes) {
    return { kind: "scheduled" };
  }

  if (window.offAtMinutes - nowMinutes < config.minRemainingMinutes) {
    return { kind: "too-late" };
  }

  return { kind: "late", lateMinutes: nowMinutes - window.onAtMinutes };
}

// ---------- time helpers (fixed UTC+7) ----------

function shiftToLocal(date: Date) {
  return new Date(date.getTime() + AC_UTC_OFFSET_MINUTES * 60_000);
}

export function getAcTodayKey(now: Date = new Date()) {
  const local = shiftToLocal(now);

  return [
    local.getUTCFullYear(),
    String(local.getUTCMonth() + 1).padStart(2, "0"),
    String(local.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function getAcNowMinutes(now: Date = new Date()) {
  const local = shiftToLocal(now);

  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

export function acLocalTimeToDate(dateKey: string, minutes: number) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day, 0, minutes) - AC_UTC_OFFSET_MINUTES * 60_000);
}

export function formatMinutes(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-");

  return `${day}/${month}/${year}`;
}
