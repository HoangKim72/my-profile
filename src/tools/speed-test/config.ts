import type { ConfigOptions, MeasurementConfig } from "@cloudflare/speedtest";

// Cloudflare's default set without the 100 MB / 250 MB / 50 MB rounds and
// without packet loss (needs our own TURN server). Worst case ≈ 146 MB;
// the engine stops ramping a direction once a request takes ≥ 1 s.
export const MEASUREMENTS: MeasurementConfig[] = [
  { type: "latency", numPackets: 1 },
  { type: "download", bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "latency", numPackets: 20 },
  { type: "download", bytes: 1e5, count: 9 },
  { type: "download", bytes: 1e6, count: 8 },
  { type: "upload", bytes: 1e5, count: 8 },
  { type: "upload", bytes: 1e6, count: 6 },
  { type: "download", bytes: 1e7, count: 4 },
  { type: "upload", bytes: 1e7, count: 4 },
  { type: "download", bytes: 2.5e7, count: 2 },
];

export const ENGINE_OPTIONS: ConfigOptions = {
  autoStart: true,
  measurements: MEASUREMENTS,
  // Results are not sent to Cloudflare's AIM endpoint: the tool stores nothing
  logAimApiUrl: null,
};

export function estimateMaxBytes(measurements: MeasurementConfig[]) {
  let download = 0;
  let upload = 0;

  for (const measurement of measurements) {
    if (measurement.type === "download") {
      download += measurement.bytes * measurement.count;
    } else if (measurement.type === "upload") {
      upload += measurement.bytes * measurement.count;
    }
  }

  return { download, upload };
}
