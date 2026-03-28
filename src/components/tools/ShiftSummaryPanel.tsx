"use client";

import { ArrowLeft, Copy, Info, Minus, Plus } from "lucide-react";

export type ShiftSummaryShift = "morning" | "afternoon";

export interface ShiftSummaryPanelProps {
  shift: ShiftSummaryShift;
  shiftLabel: string;
  shiftHeadingLabel: string;
  summaryDate: string;
  reportDateLabel: string | null;
  acIncrease: number;
  acDecrease: number;
  acTotal: number;
  roomFeedbackCount: number;
  roomFeedbackDetails: string[];
  borrowedItemCount: number;
  borrowedItemDetails: string[];
  usedBatteryCount: number;
  extraBatteryCount: number;
  totalBattery: number;
  summaryText: string;
  onBack: () => void;
  onShiftChange: (shift: ShiftSummaryShift) => void;
  onSummaryDateChange: (value: string) => void;
  onUseReportDate?: () => void;
  onAdjustAcIncrease: (delta: number) => void;
  onAdjustAcDecrease: (delta: number) => void;
  onIncreaseRoomFeedback: () => void;
  onDecreaseRoomFeedback: () => void;
  onUpdateRoomFeedbackDetail: (index: number, value: string) => void;
  onIncreaseBorrowedItem: () => void;
  onDecreaseBorrowedItem: () => void;
  onUpdateBorrowedItemDetail: (index: number, value: string) => void;
  onAdjustUsedBattery: (delta: number) => void;
  onAdjustExtraBattery: (delta: number) => void;
  onCopySummary: () => void;
}

