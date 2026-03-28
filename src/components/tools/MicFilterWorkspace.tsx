"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mic } from "lucide-react";
import {
  MicFilterTool,
  type MicFilterMode,
} from "@/components/tools/MicFilterTool";

export function MicFilterWorkspace() {
  const [mode, setMode] = useState<MicFilterMode>("filter");

  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_32%),linear-gradient(180deg,_#020617_0%,_#08111f_55%,_#0b1220_100%)] py-14 md:py-16">
      <div className="container-custom max-w-7xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
        >
          <ArrowLeft size={16} />
          Quay lại bảng công cụ
        </Link>

        <section className="relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-[#030817]/95 px-6 py-8 shadow-[0_30px_80px_-36px_rgba(8,145,178,0.35)] sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_58%)]" />

          <div className="relative mb-8 flex flex-col gap-5 border-b border-slate-800/80 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-100">
                  <Mic size={18} />
                </span>
                Tool 01
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Tool lọc mic
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                Tải lịch học, xem ngay hai bảng cần thao tác và chuyển nhanh
                sang chế độ kết ca trong cùng một màn hình làm việc.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              {/* <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 font-semibold text-emerald-200">
                Sẵn sàng sử dụng
              </span> */}
              <button
                type="button"
                onClick={() => setMode("shift-summary")}
                className={`rounded-full px-20 py-2 font-medium transition ${
                  mode === "shift-summary"
                    ? "border border-cyan-300/40 bg-cyan-400/15 text-cyan-100 shadow-[0_12px_28px_-18px_rgba(34,211,238,0.9)]"
                    : "border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-400/30 hover:text-white"
                }`}
              >
                Kết ca
              </button>
            </div>
          </div>

          <div className="relative">
            <MicFilterTool mode={mode} onModeChange={setMode} />
          </div>
        </section>
      </div>
    </div>
  );
}
