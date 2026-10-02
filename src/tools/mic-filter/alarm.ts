import {
  DEFAULT_MIC_FILTER_CONFIG,
  describeAlarmRule,
  type MicFilterAlarmRule,
} from "@/tools/mic-filter/config";
import type {
  ParsedMicScheduleRow,
  SpecialAlarmCandidate,
} from "@/tools/mic-filter/types";

export function buildSpecialAlarmCandidates(
  rows: ParsedMicScheduleRow[],
  rules: MicFilterAlarmRule[] = DEFAULT_MIC_FILTER_CONFIG.alarmRules,
) {
  return rules.flatMap((rule) => {
    const matchedRows = rows.filter(
      (row) =>
        row.startMinutes >= rule.matchFromMinutes &&
        row.startMinutes <= rule.matchToMinutes,
    );

    if (matchedRows.length === 0) {
      return [];
    }

    return [
      {
        id: rule.id,
        ...describeAlarmRule(rule),
        alarmMinutes: rule.alarmMinutes,
        promptWindowStartMinutes: rule.promptFromMinutes,
        promptWindowEndMinutes: rule.promptToMinutes,
        matchedScheduleCount: matchedRows.length,
        matchedRooms: sortRoomDisplays(
          matchedRows.map((row) => `${row.floor}.${row.roomDisplay}`),
        ),
      } satisfies SpecialAlarmCandidate,
    ];
  });
}

export function getSpecialAlarmOfferState(
  candidate: SpecialAlarmCandidate,
  now: Date,
) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (currentMinutes < candidate.promptWindowStartMinutes) {
    return {
      shouldShow: false,
      reason: "too-early",
    } as const;
  }

  if (currentMinutes > candidate.promptWindowEndMinutes) {
    return {
      shouldShow: false,
      reason: "too-late",
    } as const;
  }

  return {
    shouldShow: true,
    reason: "within-window",
  } as const;
}

export function buildAlarmSchedulePlan(
  candidate: SpecialAlarmCandidate,
  now: Date,
) {
  const targetDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    Math.floor(candidate.alarmMinutes / 60),
    candidate.alarmMinutes % 60,
    0,
    0,
  );
  const classStartDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    Math.floor(candidate.classStartMinutes / 60),
    candidate.classStartMinutes % 60,
    0,
    0,
  );

  return {
    targetDate,
    classStartDate,
    shouldTriggerImmediately: now >= targetDate,
    delayMs: Math.max(targetDate.getTime() - now.getTime(), 0),
  };
}

function sortRoomDisplays(rooms: string[]) {
  return [...new Set(rooms)].sort((left, right) =>
    left.localeCompare(right, "vi-VN", {
      numeric: true,
    }),
  );
}
