import type {
  MeasurementConfig,
  MeasurementSummary,
} from "@cloudflare/speedtest";
import { formatMbps, formatMs } from "@/tools/speed-test/format";

export type Phase = "latency" | "download" | "upload";

/**
 * Whether a category has its final value. Bandwidth types keep `finished`
 * once their ramp ends; latency resets it at the start of every round, so it
 * is only final after the last latency round in the list.
 */
export function isCategoryDone(
  phase: Phase,
  finished: boolean,
  measurementId: number,
  measurements: readonly MeasurementConfig[],
) {
  if (!finished) {
    return false;
  }

  if (phase !== "latency") {
    return true;
  }

  return !measurements
    .slice(measurementId + 1)
    .some((measurement) => measurement.type === "latency");
}

// The last round (download) ends together with the run, so the closing
// announcement carries every final value instead of a per-category one.
export function buildFinalAnnouncement(summary: MeasurementSummary) {
  return `Đã đo xong. Tải xuống ${formatMbps(summary.download)} Mbps, tải lên ${formatMbps(summary.upload)} Mbps, ping ${formatMs(summary.latency)} ms.`;
}
