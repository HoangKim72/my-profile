"use client";

import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Clock3,
  Github,
  Layers3,
  Sparkles,
  TimerReset,
  Wrench,
} from "lucide-react";
import type {
  GitHubProjectSpotlight,
  SkillTechCard,
  SkillsActivityInsight,
  SkillsLanguageItem,
  SkillsOverviewStat,
  SkillsPageData,
  SkillsSoftSkill,
  SkillsSourceState,
  SkillsToolItem,
} from "@/lib/skills/types";

type SkillsTab = "overview" | "github" | "wakatime";

interface SkillsShowcaseProps {
  data: SkillsPageData;
}

export function SkillsShowcase({ data }: SkillsShowcaseProps) {
  const [activeTab, setActiveTab] = useState<SkillsTab>("overview");

  return (
    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#07111f_48%,_#091726_100%)] py-14 md:py-16">
      <div className="container-custom max-w-7xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-[#030817]/95 px-6 py-8 shadow-[0_30px_80px_-36px_rgba(14,165,233,0.28)] sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.14),_transparent_52%)]" />

          <header className="relative border-b border-slate-800/80 pb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
              <Sparkles size={14} />
              Skills / Signal Board
            </div>

            <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] xl:items-end">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Skills thật từ dự án và thời gian làm việc
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                  GitHub cho biết mình đã build gì. WakaTime cho biết mình đang
                  dùng gì nhiều. Phần manual giữ lại cách làm việc và soft
                  skills không thể tự động hóa hoàn toàn.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {data.overviewStats.map((stat) => (
                  <OverviewStatCard key={stat.label} stat={stat} />
                ))}
              </div>
            </div>
          </header>

          <div className="relative mt-8 grid gap-4 lg:grid-cols-2">
            <SourceStatusCard
              title="GitHub Signal"
              icon={Github}
              state={data.githubState}
            />
            <SourceStatusCard
              title="WakaTime Signal"
              icon={Activity}
              state={data.wakatimeState}
            />
          </div>

          <div className="relative mt-8 flex flex-wrap gap-3">
            <TabButton
              label="Overview"
              isActive={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <TabButton
              label="GitHub"
              isActive={activeTab === "github"}
              onClick={() => setActiveTab("github")}
            />
            <TabButton
              label="WakaTime"
              isActive={activeTab === "wakatime"}
              onClick={() => setActiveTab("wakatime")}
            />
          </div>

          <div className="relative mt-8 space-y-8">
            {activeTab === "overview" ? (
              <>
                <SectionHeader
                  eyebrow="Core Tech Stack"
                  title="Tech stack hợp nhất"
                  description="Card skill hiển thị số project từ GitHub, usage signal từ WakaTime và tooltip evidence khi hover."
                />
                <SkillCardGrid
                  items={data.coreTechStack}
                  emptyText="Chưa có enough signal để dựng core stack."
                />

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
                  <div className="space-y-8">
                    <SectionHeader
                      eyebrow="Most Used Languages"
                      title="Ngôn ngữ dùng nhiều nhất"
                      description="Tổng hợp theo 30 ngày gần nhất từ WakaTime."
                    />
                    <LanguagePanel
                      items={data.mostUsedLanguages}
                      emptyText="Thêm WAKATIME_API_KEY để mở thống kê ngôn ngữ."
                    />
                  </div>

                  <div className="space-y-8">
                    <SectionHeader
                      eyebrow="Activity Insights"
                      title="Nhịp làm việc gần đây"
                      description="Snapshot nhanh cho tuần gần nhất."
                    />
                    <ActivityPanel
                      items={data.activityInsights}
                      emptyText="WakaTime chưa sẵn sàng nên chưa có activity insight."
                    />
                  </div>
                </div>

                <SectionHeader
                  eyebrow="Tools & Environment"
                  title="Công cụ và môi trường"
                  description="Ghép editors, operating systems, deployment/tooling và source control."
                />
                <ToolsGrid
                  items={data.toolsAndEnvironment}
                  emptyText="Chưa có đủ dữ liệu tool/environment."
                />

                <SectionHeader
                  eyebrow="Manual Layer"
                  title="Soft skills vẫn giữ thủ công"
                  description="Nhóm này không lấy từ telemetry vì mục tiêu là phản ánh cách làm việc thay vì chỉ số usage."
                />
                <SoftSkillsGrid items={data.softSkills} />
              </>
            ) : null}

            {activeTab === "github" ? (
              <>
                <SectionHeader
                  eyebrow="GitHub-based"
                  title="Tech stack theo dự án"
                  description="Tập trung vào số project và repo evidence từ GitHub. Đây là lớp dữ liệu trả lời câu hỏi: mình đã build gì."
                />
                <SkillCardGrid
                  items={data.githubTechStack}
                  emptyText="GitHub chưa có repo đủ dữ liệu để phân tích."
                />

                <SectionHeader
                  eyebrow="Repo Evidence"
                  title="Project spotlight"
                  description="Một vài repo gần đây được dùng để dựng tech map. Mỗi card hiển thị tag công nghệ đã phát hiện từ repo."
                />
                <ProjectSpotlightGrid
                  items={data.githubProjects}
                  emptyText="Chưa có repo spotlight để hiển thị."
                />
              </>
            ) : null}

            {activeTab === "wakatime" ? (
              <>
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
                  <div className="space-y-8">
                    <SectionHeader
                      eyebrow="WakaTime-based"
                      title="Language usage"
                      description="Tỷ trọng ngôn ngữ coding trong 30 ngày gần nhất."
                    />
                    <LanguagePanel
                      items={data.mostUsedLanguages}
                      emptyText="WakaTime chưa sẵn sàng nên chưa có language usage."
                    />
                  </div>

                  <div className="space-y-8">
                    <SectionHeader
                      eyebrow="Activity Insights"
                      title="Coding rhythm"
                      description="Tín hiệu hoạt động gần đây để thấy thói quen làm việc thực tế."
                    />
                    <ActivityPanel
                      items={data.activityInsights}
                      emptyText="WakaTime chưa sẵn sàng nên chưa có activity insight."
                    />
                  </div>
                </div>

                <SectionHeader
                  eyebrow="Editors / OS / Tools"
                  title="Môi trường đang dùng"
                  description="Kết hợp editor, operating system từ WakaTime với deployment/tooling signal từ GitHub."
                />
                <ToolsGrid
                  items={data.toolsAndEnvironment}
                  emptyText="Chưa có dữ liệu công cụ và môi trường."
                />
              </>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function TabButton({
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
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
        isActive
          ? "border border-cyan-300/40 bg-cyan-400/15 text-cyan-100 shadow-[0_12px_28px_-18px_rgba(34,211,238,0.9)]"
          : "border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-400/30 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function OverviewStatCard({ stat }: { stat: SkillsOverviewStat }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {stat.label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-white">
        {stat.value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{stat.description}</p>
    </div>
  );
}

function SourceStatusCard({
  title,
  icon: Icon,
  state,
}: {
  title: string;
  icon: typeof Github;
  state: SkillsSourceState;
}) {
  const toneClasses = {
    ready: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    "needs-config": "border-amber-400/20 bg-amber-400/10 text-amber-100",
    empty: "border-slate-700 bg-slate-900/70 text-slate-200",
    error: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  } as const;

  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/45 p-5">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-100">
          <Icon size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClasses[state.status]}`}
            >
              {state.label}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {state.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
        {description}
      </p>
    </div>
  );
}

function SkillCardGrid({
  items,
  emptyText,
}: {
  items: SkillTechCard[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <SkillSignalCard key={item.name} item={item} />
      ))}
    </div>
  );
}

function SkillSignalCard({ item }: { item: SkillTechCard }) {
  const hasTooltip = item.evidenceRepos.length > 0 || item.usageText;

  return (
    <div className="group relative" tabIndex={0}>
      <div className="h-full rounded-[1.5rem] border border-slate-800 bg-[linear-gradient(180deg,_rgba(8,20,38,0.96)_0%,_rgba(4,12,26,0.96)_100%)] p-5 transition duration-200 hover:border-cyan-400/25 hover:shadow-[0_18px_50px_-28px_rgba(34,211,238,0.38)] focus-within:border-cyan-400/25">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-white">{item.name}</p>
            <p className="mt-2 text-sm text-slate-300">
              {item.projectCount > 0
                ? `${item.projectCount} project signal từ GitHub`
                : "Usage-based signal từ WakaTime"}
            </p>
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
            {item.sourceLabels.join(" + ")}
          </div>
        </div>

        {item.usagePercent !== null ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-300">Usage signal</span>
              <span className="font-semibold text-white">
                {item.usagePercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,_#22d3ee_0%,_#34d399_100%)]"
                style={{ width: `${Math.min(item.usagePercent, 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {item.projectCount > 0 ? (
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-200">
              {item.projectCount} projects
            </span>
          ) : null}
          {item.usageText ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
              {item.usageText}
            </span>
          ) : null}
          {hasTooltip ? (
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
              Hover để xem evidence
            </span>
          ) : null}
        </div>
      </div>

      {hasTooltip ? (
        <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[min(22rem,calc(100vw-3rem))] translate-y-2 rounded-[1.25rem] border border-slate-700 bg-[#07101f] p-4 text-sm text-slate-200 opacity-0 shadow-2xl shadow-slate-950/50 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
          {item.usageText ? (
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-emerald-100">
              WakaTime signal: {item.usageText}
            </div>
          ) : null}

          {item.evidenceRepos.length > 0 ? (
            <div className={item.usageText ? "mt-4" : ""}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Repo liên quan
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.evidenceRepos.slice(0, 5).map((repo) => (
                  <a
                    key={repo.name}
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
                  >
                    {repo.name}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function LanguagePanel({
  items,
  emptyText,
}: {
  items: SkillsLanguageItem[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/45 p-5">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-3 text-white">
                <BarChart3 size={16} className="text-cyan-200" />
                <span className="font-semibold">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-white">
                  {item.percent.toFixed(1)}%
                </span>
                <span className="ml-2 text-slate-400">{item.usageText}</span>
              </div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,_#38bdf8_0%,_#22c55e_100%)]"
                style={{ width: `${Math.min(item.percent, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityPanel({
  items,
  emptyText,
}: {
  items: SkillsActivityInsight[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  const icons = [Clock3, TimerReset, Layers3] as const;

  return (
    <div className="grid gap-4">
      {items.map((item, index) => {
        const Icon = icons[index] ?? Clock3;

        return (
          <div
            key={item.label}
            className="rounded-[1.5rem] border border-slate-800 bg-slate-950/45 p-5"
          >
            <div className="flex items-start gap-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-100">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ToolsGrid({
  items,
  emptyText,
}: {
  items: SkillsToolItem[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.name}
          className="rounded-[1.5rem] border border-slate-800 bg-[linear-gradient(180deg,_rgba(9,19,35,0.96)_0%,_rgba(5,12,24,0.96)_100%)] p-5"
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-100">
              <Wrench size={18} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{item.name}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {item.category}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {item.projectCount > 0 ? (
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-200">
                {item.projectCount} projects
              </span>
            ) : null}
            {item.usageText ? (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                {item.usageText}
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-300">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

function SoftSkillsGrid({ items }: { items: SkillsSoftSkill[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.name}
          className="rounded-[1.5rem] border border-slate-800 bg-[linear-gradient(180deg,_rgba(27,20,8,0.96)_0%,_rgba(18,13,5,0.96)_100%)] p-5"
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-100">
              <BookOpenCheck size={18} />
            </div>
            <h3 className="text-lg font-bold text-white">{item.name}</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProjectSpotlightGrid({
  items,
  emptyText,
}: {
  items: GitHubProjectSpotlight[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.name}
          className="rounded-[1.5rem] border border-slate-800 bg-slate-950/45 p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xl font-bold text-white transition hover:text-cyan-200"
              >
                {item.name}
                <ArrowUpRight size={16} />
              </a>
              <p className="mt-2 text-sm text-slate-300">
                {item.description || "Repo này chưa có description."}
              </p>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-200">
              {item.updatedAtLabel}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {item.primaryLanguage ? (
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                {item.primaryLanguage}
              </span>
            ) : null}
            {item.homepageUrl ? (
              <a
                href={item.homepageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:border-emerald-300/40 hover:text-white"
              >
                Deploy
                <ArrowUpRight size={12} />
              </a>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {item.techNames.slice(0, 6).map((tech) => (
              <span
                key={`${item.name}-${tech}`}
                className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-700 bg-slate-950/35 px-5 py-8 text-sm leading-7 text-slate-400">
      {text}
    </div>
  );
}
