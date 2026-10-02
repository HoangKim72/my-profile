import { z } from "zod";
import { SHIFT_WINDOWS, WIRELESS_MIC_ROOMS } from "@/tools/mic-filter/constants";

// Runtime-editable settings for the mic tool. Stored in `tool_settings`
// under MIC_FILTER_SETTINGS_KEY; the defaults below (from constants.ts) are
// used whenever nothing valid is stored.

export const MIC_FILTER_SETTINGS_KEY = "mic-filter";

export const MINUTES_PER_DAY = 24 * 60;

export const ROOM_CODE_PATTERN = /^[A-Z0-9]+-\d{2}\.\d{2}$/;

export type ShiftKey = "morning" | "afternoon" | "evening";

export const SHIFT_LABELS: Record<ShiftKey, string> = {
  morning: "Ca sáng",
  afternoon: "Ca chiều",
  evening: "Ca tối",
};

export interface ShiftWindow {
  startMinutes: number;
  endMinutes: number;
}

export interface MicFilterAlarmRule {
  id: string;
  // A class starting within [matchFrom, matchTo] triggers the suggestion
  matchFromMinutes: number;
  matchToMinutes: number;
  // When the reminder rings
  alarmMinutes: number;
  // The suggestion is only offered while the clock is inside this window
  promptFromMinutes: number;
  promptToMinutes: number;
}

export interface MicFilterConfig {
  version: 1;
  wirelessRooms: string[];
  shifts: Record<ShiftKey, ShiftWindow>;
  alarmRules: MicFilterAlarmRule[];
}

export const DEFAULT_MIC_FILTER_CONFIG: MicFilterConfig = {
  version: 1,
  wirelessRooms: [...WIRELESS_MIC_ROOMS],
  shifts: {
    morning: pickWindow(SHIFT_WINDOWS.morning),
    afternoon: pickWindow(SHIFT_WINDOWS.afternoon),
    evening: pickWindow(SHIFT_WINDOWS.evening),
  },
  alarmRules: [
    {
      id: "aircon-0920",
      matchFromMinutes: 9 * 60 + 20,
      matchToMinutes: 9 * 60 + 20,
      alarmMinutes: 9 * 60,
      promptFromMinutes: 5 * 60,
      promptToMinutes: 9 * 60 + 20,
    },
    {
      id: "aircon-1520",
      matchFromMinutes: 15 * 60,
      matchToMinutes: 16 * 60,
      alarmMinutes: 15 * 60,
      promptFromMinutes: 12 * 60 + 30,
      promptToMinutes: 15 * 60 + 30,
    },
  ],
};

const minuteSchema = z
  .number({ invalid_type_error: "Giờ không hợp lệ" })
  .int()
  .min(0, "Giờ không hợp lệ")
  .max(MINUTES_PER_DAY - 1, "Giờ không hợp lệ");

const shiftWindowSchema = z
  .object({ startMinutes: minuteSchema, endMinutes: minuteSchema })
  .refine((window) => window.startMinutes < window.endMinutes, {
    message: "Giờ bắt đầu ca phải trước giờ kết thúc",
  });

const alarmRuleSchema = z
  .object({
    id: z.string().trim().min(1).max(40),
    matchFromMinutes: minuteSchema,
    matchToMinutes: minuteSchema,
    alarmMinutes: minuteSchema,
    promptFromMinutes: minuteSchema,
    promptToMinutes: minuteSchema,
  })
  .refine((rule) => rule.matchFromMinutes <= rule.matchToMinutes, {
    message: "Khung giờ bắt đầu lớp của rule nhắc bị ngược",
  })
  .refine((rule) => rule.promptFromMinutes <= rule.promptToMinutes, {
    message: "Khung giờ hiện gợi ý của rule nhắc bị ngược",
  });

export const micFilterConfigSchema = z.object({
  version: z.literal(1).default(1),
  wirelessRooms: z
    .array(z.string())
    .transform(normalizeRoomList)
    .pipe(
      z
        .array(
          z.string().regex(ROOM_CODE_PATTERN, {
            message: "Mã phòng phải có dạng E1-05.07",
          }),
        )
        .min(1, "Cần ít nhất 1 phòng mic không dây")
        .max(500),
    ),
  shifts: z.object({
    morning: shiftWindowSchema,
    afternoon: shiftWindowSchema,
    evening: shiftWindowSchema,
  }),
  alarmRules: z
    .array(alarmRuleSchema)
    .max(20)
    .refine(
      (rules) => new Set(rules.map((rule) => rule.id)).size === rules.length,
      { message: "Mỗi rule nhắc cần id riêng" },
    ),
});

// Stored values are trusted only after validation; anything broken falls back
// to the defaults so the daily tool keeps working.
export function parseMicFilterConfig(value: unknown): MicFilterConfig {
  const parsed = micFilterConfigSchema.safeParse(value);

  return parsed.success ? parsed.data : DEFAULT_MIC_FILTER_CONFIG;
}

export function normalizeRoomList(rooms: string[]): string[] {
  const seen = new Set<string>();

  return rooms
    .map((room) => room.trim().toUpperCase())
    .filter((room) => {
      if (!room || seen.has(room)) {
        return false;
      }

      seen.add(room);
      return true;
    });
}

// 560 -> "9h20", 900 -> "15h"
export function formatHourLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, "0")}`;
}

// 450 -> "07:30"
export function formatClockValue(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
}

// "07:30" -> 450; null for anything that is not a valid HH:MM
export function parseClockValue(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

export function describeAlarmRule(rule: MicFilterAlarmRule) {
  const isExactStart = rule.matchFromMinutes === rule.matchToMinutes;
  const fromLabel = formatHourLabel(rule.matchFromMinutes);
  const toLabel = formatHourLabel(rule.matchToMinutes);
  const alarmLabel = formatHourLabel(rule.alarmMinutes);

  return {
    classStartMinutes: rule.matchFromMinutes,
    classStartLabel: isExactStart ? fromLabel : `${fromLabel} - ${toLabel}`,
    alarmLabel,
    promptMessage: isExactStart
      ? `Phát hiện có ca học lúc ${fromLabel}. Có muốn đặt lịch thông báo lúc ${alarmLabel} để bật máy lạnh không?`
      : `Phát hiện có ca học bắt đầu từ ${fromLabel} đến ${toLabel}. Có muốn đặt lịch thông báo lúc ${alarmLabel} để bật máy lạnh không?`,
  };
}

function pickWindow(window: ShiftWindow): ShiftWindow {
  return { startMinutes: window.startMinutes, endMinutes: window.endMinutes };
}
