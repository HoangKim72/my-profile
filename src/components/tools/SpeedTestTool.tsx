"use client";

import { useEffect, useRef, useState } from "react";
import type SpeedTestEngine from "@cloudflare/speedtest";
import type {
  MeasurementSummary,
  MeasurementType,
  Scores,
} from "@cloudflare/speedtest";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Gauge,
  HelpCircle,
  MinusCircle,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Waves,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  type BadgeTone,
} from "@/components/ui";
import {
  ENGINE_OPTIONS,
  MEASUREMENTS,
  estimateMaxBytes,
} from "@/tools/speed-test/config";
import {
  formatMbps,
  formatMegabytes,
  formatMs,
} from "@/tools/speed-test/format";
import {
  buildFinalAnnouncement,
  isCategoryDone,
  type Phase,
} from "@/tools/speed-test/phases";
import {
  QUALITY_LABEL,
  buildResultText,
  getExperienceQualities,
  getQualityNote,
  rescoreAssumingNoPacketLoss,
  type QualityLevel,
} from "@/tools/speed-test/quality";

type Status = "idle" | "loading" | "running" | "paused" | "done" | "error";
type ErrorKind = "load" | "run" | "offline";

const ERROR_MESSAGE: Record<ErrorKind, { title: string; description: string }> = {
  offline: {
    title: "Thiết bị đang không có mạng",
    description: "Kết nối wifi hoặc dữ liệu di động rồi thử lại.",
  },
  load: {
    title: "Không tải được công cụ đo",
    description: "Kiểm tra kết nối rồi thử lại.",
  },
  run: {
    title: "Đo bị gián đoạn",
    description: "Vui lòng thử lại. Các số đã đo được vẫn được giữ bên dưới.",
  },
};

const PHASE_LABEL: Record<Phase, string> = {
  latency: "ping",
  download: "tải xuống",
  upload: "tải lên",
};

const QUALITY_STYLE: Record<
  QualityLevel,
  { tone: BadgeTone; icon: typeof CheckCircle2 }
> = {
  good: { tone: "success", icon: CheckCircle2 },
  fair: { tone: "warn", icon: MinusCircle },
  poor: { tone: "danger", icon: XCircle },
  unknown: { tone: "neutral", icon: HelpCircle },
};

const { download: MAX_DOWNLOAD, upload: MAX_UPLOAD } =
  estimateMaxBytes(MEASUREMENTS);
const MAX_MEGABYTES = formatMegabytes(MAX_DOWNLOAD + MAX_UPLOAD);

function toPhase(type: MeasurementType): Phase | null {
  return type === "latency" || type === "download" || type === "upload"
    ? type
    : null;
}

function describePhaseResult(phase: Phase, summary: MeasurementSummary) {
  if (phase === "latency") {
    return `Đã đo xong ping: ${formatMs(summary.latency)} ms`;
  }

  const value = phase === "download" ? summary.download : summary.upload;
  return `Đã đo xong ${PHASE_LABEL[phase]}: ${formatMbps(value)} Mbps`;
}