export function ShiftSummaryPanel({
  shift,
  shiftLabel,
  shiftHeadingLabel,
  summaryDate,
  reportDateLabel,
  acIncrease,
  acDecrease,
  acTotal,
  roomFeedbackCount,
  roomFeedbackDetails,
  borrowedItemCount,
  borrowedItemDetails,
  usedBatteryCount,
  extraBatteryCount,
  totalBattery,
  summaryText,
  onBack,
  onShiftChange,
  onSummaryDateChange,
  onUseReportDate,
  onAdjustAcIncrease,
  onAdjustAcDecrease,
  onIncreaseRoomFeedback,
  onDecreaseRoomFeedback,
  onUpdateRoomFeedbackDetail,
  onIncreaseBorrowedItem,
  onDecreaseBorrowedItem,
  onUpdateBorrowedItemDetail,
  onAdjustUsedBattery,
  onAdjustExtraBattery,
  onCopySummary,
}: ShiftSummaryPanelProps) {
  return (
    <section className="overflow-hidden rounded-[1.85rem] border border-cyan-400/15 bg-[linear-gradient(180deg,_rgba(7,17,38,0.98)_0%,_rgba(4,10,24,0.98)_100%)] p-6 shadow-[0_30px_90px_-45px_rgba(34,211,238,0.45)]">
      <div className="flex flex-col gap-5 border-b border-slate-800/80 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
            Chế độ tổng kết
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-white">
            Kết ca
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Tổng hợp nhanh tình hình ca làm việc trong ngày, sinh sẵn nội dung
            để copy và gửi đi ngay.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
            Đang kết {shiftLabel}
          </span>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/35 hover:text-white"
          >
            <ArrowLeft size={16} />
            Quay lại lọc lịch
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-sky-400/20 bg-[linear-gradient(180deg,_rgba(8,24,43,0.9)_0%,_rgba(5,14,28,0.96)_100%)] p-5 shadow-[0_24px_60px_-42px_rgba(56,189,248,0.55)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Chọn ca và ngày tổng kết
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start">
                <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                  {shiftHeadingLabel}
                </span>
                <InfoHoverButton content="Chọn ca sáng hoặc ca chiều để nội dung kết ca đổi theo đúng phiên làm việc. Ngày tổng kết sẽ tự điền theo file đã lọc nếu có, nhưng bạn vẫn có thể chỉnh tay khi cần." />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <ShiftSelectButton
                label="Ca sáng"
                isActive={shift === "morning"}
                onClick={() => onShiftChange("morning")}
              />
              <ShiftSelectButton
                label="Ca chiều"
                isActive={shift === "afternoon"}
                onClick={() => onShiftChange("afternoon")}
              />
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-sky-400/15 bg-[#071425]/90 p-4">
              <label
                htmlFor="shift-summary-date"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
              >
                Ngày tổng kết
              </label>
              <input
                id="shift-summary-date"
                type="text"
                value={summaryDate}
                onChange={(event) => onSummaryDateChange(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-sky-400/20 bg-slate-950/80 px-4 py-3 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/45"
                placeholder="27/03/2026"
              />

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                {reportDateLabel ? (
                  <>
                    <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sky-100">
                      Đang có ngày từ file: {reportDateLabel}
                    </span>
                    {onUseReportDate && (
                      <button
                        type="button"
                        onClick={onUseReportDate}
                        className="rounded-full border border-sky-400/20 bg-slate-950/70 px-3 py-1 font-medium text-slate-200 transition hover:border-sky-300/45 hover:text-white"
                      >
                        Dùng ngày trong file
                      </button>
                    )}
                  </>
                ) : (
                  <span className="rounded-full border border-sky-400/15 bg-slate-950/70 px-3 py-1 text-slate-300">
                    Chưa có file lịch, đang dùng ngày hiện tại.
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-cyan-400/20 bg-[linear-gradient(180deg,_rgba(6,24,32,0.9)_0%,_rgba(5,14,24,0.96)_100%)] p-5 shadow-[0_24px_60px_-42px_rgba(34,211,238,0.55)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Phản hồi máy lạnh
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-100">
                  Tổng {acTotal}
                </span>
                <InfoHoverButton content="Theo dõi riêng số phản hồi tăng và số phản hồi giảm của máy lạnh. Hệ thống sẽ tự cộng hai giá trị này để ra tổng phản hồi trong phần preview." />
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <CounterControl
                label="Máy lạnh tăng"
                value={acIncrease}
                tone="cyan"
                onDecrease={() => onAdjustAcIncrease(-1)}
                onIncrease={() => onAdjustAcIncrease(1)}
              />
              <CounterControl
                label="Máy lạnh giảm"
                value={acDecrease}
                tone="cyan"
                onDecrease={() => onAdjustAcDecrease(-1)}
                onIncrease={() => onAdjustAcDecrease(1)}
              />
            </div>

            <p className="mt-4 rounded-[1.25rem] border border-cyan-400/15 bg-[#071823]/90 px-4 py-3 text-sm leading-6 text-slate-300">
              Có <span className="font-semibold text-white">{acTotal}</span>{" "}
              phản hồi máy lạnh ({acIncrease} tăng, {acDecrease} giảm).
            </p>
          </section>

          <section className="rounded-[1.5rem] border border-amber-400/20 bg-[linear-gradient(180deg,_rgba(38,24,9,0.9)_0%,_rgba(23,14,6,0.96)_100%)] p-5 shadow-[0_24px_60px_-42px_rgba(251,191,36,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Pin sử dụng</h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start">
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-100">
                  Tổng {totalBattery} viên
                </span>
                <InfoHoverButton content="Nhập số pin đã dùng trong ca và số pin phát sinh thêm. Hai giá trị này sẽ được cộng lại để hiển thị tổng số pin đã dùng trong báo cáo." />
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <CounterControl
                label="Pin đã dùng"
                value={usedBatteryCount}
                tone="amber"
                onDecrease={() => onAdjustUsedBattery(-1)}
                onIncrease={() => onAdjustUsedBattery(1)}
              />
              <CounterControl
                label="Pin phát sinh thêm"
                value={extraBatteryCount}
                tone="amber"
                onDecrease={() => onAdjustExtraBattery(-1)}
                onIncrease={() => onAdjustExtraBattery(1)}
              />
            </div>

            <p className="mt-4 rounded-[1.25rem] border border-amber-400/15 bg-[#1a1206]/70 px-4 py-3 text-sm leading-6 text-slate-300">
              {shiftHeadingLabel} sử dụng{" "}
              <span className="font-semibold text-white">
                {usedBatteryCount}
              </span>{" "}
              viên pin, phát sinh thêm {extraBatteryCount} viên, tổng{" "}
              <span className="font-semibold text-white">{totalBattery}</span>{" "}
              viên.
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <DetailListCard
            title="Phản hồi phòng học"
            description="Mỗi lần tăng sẽ sinh thêm một ô nhập chi tiết để bạn ghi nội dung cần báo lại."
            badge={`Có ${roomFeedbackCount} phản hồi`}
            count={roomFeedbackCount}
            details={roomFeedbackDetails}
            emptyText="Chưa có phản hồi phòng học nào trong ca này."
            placeholderPrefix="Nội dung phản hồi phòng học"
            tone="rose"
            onIncrease={onIncreaseRoomFeedback}
            onDecrease={onDecreaseRoomFeedback}
            onDetailChange={onUpdateRoomFeedbackDetail}
          />

          <DetailListCard
            title="Vật tư cho mượn"
            description="Ghi lại từng vật tư hoặc bộ vật tư đã cho mượn trong ca làm việc."
            badge={`Đã cho mượn ${borrowedItemCount} vật tư`}
            count={borrowedItemCount}
            details={borrowedItemDetails}
            emptyText="Chưa có vật tư nào được cho mượn."
            placeholderPrefix="Chi tiết vật tư cho mượn"
            tone="indigo"
            onIncrease={onIncreaseBorrowedItem}
            onDecrease={onDecreaseBorrowedItem}
            onDetailChange={onUpdateBorrowedItemDetail}
          />
        </div>
      </div>

      <section className="mt-6 rounded-[1.5rem] border border-emerald-400/20 bg-[linear-gradient(180deg,_rgba(6,26,24,0.98)_0%,_rgba(4,16,15,0.98)_100%)] p-5 shadow-[0_24px_60px_-40px_rgba(16,185,129,0.5)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
              Preview nội dung
            </p>
            <h3 className="mt-3 text-2xl font-bold text-white">
              Nội dung kết ca
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start">
            <InfoHoverButton content="Phần này tự tạo sẵn nội dung kết ca theo dữ liệu bạn vừa nhập ở các khối bên trên. Bạn chỉ cần kiểm tra lại và bấm copy để gửi đi." />
            <button
              type="button"
              onClick={onCopySummary}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <Copy size={16} />
              Copy nội dung kết ca
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-[1.25rem] border border-emerald-400/10 bg-[#041513]/90 p-4">
          <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-emerald-50/95">
            {summaryText}
          </pre>
        </div>
      </section>
    </section>
  );
}

function ShiftSelectButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
        isActive
          ? "border border-cyan-300/40 bg-cyan-400/15 text-cyan-100 shadow-[0_12px_28px_-18px_rgba(34,211,238,0.9)]"
          : "border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-400/30 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function InfoHoverButton({ content }: { content: string }) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label="Xem thông tin thêm"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/65 text-slate-300 transition hover:border-cyan-400/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
      >
        <Info size={16} />
      </button>

      <div className="pointer-events-none absolute right-0 top-full z-20 mt-3 w-[min(21rem,calc(100vw-3rem))] rounded-[1.25rem] border border-slate-700 bg-[#07101f] p-4 text-sm leading-6 text-slate-300 opacity-0 shadow-2xl shadow-slate-950/50 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        {content}
      </div>
    </div>
  );
}

function CounterControl({
  label,
  value,
  tone,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: number;
  tone: "cyan" | "amber";
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const toneClasses = {
    cyan: {
      panel: "border-cyan-400/15 bg-[#071823]/90",
      value: "border-cyan-400/15 bg-slate-950/80",
      minus:
        "border-cyan-400/20 bg-slate-950/80 text-slate-200 hover:border-cyan-300/45 hover:text-white",
      plus: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
    },
    amber: {
      panel: "border-amber-400/15 bg-[#1a1206]/60",
      value: "border-amber-400/15 bg-slate-950/80",
      minus:
        "border-amber-400/20 bg-slate-950/80 text-slate-200 hover:border-amber-300/45 hover:text-white",
      plus: "bg-amber-400 text-slate-950 hover:bg-amber-300",
    },
  } as const;

  const palette = toneClasses[tone];

  return (
    <div className={`rounded-[1.25rem] border p-4 ${palette.panel}`}>
      <p className="text-sm font-semibold text-white">{label}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onDecrease}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${palette.minus}`}
          aria-label={`Giảm ${label.toLowerCase()}`}
        >
          <Minus size={16} />
        </button>

        <div
          className={`min-w-[5rem] rounded-2xl border px-4 py-3 text-center text-2xl font-bold text-white ${palette.value}`}
        >
          {value}
        </div>

        <button
          type="button"
          onClick={onIncrease}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl transition ${palette.plus}`}
          aria-label={`Tăng ${label.toLowerCase()}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function DetailListCard({
  title,
  description,
  badge,
  count,
  details,
  emptyText,
  placeholderPrefix,
  tone,
  onIncrease,
  onDecrease,
  onDetailChange,
}: {
  title: string;
  description: string;
  badge: string;
  count: number;
  details: string[];
  emptyText: string;
  placeholderPrefix: string;
  tone: "rose" | "indigo";
  onIncrease: () => void;
  onDecrease: () => void;
  onDetailChange: (index: number, value: string) => void;
}) {
  const toneClasses = {
    rose: {
      section:
        "border-rose-400/20 bg-[linear-gradient(180deg,_rgba(43,8,23,0.52)_0%,_rgba(24,8,16,0.95)_100%)] shadow-[0_24px_60px_-42px_rgba(244,63,94,0.45)]",
      badge: "border-rose-400/20 bg-rose-400/10 text-rose-100",
      primary: "bg-rose-400 text-slate-950 hover:bg-rose-300",
      secondary:
        "border-rose-400/20 bg-slate-950/70 text-slate-200 hover:border-rose-300/45 hover:text-white",
      empty: "border-rose-400/15 bg-[#220b16]/65 text-rose-100/75",
      item: "border-rose-400/12 bg-[#170810]/90",
      textarea: "border-rose-400/15 bg-slate-950/80 focus:border-rose-400/45",
    },
    indigo: {
      section:
        "border-indigo-400/20 bg-[linear-gradient(180deg,_rgba(12,18,48,0.58)_0%,_rgba(8,12,28,0.96)_100%)] shadow-[0_24px_60px_-42px_rgba(99,102,241,0.45)]",
      badge: "border-indigo-400/20 bg-indigo-400/10 text-indigo-100",
      primary: "bg-indigo-400 text-slate-950 hover:bg-indigo-300",
      secondary:
        "border-indigo-400/20 bg-slate-950/70 text-slate-200 hover:border-indigo-300/45 hover:text-white",
      empty: "border-indigo-400/15 bg-[#0d1225]/70 text-indigo-100/75",
      item: "border-indigo-400/12 bg-[#0b1020]/90",
      textarea:
        "border-indigo-400/15 bg-slate-950/80 focus:border-indigo-400/45",
    },
  } as const;

  const palette = toneClasses[tone];

  return (
    <section className={`rounded-[1.5rem] border p-5 ${palette.section}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start">
          <span
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${palette.badge}`}
          >
            {badge}
          </span>
          <InfoHoverButton content={description} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onIncrease}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${palette.primary}`}
        >
          <Plus size={16} />
          Tăng
        </button>
        <button
          type="button"
          onClick={onDecrease}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${palette.secondary}`}
        >
          <Minus size={16} />
          Giảm
        </button>
        <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-sm text-slate-300">
          Tổng hiện tại: {count}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {details.length === 0 ? (
          <div
            className={`rounded-[1.25rem] border border-dashed px-4 py-4 text-sm leading-6 ${palette.empty}`}
          >
            {emptyText}
          </div>
        ) : (
          details.map((detail, index) => (
            <div
              key={`${title}-${index}`}
              className={`rounded-[1.25rem] border p-4 ${palette.item}`}
            >
              <label
                htmlFor={`${title}-${index}`}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
              >
                {placeholderPrefix} #{index + 1}
              </label>
              <textarea
                id={`${title}-${index}`}
                value={detail}
                onChange={(event) =>
                  onDetailChange(index, event.currentTarget.value)
                }
                rows={2}
                className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 ${palette.textarea}`}
                placeholder={`${placeholderPrefix} #${index + 1}`}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
