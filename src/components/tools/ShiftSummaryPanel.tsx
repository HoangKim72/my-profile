"use client";

import { FileDown, Minus, Plus, RotateCcw, X } from "lucide-react";
import type {
  ShiftSummaryShift,
  ShiftSummaryState,
} from "@/tools/mic-filter/session";

type CountField =
  | "acIncrease"
  | "acDecrease"
  | "usedBatteryCount"
  | "extraBatteryCount";

type DetailField = "roomFeedbackDetails" | "borrowedItemDetails";

export interface ShiftSummaryPanelProps {
  summary: ShiftSummaryState;
  reportDateLabel: string | null;
  onShiftChange: (shift: ShiftSummaryShift) => void;
  onSummaryDateChange: (value: string) => void;
  onUseReportDate?: () => void;
  onAdjustCount: (field: CountField, delta: number) => void;
  onAddDetail: (field: DetailField) => void;
  onUpdateDetail: (field: DetailField, index: number, value: string) => void;
  onRemoveDetail: (field: DetailField, index: number) => void;
  onResetSummary: () => void;
}

const SHIFT_NAMES: Record<ShiftSummaryShift, string> = {
  morning: "Ca sáng",
  afternoon: "Ca chiều",
};

const COUNTERS: Array<{ field: CountField; label: string }> = [
  { field: "acIncrease", label: "Máy lạnh tăng" },
  { field: "acDecrease", label: "Máy lạnh giảm" },
  { field: "usedBatteryCount", label: "Pin đã dùng" },
  { field: "extraBatteryCount", label: "Pin phát sinh" },
];

