const EMPTY = "—";

// The engine returns 0 for a category that has started but has no usable
// samples yet, so 0 means "not measured" rather than a real reading.
function isMeasured(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function withDecimalComma(value: string) {
  return value.replace(".", ",");
}

/** bps → Mbps, one decimal below 100, integer from 100 up. */
export function formatMbps(bps: number | undefined) {
  if (!isMeasured(bps)) {
    return EMPTY;
  }

  const mbps = bps / 1e6;

  return mbps >= 100
    ? String(Math.round(mbps))
    : withDecimalComma(mbps.toFixed(1));
}

export function formatMs(ms: number | undefined) {
  return isMeasured(ms) ? String(Math.round(ms)) : EMPTY;
}

export function formatMegabytes(bytes: number) {
  return String(Math.round(bytes / 1e6));
}
