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

// @cloudflare/speedtest 1.14.2 scores an unmeasured packet loss as 0 points,
// while 0% loss earns 10. We skip packet loss (it needs our own TURN server),
// so add those points back and reclassify with the engine's own thresholds
// (aimExperiencesDefs in dist/speedtest.js). Re-check when upgrading.
const ASSUMED_PACKET_LOSS_POINTS = 10;

const POINT_THRESHOLDS: Record<ExperienceKey, readonly number[]> = {
  streaming: [15, 20, 40, 60],
  gaming: [5, 15, 25, 30],
  rtc: [5, 15, 25, 40],
};

const CLASSIFICATIONS = ["bad", "poor", "average", "good", "great"] as const;

export function rescoreAssumingNoPacketLoss(
  scores: Scores | undefined,
): Scores | undefined {
  if (!scores) {
    return undefined;
  }

  const rescored: Scores = { ...scores };

  for (const { key } of EXPERIENCES) {
    const score = scores[key];

    if (!score) {
      continue;
    }

    const points = score.points + ASSUMED_PACKET_LOSS_POINTS;
    const classificationIdx = POINT_THRESHOLDS[key].filter(
      (threshold) => points >= threshold,
    ).length;

    rescored[key] = {
      points,
      classificationIdx,
      classificationName: CLASSIFICATIONS[classificationIdx],
    };
  }

  return rescored;
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
