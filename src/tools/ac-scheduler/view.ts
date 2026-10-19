import { AC_TIME_ZONE } from "@/tools/ac-scheduler/config";

// Serializable shapes passed from the server page to the client workspace

export type AcViewJobStatus = "PENDING" | "RUNNING" | "DONE" | "SKIPPED" | "FAILED" | "CANCELLED";

export interface AcViewJob {
  id: string;
  scheduleId: string;
  action: "ON" | "OFF";
  status: AcViewJobStatus;
  runAt: string;
  windowStart: string;
  windowEnd: string;
  roomCodes: string[];
  unitName: string;
  result: string | null;
}

export interface AcViewEvent {
  id: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  unitName: string | null;
  actor: string | null;
  createdAt: string;
}

export interface AcViewUnit {
  id: string;
  name: string;
  roomCodes: string[];
  enabled: boolean;
  isRunning: boolean | null;
  stateAt: string | null;
}

export interface AcViewSchedule {
  id: string;
  status: "ACTIVE" | "SUPERSEDED" | "CANCELLED";
  fileName: string;
  createdByEmail: string;
  createdAt: string;
}

export interface AcViewAgent {
  id: string;
  name: string;
  lastSeenAt: string | null;
}

const clockFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: AC_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const clockWithSecondsFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: AC_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function formatAcClock(iso: string, withSeconds = false) {
  return (withSeconds ? clockWithSecondsFormatter : clockFormatter).format(new Date(iso));
}

export const AC_JOB_STATUS_LABELS: Record<AcViewJobStatus, string> = {
  PENDING: "Chờ",
  RUNNING: "Đang gửi",
  DONE: "Xong",
  SKIPPED: "Bỏ qua",
  FAILED: "Lỗi",
  CANCELLED: "Đã huỷ",
};