export function ShiftSummaryPanel({
  summary,
  reportDateLabel,
  onShiftChange,
  onSummaryDateChange,
  onUseReportDate,
  onAdjustCount,
  onAddDetail,
  onUpdateDetail,
  onRemoveDetail,
  onResetSummary,
}: ShiftSummaryPanelProps) {
  const summaryDate = summary.summaryDate.trim();
  const canUseReportDate =
    Boolean(onUseReportDate) && reportDateLabel !== null && reportDateLabel !== summaryDate;

  const exportPdf = () => {
    const previousTitle = document.title;
    const shiftSlug = summary.shift === "morning" ? "sang" : "chieu";

    // The browser uses the page title as the default PDF file name
    document.title = `ket-ca-${shiftSlug}-${summaryDate.replace(/\//g, "-")}`;
    window.addEventListener(
      "afterprint",
      () => {
        document.title = previousTitle;
      },
      { once: true },
    );
    window.print();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-t-4 border-mic-line border-t-mic-done bg-mic-surface">
      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 xl:col-span-4">
            {(["morning", "afternoon"] as const).map((shift) => (
              <button
                key={shift}
                type="button"
                aria-pressed={summary.shift === shift}
                onClick={() => onShiftChange(shift)}
                className={`h-9 rounded-[10px] border px-4 text-sm font-semibold transition ${
                  summary.shift === shift
                    ? "border-mic-done bg-mic-done text-mic-on-done"
                    : "border-mic-line-strong bg-mic-surface hover:border-mic-done"
                }`}
              >
                {SHIFT_NAMES[shift]}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {canUseReportDate && (
                <button
                  type="button"
                  onClick={onUseReportDate}
                  className="text-[13px] font-semibold text-mic-done hover:underline"
                >
                  Dùng ngày {reportDateLabel}
                </button>
              )}
              <label htmlFor="shift-summary-date" className="sr-only">
                Ngày kết ca
              </label>
              <input
                id="shift-summary-date"
                type="text"
                inputMode="numeric"
                value={summary.summaryDate}
                onChange={(event) => onSummaryDateChange(event.target.value)}
                placeholder="03/10/2026"
                className="h-9 w-32 rounded-[10px] border border-mic-line-strong bg-mic-surface px-3 font-[family-name:var(--font-mic-mono)] text-sm outline-none focus:border-mic-done"
              />
            </div>
          </div>

          {COUNTERS.map(({ field, label }) => (
            <Counter
              key={field}
              label={label}
              value={summary[field]}
              onChange={(delta) => onAdjustCount(field, delta)}
            />
          ))}

          <DetailList
            title="Phản hồi phòng học"
            placeholder="VD: 05.07 loa rè"
            items={summary.roomFeedbackDetails}
            onAdd={() => onAddDetail("roomFeedbackDetails")}
            onUpdate={(index, value) => onUpdateDetail("roomFeedbackDetails", index, value)}
            onRemove={(index) => onRemoveDetail("roomFeedbackDetails", index)}
          />
          <DetailList
            title="Vật tư cho mượn"
            placeholder="VD: 1 dây HDMI cho P.302"
            items={summary.borrowedItemDetails}
            onAdd={() => onAddDetail("borrowedItemDetails")}
            onUpdate={(index, value) => onUpdateDetail("borrowedItemDetails", index, value)}
            onRemove={(index) => onRemoveDetail("borrowedItemDetails", index)}
          />

          <button
            type="button"
            onClick={() => {
              if (window.confirm("Xoá toàn bộ số liệu kết ca đang nhập?")) {
                onResetSummary();
              }
            }}
            className="inline-flex items-center gap-1.5 justify-self-start text-[13px] font-medium text-mic-muted transition hover:text-mic-danger sm:col-span-2 xl:col-span-4"
          >
            <RotateCcw size={14} />
            Xoá số liệu
          </button>
        </div>

        <div className="grid content-start gap-3">
          <ReportSheet summary={summary} />
          <button
            type="button"
            onClick={exportPdf}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-mic-done text-sm font-semibold text-mic-on-done transition hover:opacity-90"
          >
            <FileDown size={18} />
            Xuất PDF
          </button>
        </div>
      </div>
    </section>
  );
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="grid gap-1.5 rounded-xl border border-mic-line p-2.5">
      <span className="text-[13px] text-mic-muted">{label}</span>
      <div className="flex items-center overflow-hidden rounded-[10px] border border-mic-line-strong">
        <button
          type="button"
          onClick={() => onChange(-1)}
          aria-label={`Giảm ${label.toLowerCase()}`}
          className="grid h-9 w-9 place-items-center bg-mic-sunken transition hover:text-mic-done"
        >
          <Minus size={16} />
        </button>
        <b className="flex-1 text-center font-[family-name:var(--font-mic-mono)] text-base">
          {value}
        </b>
        <button
          type="button"
          onClick={() => onChange(1)}
          aria-label={`Tăng ${label.toLowerCase()}`}
          className="grid h-9 w-9 place-items-center bg-mic-sunken transition hover:text-mic-done"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function DetailList({
  title,
  placeholder,
  items,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  placeholder: string;
  items: string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="grid content-start gap-1.5 sm:col-span-2">
      <span className="text-[13px] text-mic-muted">
        {title}
        {items.length > 0 && ` · ${items.length}`}
      </span>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <input
            id={`${title}-${index}`}
            aria-label={`${title} ${index + 1}`}
            value={item}
            onChange={(event) => onUpdate(index, event.target.value)}
            placeholder={placeholder}
            className="h-[38px] min-w-0 flex-1 rounded-[10px] border border-mic-line-strong bg-mic-surface px-3 text-sm outline-none focus:border-mic-done"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Xoá dòng ${index + 1}`}
            className="grid h-[38px] w-[38px] place-items-center rounded-[10px] text-mic-muted transition hover:bg-mic-sunken hover:text-mic-danger"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="justify-self-start text-[13px] font-semibold text-mic-done hover:underline"
      >
        + Thêm
      </button>
    </div>
  );
}

// Always black on white: this is what ends up in the PDF
function ReportSheet({ summary }: { summary: ShiftSummaryState }) {
  const roomFeedback = summary.roomFeedbackDetails.map((item) => item.trim()).filter(Boolean);
  const borrowedItems = summary.borrowedItemDetails.map((item) => item.trim()).filter(Boolean);
  const rows: Array<[string, React.ReactNode]> = [
    ["Máy lạnh tăng", summary.acIncrease],
    ["Máy lạnh giảm", summary.acDecrease],
    ["Tổng phản hồi máy lạnh", summary.acIncrease + summary.acDecrease],
    ["Pin đã dùng", summary.usedBatteryCount],
    ["Pin phát sinh", summary.extraBatteryCount],
    ["Tổng pin", summary.usedBatteryCount + summary.extraBatteryCount],
    ["Phản hồi phòng học", <SheetList key="room" items={roomFeedback} />],
    ["Vật tư cho mượn", <SheetList key="borrowed" items={borrowedItems} />],
  ];

  return (
    <div className="mic-print-sheet rounded-md border border-mic-line bg-white px-6 pb-7 pt-6 text-[#141a22] shadow-lg">
      <div className="mb-3 grid gap-0.5 border-b-2 border-[#141a22] pb-3 text-center">
        <b className="text-[15px] tracking-[0.06em]">BÁO CÁO KẾT CA</b>
        <span className="text-xs text-[#525c69]">
          {SHIFT_NAMES[summary.shift]} · {summary.summaryDate.trim() || "—"}
        </span>
      </div>
      <table className="w-full border-collapse text-[13px]">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-[#e1e5eb] last:border-0">
              <td className="py-1.5 pr-3 align-top">{label}</td>
              <td
                className={`py-1.5 text-right align-top ${
                  typeof value === "number" ? "font-[family-name:var(--font-mic-mono)]" : ""
                }`}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SheetList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <>Không có</>;
  }

  return (
    <ul className="space-y-0.5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
