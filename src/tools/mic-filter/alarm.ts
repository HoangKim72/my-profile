import type {
  ParsedMicScheduleRow,
  SpecialAlarmCandidate,
} from "@/tools/mic-filter/types";

interface SpecialAlarmRule {
  id: string;
  matchStartFromMinutes: number;
  matchStartToMinutes: number;
  classStartMinutes: number;
  classStartLabel: string;
  alarmMinutes: number;
  alarmLabel: string;
  promptWindowStartMinutes: number;
  promptWindowEndMinutes: number;
  promptMessage: string;
}

const SPECIAL_ALARM_RULES: SpecialAlarmRule[] = [
  {
    id: "aircon-0920",
    matchStartFromMinutes: 9 * 60 + 20,
    matchStartToMinutes: 9 * 60 + 20,
    classStartMinutes: 9 * 60 + 20,
    classStartLabel: "9h20",
    alarmMinutes: 9 * 60,
    alarmLabel: "9h",
    promptWindowStartMinutes: 5 * 60,
    promptWindowEndMinutes: 9 * 60 + 20,
    promptMessage:
      "Phát hiện có ca học lúc 9h20. Có muốn đặt lịch thông báo lúc 9h để bật máy lạnh không?",
  },
  {
    id: "aircon-1520",
    matchStartFromMinutes: 15 * 60,
    matchStartToMinutes: 16 * 60,
    classStartMinutes: 15 * 60,
    classStartLabel: "15h - 16h",
    alarmMinutes: 15 * 60,
    alarmLabel: "15h",
    promptWindowStartMinutes: 12 * 60 + 30,
    promptWindowEndMinutes: 15 * 60 + 30,
    promptMessage:
      "Phát hiện có ca học bắt đầu từ 15h đến 16h. Có muốn đặt lịch thông báo lúc 15h để bật máy lạnh không?",
  },
];

export function buildSpecialAlarmCandidates(rows: ParsedMicScheduleRow[]) {
  return SPECIAL_ALARM_RULES.flatMap((rule) => {
    const matchedRows = rows.filter(
      (row) =>
        row.startMinutes >= rule.matchStartFromMinutes &&
        row.startMinutes <= rule.matchStartToMinutes,
    );

    if (matchedRows.length === 0) {
      return [];
    }

    return [
      {
        id: rule.id,
        classStartMinutes: rule.classStartMinutes,
        classStartLabel: rule.classStartLabel,
        alarmMinutes: rule.alarmMinutes,
        alarmLabel: rule.alarmLabel,
        promptMessage: rule.promptMessage,
        promptWindowStartMinutes: rule.promptWindowStartMinutes,
        promptWindowEndMinutes: rule.promptWindowEndMinutes,
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
