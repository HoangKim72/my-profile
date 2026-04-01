"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  ArrowDownWideNarrow,
  BarChart3,
  BookOpenCheck,
  Clock3,
  FolderKanban,
  Github,
  Layers3,
  ListFilter,
  MousePointer2,
  Sparkles,
  TimerReset,
  Wrench,
} from "lucide-react";
import type {
  GitHubProjectSpotlight,
  SkillCategory,
  SkillEvidenceProject,
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
                  GitHub cho biết mình đã build gì. Project archive giữ đường
                  dẫn vào từng case cụ thể. WakaTime cho biết mình đang dùng gì
                  nhiều. Phần manual giữ lại cách làm việc và soft skills không
                  thể tự động hóa hoàn toàn.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100">
                    <MousePointer2 size={15} />
                    Hover desktop hoac tap mobile de mo project evidence
                  </div>
                  <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/30 hover:text-white"
                  >
                    Mở project archive
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {data.overviewStats.map((stat) => (
                  <OverviewStatCard key={stat.label} stat={stat} />
                ))}
              </div>
            </div>
          </header>

          <div className="relative mt-8 grid gap-4 xl:grid-cols-3">
            <SourceStatusCard
              title="GitHub Signal"
              icon={Github}
              state={data.githubState}
            />
            <SourceStatusCard
              title="Project Archive"
              icon={FolderKanban}
              state={data.projectState}
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
                  description="Mỗi card ưu tiên tên skill, usage, số project va danh sach project evidence. Filter va sort dat ngay tren grid de tra cuu nhanh."
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
                  description="Tập trung vào project evidence tu GitHub repo, cho thay skill nao da duoc dung va dung trong nhung repo nao."
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
  const [activeFilter, setActiveFilter] = useState<SkillFilter>("all");
  const [sortBy, setSortBy] = useState<SkillSort>("most-used");

  if (items.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  const filterOptions = buildSkillFilterOptions(items);
  const filteredItems = sortSkillCards(
    items.filter((item) => activeFilter === "all" || item.category === activeFilter),
    sortBy,
  );

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              <ListFilter size={14} />
              Filter skills
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActiveFilter(option.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    activeFilter === option.value
                      ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100"
                      : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-cyan-400/25 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block min-w-[14rem]">
            <span className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              <ArrowDownWideNarrow size={14} />
              Sort skills
            </span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SkillSort)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-100 outline-none transition focus:border-cyan-400/40"
            >
              {SKILL_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Hiển thị {filteredItems.length}/{items.length} skills trong view này.
        </p>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <SkillSignalCard key={item.name} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState text="Không có skill nào khớp filter hiện tại." />
      )}
    </div>
  );
}

function SkillSignalCard({ item }: { item: SkillTechCard }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasEvidence = item.evidenceProjects.length > 0;
  const usageValue =
    item.usagePercent !== null
      ? `${item.usagePercent.toFixed(1)}%`
      : item.projectCount > 0
        ? "Project-backed"
        : "Usage-based";
  const usageDetail =
    item.usageText ??
    (item.projectCount > 0
      ? "Duoc chung minh bang project evidence."
      : "Dang cho them usage signal.");

  return (
    <div className="group relative" tabIndex={0}>
      <div className="h-full rounded-[1.5rem] border border-slate-800 bg-[linear-gradient(180deg,_rgba(8,20,38,0.98)_0%,_rgba(4,12,26,0.98)_100%)] p-5 transition duration-200 hover:border-cyan-400/25 hover:shadow-[0_18px_50px_-28px_rgba(34,211,238,0.38)] focus-within:border-cyan-400/25">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
            {item.categoryLabel}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-200">
            {item.sourceLabels.join(" + ")}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-black tracking-tight text-white">
            {item.name}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
        </div>

        <p className="mt-4 text-sm font-medium text-slate-200">
          {buildSkillSignalSummary(item)}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SignalMetric
            label="Usage"
            value={usageValue}
            description={usageDetail}
          />
          <SignalMetric
            label="Projects"
            value={`${item.projectCount}`}
            description={
              item.projectCount > 0
                ? `${item.projectCount} project evidence dang ho tro skill nay.`
                : "Chua co project evidence duoc map."
            }
          />
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
          {item.latestActivityLabel ? (
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-200">
              Active {item.latestActivityLabel}
            </span>
          ) : null}
          {hasEvidence ? (
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
              Hover de xem project evidence
            </span>
          ) : null}
          {!hasEvidence && item.usageText ? (
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
              Usage-only signal
            </span>
          ) : null}
        </div>

        {hasEvidence ? (
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/30 hover:text-white md:hidden"
          >
            {isExpanded ? "An project evidence" : "Xem project evidence"}
            <ArrowUpRight size={14} />
          </button>
        ) : null}
      </div>

      {hasEvidence ? (
        <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 hidden w-[min(24rem,calc(100vw-3rem))] translate-y-2 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 md:block">
          <EvidencePanel items={item.evidenceProjects} />
        </div>
      ) : null}

      {hasEvidence && isExpanded ? (
        <div className="mt-3 md:hidden">
          <EvidencePanel items={item.evidenceProjects} />
        </div>
      ) : null}
    </div>
  );
}

