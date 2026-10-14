import type { MeasurementSummary, Scores } from "@cloudflare/speedtest";
import { formatMbps, formatMs } from "@/tools/speed-test/format";

export type QualityLevel = "good" | "fair" | "poor" | "unknown";

export const EXPERIENCES = [
  { key: "streaming", label: "Xem video" },
  { key: "gaming", label: "Chơi game" },
  { key: "rtc", label: "Gọi video" },
] as const;

export type ExperienceKey = (typeof EXPERIENCES)[number]["key"];

export const QUALITY_LABEL: Record<QualityLevel, string> = {
  good: "Tốt",
  fair: "Khá",
  poor: "Kém",
  unknown: "Chưa đủ dữ liệu",
};

const LEVEL_BY_CLASSIFICATION: Record<string, QualityLevel> = {
  great: "good",
  good: "good",
  average: "fair",
  poor: "poor",
  bad: "poor",
};

export function toQualityLevel(name: string | undefined): QualityLevel {
  return (name && LEVEL_BY_CLASSIFICATION[name]) || "unknown";
}

export function getExperienceQualities(scores: Scores | undefined) {
  return EXPERIENCES.map(({ key, label }) => ({
    key,
    label,
    level: toQualityLevel(scores?.[key]?.classificationName),
  }));
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateTime(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildResultText(
  summary: MeasurementSummary,
  scores: Scores | undefined,
  measuredAt: Date,
  origin: string,
) {
  const qualities = getExperienceQualities(scores)
    .map(({ label, level }) => `${label}: ${QUALITY_LABEL[level]}`)
    .join(" · ");

  return [
    `Kết quả đo tốc độ mạng (${formatDateTime(measuredAt)})`,
    `Tải xuống: ${formatMbps(summary.download)} Mbps · Tải lên: ${formatMbps(summary.upload)} Mbps`,
    `Ping: ${formatMs(summary.latency)} ms · Dao động: ${formatMs(summary.jitter)} ms`,
    qualities,
    `Đo bằng Cloudflare tại ${origin}/tools/speed-test`,
  ].join("\n");
}