export function SpeedTestTool() {
  const engineRef = useRef<SpeedTestEngine | null>(null);
  const mountedRef = useRef(true);
  const measurementIdRef = useRef(0);
  const announcedRef = useRef(new Set<Phase>());

  const [status, setStatus] = useState<Status>("idle");
  const [summary, setSummary] = useState<MeasurementSummary>({});
  const [scores, setScores] = useState<Scores>();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [measuredAt, setMeasuredAt] = useState<Date | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      engineRef.current?.pause();
      engineRef.current = null;
    };
  }, []);

  const resetResults = () => {
    measurementIdRef.current = 0;
    announcedRef.current = new Set();
    setSummary({});
    setScores(undefined);
    setPhase(null);
    setErrorKind(null);
    setMeasuredAt(null);
    setCopyState("idle");
  };

  const wireEngine = (engine: SpeedTestEngine) => {
    engine.onPhaseChange = ({ measurementId, measurement }) => {
      measurementIdRef.current = measurementId;

      if (mountedRef.current) {
        setPhase(toPhase(measurement.type));
      }
    };

    engine.onResultsChange = ({ type }) => {
      if (!mountedRef.current) {
        return;
      }

      const current = engine.results.getSummary();
      setSummary(current);

      // Measurements interleave, so announce a category once, when its value is final
      const category = toPhase(type);
      const raw = category ? engine.results.raw[category] : undefined;
      const finished =
        typeof raw === "object" && raw !== null && raw.finished === true;

      if (
        category &&
        !announcedRef.current.has(category) &&
        isCategoryDone(category, finished, measurementIdRef.current, MEASUREMENTS)
      ) {
        announcedRef.current.add(category);
        setAnnouncement(describePhaseResult(category, current));
      }
    };

    engine.onFinish = (results) => {
      if (!mountedRef.current) {
        return;
      }

      const finalSummary = results.getSummary();
      setSummary(finalSummary);
      setScores(rescoreAssumingNoPacketLoss(results.getScores()));
      setPhase(null);
      setMeasuredAt(new Date());
      setStatus("done");
      setAnnouncement(buildFinalAnnouncement(finalSummary));
    };

    engine.onError = () => {
      if (!mountedRef.current) {
        return;
      }

      engine.pause();
      setPhase(null);
      setErrorKind("run");
      setStatus("error");
    };
  };

  const start = async () => {
    if (status === "loading" || status === "running") {
      return;
    }

    resetResults();

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorKind("offline");
      setStatus("error");
      return;
    }

    // Reuse the engine after a pause/error instead of stacking a second one
    if (engineRef.current) {
      setStatus("running");
      setAnnouncement("Bắt đầu đo lại.");
      engineRef.current.restart();
      return;
    }

    setStatus("loading");

    try {
      const { default: SpeedTest } = await import("@cloudflare/speedtest");

      if (!mountedRef.current) {
        return;
      }

      const engine = new SpeedTest({ ...ENGINE_OPTIONS, autoStart: false });
      engineRef.current = engine;
      wireEngine(engine);
      setStatus("running");
      setAnnouncement("Bắt đầu đo.");
      engine.play();
    } catch {
      if (mountedRef.current) {
        setErrorKind("load");
        setStatus("error");
      }
    }
  };

  const pause = () => {
    engineRef.current?.pause();
    setStatus("paused");
    setAnnouncement("Đã tạm dừng.");
  };

  const resume = () => {
    engineRef.current?.play();
    setStatus("running");
    setAnnouncement("Tiếp tục đo.");
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(
        buildResultText(
          summary,
          scores,
          measuredAt ?? new Date(),
          window.location.origin,
        ),
      );
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const isBusy = status === "loading" || status === "running";
  const qualityRows = getExperienceQualities(scores);
  const qualityNote = getQualityNote(qualityRows);
  const hasAnyResult = Object.values(summary).some(
    (value) => typeof value === "number",
  );
  const showMetrics = status !== "idle" && (status !== "error" || hasAnyResult);

  const metrics: Array<{
    key: string;
    label: string;
    value: string;
    unit: string;
    icon: typeof ArrowDown;
    active: boolean;
  }> = [
    {
      key: "download",
      label: "Tải xuống",
      value: formatMbps(summary.download),
      unit: "Mbps",
      icon: ArrowDown,
      active: phase === "download",
    },
    {
      key: "upload",
      label: "Tải lên",
      value: formatMbps(summary.upload),
      unit: "Mbps",
      icon: ArrowUp,
      active: phase === "upload",
    },
    {
      key: "latency",
      label: "Ping",
      value: formatMs(summary.latency),
      unit: "ms",
      icon: Timer,
      active: phase === "latency",
    },
    {
      key: "jitter",
      label: "Độ dao động",
      value: formatMs(summary.jitter),
      unit: "ms",
      icon: Waves,
      active: phase === "latency",
    },
  ];

  return (
    <div className="space-y-6">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {status === "idle" && (
        <Card padding="lg" className="text-center">
          <span
            aria-hidden="true"
            className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent"
          >
            <Gauge size={28} />
          </span>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted">
            Mỗi lần đo dùng tối đa khoảng {MAX_MEGABYTES} MB dữ liệu.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              onClick={start}
              leftIcon={<Gauge size={18} aria-hidden="true" />}
            >
              Bắt đầu đo
            </Button>
          </div>
        </Card>
      )}

      {status === "error" && errorKind && (
        <ErrorState
          title={ERROR_MESSAGE[errorKind].title}
          description={ERROR_MESSAGE[errorKind].description}
          action={
            <Button
              onClick={start}
              leftIcon={<RotateCcw size={18} aria-hidden="true" />}
            >
              Thử lại
            </Button>
          }
        />
      )}

      {showMetrics && (
        <section aria-labelledby="speed-test-results-title">
          <h2 id="speed-test-results-title" className="sr-only">
            Kết quả đo
          </h2>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <Card as="li" key={metric.key} padding="md">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
                      <Icon size={16} aria-hidden="true" />
                      {metric.label}
                    </span>
                  </div>
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-semibold tabular-nums text-ink sm:text-4xl">
                      {metric.value}
                    </span>
                    <span className="text-sm text-muted">{metric.unit}</span>
                  </p>
                  <div className="mt-2 h-6">
                    {metric.active && isBusy && (
                      <Badge tone="accent">Đang đo…</Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </ul>

          {status === "done" && (
            <p className="mt-3 text-sm text-muted">
              Ping khi đang tải: xuống{" "}
              <span className="font-mono tabular-nums text-ink">
                {formatMs(summary.downLoadedLatency)}
              </span>{" "}
              ms · lên{" "}
              <span className="font-mono tabular-nums text-ink">
                {formatMs(summary.upLoadedLatency)}
              </span>{" "}
              ms
            </p>
          )}
        </section>
      )}

      {status === "loading" && (
        <p className="text-sm text-muted" role="status">
          Đang chuẩn bị công cụ đo…
        </p>
      )}

      {(status === "running" ||
        status === "paused" ||
        status === "done") && (
        <div className="flex flex-wrap gap-3">
          {status === "running" && (
            <Button
              variant="secondary"
              onClick={pause}
              leftIcon={<Pause size={18} aria-hidden="true" />}
            >
              Dừng
            </Button>
          )}
          {status === "paused" && (
            <Button
              onClick={resume}
              leftIcon={<Play size={18} aria-hidden="true" />}
            >
              Tiếp tục
            </Button>
          )}
          {(status === "paused" || status === "done") && (
            <Button
              variant={status === "done" ? "primary" : "secondary"}
              onClick={start}
              leftIcon={<RotateCcw size={18} aria-hidden="true" />}
            >
              Đo lại
            </Button>
          )}
          {status === "done" && (
            <Button
              variant="secondary"
              onClick={copyResult}
              leftIcon={<Copy size={18} aria-hidden="true" />}
            >
              {copyState === "copied"
                ? "Đã sao chép"
                : copyState === "failed"
                  ? "Không sao chép được"
                  : "Sao chép kết quả"}
            </Button>
          )}
        </div>
      )}

      {status === "done" && (
        <Card as="section" padding="md" aria-labelledby="speed-test-quality">
          <h2
            id="speed-test-quality"
            className="text-lg font-semibold text-ink"
          >
            Đánh giá chất lượng
          </h2>
          {qualityNote && (
            <p className="mt-2 text-sm leading-6 text-ink">{qualityNote}</p>
          )}
          <ul className="mt-3 divide-y divide-line">
            {qualityRows.map(({ key, label, level }) => {
              const { tone, icon: Icon } = QUALITY_STYLE[level];

              return (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="text-sm font-medium text-ink">{label}</span>
                  <Badge tone={tone} className="inline-flex items-center gap-1">
                    <Icon size={14} aria-hidden="true" />
                    {QUALITY_LABEL[level]}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

    </div>
  );
}