type SkillFilter = "all" | SkillCategory;
type SkillSort = "most-used" | "most-projects" | "recent" | "alphabetical";

const SKILL_SORT_OPTIONS: Array<{ value: SkillSort; label: string }> = [
  { value: "most-used", label: "Most used" },
  { value: "most-projects", label: "Most projects" },
  { value: "recent", label: "Recently active" },
  { value: "alphabetical", label: "Alphabetical" },
];

function buildSkillFilterOptions(
  items: SkillTechCard[],
): Array<{ value: SkillFilter; label: string }> {
  const filters = Array.from(
    new Map(items.map((item) => [item.category, item.categoryLabel])).entries(),
  );

  return [
    { value: "all" as const, label: "All" },
    ...filters.map(([value, label]) => ({
      value,
      label,
    })),
  ];
}

function sortSkillCards(items: SkillTechCard[], sortBy: SkillSort) {
  return [...items].sort((left, right) => {
    if (sortBy === "alphabetical") {
      return left.name.localeCompare(right.name);
    }

    if (sortBy === "recent") {
      if ((right.latestActivityAt ?? "") !== (left.latestActivityAt ?? "")) {
        return (right.latestActivityAt ?? "").localeCompare(
          left.latestActivityAt ?? "",
        );
      }

      if ((right.usagePercent ?? 0) !== (left.usagePercent ?? 0)) {
        return (right.usagePercent ?? 0) - (left.usagePercent ?? 0);
      }

      return right.projectCount - left.projectCount;
    }

    if (sortBy === "most-projects") {
      if (right.projectCount !== left.projectCount) {
        return right.projectCount - left.projectCount;
      }

      if ((right.usagePercent ?? 0) !== (left.usagePercent ?? 0)) {
        return (right.usagePercent ?? 0) - (left.usagePercent ?? 0);
      }

      return left.name.localeCompare(right.name);
    }

    if ((right.usagePercent ?? 0) !== (left.usagePercent ?? 0)) {
      return (right.usagePercent ?? 0) - (left.usagePercent ?? 0);
    }

    if (right.projectCount !== left.projectCount) {
      return right.projectCount - left.projectCount;
    }

    return left.name.localeCompare(right.name);
  });
}

function buildSkillSignalSummary(item: SkillTechCard) {
  const parts = [`${item.projectCount} ${item.projectCount === 1 ? "project" : "projects"}`];

  if (item.usageText) {
    parts.push(item.usageText);
  }

  parts.push(item.sourceLabels.join(" + "));

  return parts.join(" • ");
}

function SignalMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}

function EvidencePanel({ items }: { items: SkillEvidenceProject[] }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-700 bg-[#07101f] p-4 text-sm text-slate-200 shadow-2xl shadow-slate-950/50">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-100">
          <FolderKanban size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Project evidence
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Skill nay da duoc dung trong nhung project sau.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.slice(0, 6).map((project) => (
          <EvidenceProjectRow key={`${project.href}-${project.name}`} item={project} />
        ))}
      </div>

      {items.length > 6 ? (
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          +{items.length - 6} project evidence khac
        </p>
      ) : null}
    </div>
  );
}

function EvidenceProjectRow({ item }: { item: SkillEvidenceProject }) {
  const content = (
    <div className="rounded-[1.1rem] border border-slate-800 bg-slate-950/55 p-4 transition hover:border-cyan-400/25 hover:bg-slate-950/85">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{item.name}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
            {item.kindLabel}
          </p>
        </div>
        <ArrowUpRight size={15} className="shrink-0 text-slate-400" />
      </div>

      {item.supportingText ? (
        <p className="mt-2 text-xs text-slate-400">{item.supportingText}</p>
      ) : null}

      {item.description ? (
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {compactEvidenceText(item.description)}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {item.badges.map((badge) => (
          <span
            key={`${item.name}-${badge}`}
            className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-200"
          >
            {badge}
          </span>
        ))}
        {item.updatedAtLabel ? (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-100">
            Updated {item.updatedAtLabel}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (item.isExternal) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return <Link href={item.href}>{content}</Link>;
}

function compactEvidenceText(value: string) {
  return value.length <= 140 ? value : `${value.slice(0, 137)}...`;
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
