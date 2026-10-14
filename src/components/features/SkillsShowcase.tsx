"use client";

import Link from "next/link";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  ChevronDown,
  Clock3,
  FolderKanban,
  Github,
  Layers3,
  ListFilter,
  MousePointerClick,
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
import {
  Badge,
  ButtonLink,
  Card,
  Field,
  PageHeader,
  Select,
  buttonClasses,
  cn,
  type BadgeTone,
} from "@/components/ui";

type SkillsTab = "overview" | "github" | "wakatime";

const TABS: Array<{ value: SkillsTab; label: string }> = [
  { value: "overview", label: "Tổng quan" },
  { value: "github", label: "GitHub" },
  { value: "wakatime", label: "WakaTime" },
];

/** Display names for source labels (the raw values are used for sorting). */
const SOURCE_LABEL_DISPLAY: Record<string, string> = {
  Projects: "Kho tài liệu",
};

function formatSourceLabels(labels: string[]) {
  return labels.map((label) => SOURCE_LABEL_DISPLAY[label] ?? label).join(" + ");
}

interface SkillsShowcaseProps {
  data: SkillsPageData;
}

export function SkillsShowcase({ data }: SkillsShowcaseProps) {
  const [activeTab, setActiveTab] = useState<SkillsTab>("overview");
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabId = (value: SkillsTab) => `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel`;

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = TABS.findIndex((tab) => tab.value === activeTab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveTab(TABS[nextIndex].value);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="container-custom max-w-7xl py-10 sm:py-14">
      <PageHeader
        eyebrow="Kỹ năng"
        title="Kỹ năng thật từ dự án và thời gian làm việc"
        description="GitHub cho biết mình đã xây dựng gì. Kho tài liệu dẫn vào từng trường hợp cụ thể. WakaTime cho biết mình đang dùng gì nhiều. Phần khai báo thủ công giữ lại cách làm việc và kỹ năng mềm."
        actions={
          <ButtonLink
            href="/projects"
            variant="secondary"
            rightIcon={<ArrowRight size={16} aria-hidden="true" />}
          >
            Xem kho tài liệu
          </ButtonLink>
        }
      />

      <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
        <MousePointerClick size={16} className="shrink-0" aria-hidden="true" />
        Bấm “Xem minh chứng” trên mỗi thẻ kỹ năng để mở danh sách dự án liên
        quan.
      </p>

      {data.overviewStats.length > 0 ? (
        <section aria-label="Số liệu tổng quan" className="mt-8">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.overviewStats.map((stat) => (
              <OverviewStatCard key={stat.label} stat={stat} />
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby={`${baseId}-sources`} className="mt-8">
        <h2 id={`${baseId}-sources`} className="sr-only">
          Nguồn dữ liệu
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <SourceStatusCard
            title="GitHub"
            icon={Github}
            state={data.githubState}
          />
          <SourceStatusCard
            title="Kho tài liệu"
            icon={FolderKanban}
            state={data.projectState}
          />
          <SourceStatusCard
            title="WakaTime"
            icon={Activity}
            state={data.wakatimeState}
          />
        </div>
      </section>

      <div
        role="tablist"
        aria-label="Chế độ xem kỹ năng"
        className="mt-10 flex flex-wrap gap-1 border-b border-line"
      >
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={tabId(tab.value)}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.value)}
              onKeyDown={handleTabKeyDown}
              className={cn(
                "-mb-px inline-flex min-h-11 cursor-pointer items-center border-b-2 px-4 text-sm font-semibold transition-colors",
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(activeTab)}
        tabIndex={0}
        className="mt-8 space-y-10"
      >
        {activeTab === "overview" ? (
          <>
            <div className="space-y-5">
              <SectionHeader
                eyebrow="Công nghệ cốt lõi"
                title="Bộ công nghệ hợp nhất"
                description="Mỗi thẻ cho biết mức độ sử dụng, số dự án và danh sách minh chứng. Bộ lọc và sắp xếp đặt ngay trên lưới để tra cứu nhanh."
              />
              <SkillCardGrid
                items={data.coreTechStack}
                emptyText="Chưa đủ dữ liệu để dựng bộ công nghệ cốt lõi."
              />
            </div>

            <div className="grid gap-10 lg:grid-cols-2">
              <div className="space-y-5">
                <SectionHeader
                  eyebrow="Ngôn ngữ"
                  title="Ngôn ngữ dùng nhiều nhất"
                  description="Tổng hợp theo 30 ngày gần nhất từ WakaTime."
                />
                <LanguagePanel
                  items={data.mostUsedLanguages}
                  emptyText="Thêm WAKATIME_API_KEY để mở thống kê ngôn ngữ."
                />
              </div>

              <div className="space-y-5">
                <SectionHeader
                  eyebrow="Nhịp làm việc"
                  title="Hoạt động gần đây"
                  description="Tóm tắt nhanh cho tuần gần nhất."
                />
                <ActivityPanel
                  items={data.activityInsights}
                  emptyText="WakaTime chưa sẵn sàng nên chưa có dữ liệu nhịp làm việc."
                />
              </div>
            </div>

            <div className="space-y-5">
              <SectionHeader
                eyebrow="Công cụ và môi trường"
                title="Công cụ và môi trường"
                description="Gồm trình soạn thảo, hệ điều hành, công cụ triển khai và quản lý mã nguồn."
              />
              <ToolsGrid
                items={data.toolsAndEnvironment}
                emptyText="Chưa có đủ dữ liệu công cụ và môi trường."
              />
            </div>

            <div className="space-y-5">
              <SectionHeader
                eyebrow="Khai báo thủ công"
                title="Kỹ năng mềm"
                description="Nhóm này không lấy từ dữ liệu đo lường vì mục tiêu là phản ánh cách làm việc thay vì chỉ số sử dụng."
              />
              <SoftSkillsGrid items={data.softSkills} />
            </div>
          </>
        ) : null}

        {activeTab === "github" ? (
          <>
            <div className="space-y-5">
              <SectionHeader
                eyebrow="Dựa trên GitHub"
                title="Công nghệ theo dự án"
                description="Tập trung vào minh chứng từ các repo GitHub: kỹ năng nào đã được dùng và dùng trong những repo nào."
              />
              <SkillCardGrid
                items={data.githubTechStack}
                emptyText="GitHub chưa có repo đủ dữ liệu để phân tích."
              />
            </div>

            <div className="space-y-5">
              <SectionHeader
                eyebrow="Minh chứng từ repo"
                title="Repo nổi bật"
                description="Một vài repo gần đây được dùng để dựng bản đồ công nghệ. Mỗi thẻ hiển thị tag công nghệ phát hiện được từ repo."
              />
              <ProjectSpotlightGrid
                items={data.githubProjects}
                emptyText="Chưa có repo nổi bật để hiển thị."
              />
            </div>
          </>
        ) : null}

        {activeTab === "wakatime" ? (
          <>
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="space-y-5">
                <SectionHeader
                  eyebrow="Dựa trên WakaTime"
                  title="Tỷ trọng ngôn ngữ"
                  description="Tỷ trọng ngôn ngữ lập trình trong 30 ngày gần nhất."
                />
                <LanguagePanel
                  items={data.mostUsedLanguages}
                  emptyText="WakaTime chưa sẵn sàng nên chưa có tỷ trọng ngôn ngữ."
                />
              </div>

              <div className="space-y-5">
                <SectionHeader
                  eyebrow="Nhịp làm việc"
                  title="Nhịp viết code"
                  description="Tín hiệu hoạt động gần đây để thấy thói quen làm việc thực tế."
                />
                <ActivityPanel
                  items={data.activityInsights}
                  emptyText="WakaTime chưa sẵn sàng nên chưa có dữ liệu nhịp làm việc."
                />
              </div>
            </div>

            <div className="space-y-5">
              <SectionHeader
                eyebrow="Trình soạn thảo / Hệ điều hành / Công cụ"
                title="Môi trường đang dùng"
                description="Kết hợp trình soạn thảo, hệ điều hành từ WakaTime với tín hiệu triển khai và công cụ từ GitHub."
              />
              <ToolsGrid
                items={data.toolsAndEnvironment}
                emptyText="Chưa có dữ liệu công cụ và môi trường."
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function OverviewStatCard({ stat }: { stat: SkillsOverviewStat }) {
  return (
    <Card as="li" padding="sm">
      <p className="text-sm font-medium text-muted">{stat.label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-ink">
        {stat.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">{stat.description}</p>
    </Card>
  );
}

const SOURCE_STATUS_TONE: Record<SkillsSourceState["status"], BadgeTone> = {
  ready: "success",
  "needs-config": "warn",
  empty: "neutral",
  error: "danger",
};

function SourceStatusCard({
  title,
  icon: Icon,
  state,
}: {
  title: string;
  icon: typeof Github;
  state: SkillsSourceState;
}) {
  return (
    <Card padding="sm">
      <div className="flex items-start gap-3">
        <div
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
          aria-hidden="true"
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            <Badge tone={SOURCE_STATUS_TONE[state.status]}>{state.label}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted wrap-anywhere">
            {state.description}
          </p>
        </div>
      </div>
    </Card>
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
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
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
  const sortId = useId();
  const filterLabelId = useId();

  if (items.length === 0) {
    return <EmptyNote text={emptyText} />;
  }

  const filterOptions = buildSkillFilterOptions(items);
  const filteredItems = sortSkillCards(
    items.filter((item) => activeFilter === "all" || item.category === activeFilter),
    sortBy,
  );

  return (
    <div className="space-y-5">
      <Card padding="sm" muted>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div role="group" aria-labelledby={filterLabelId}>
            <p
              id={filterLabelId}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink"
            >
              <ListFilter size={16} aria-hidden="true" />
              Lọc theo nhóm
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {filterOptions.map((option) => {
                const isActive = activeFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveFilter(option.value)}
                    className={cn(
                      "inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-sm font-medium transition-colors",
                      isActive
                        ? "border-accent bg-accent text-on-accent"
                        : "border-line-strong bg-surface text-ink hover:bg-sunken",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Field htmlFor={sortId} label="Sắp xếp" className="lg:min-w-56">
            <Select
              id={sortId}
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SkillSort)}
            >
              {SKILL_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <p className="mt-4 text-sm text-muted" aria-live="polite">
          Hiển thị {filteredItems.length}/{items.length} kỹ năng.
        </p>
      </Card>

      {filteredItems.length > 0 ? (
        <ul className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <li key={item.name}>
              <SkillSignalCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote text="Không có kỹ năng nào khớp bộ lọc hiện tại." />
      )}
    </div>
  );
}

function SkillSignalCard({ item }: { item: SkillTechCard }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const evidencePanelId = useId();
  const hasEvidence = item.evidenceProjects.length > 0;
  const githubHref = item.primaryGithubHref;
  const usageValue =
    item.usagePercent !== null
      ? `${item.usagePercent.toFixed(1)}%`
      : item.projectCount > 0
        ? "Theo dự án"
        : "Theo thời gian dùng";
  const usageDetail =
    item.usageText ??
    (item.projectCount > 0
      ? "Được chứng minh bằng dự án thực tế."
      : "Đang chờ thêm dữ liệu sử dụng.");

  return (
    <Card as="article" padding="sm" className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{item.categoryLabel}</Badge>
          <Badge>{formatSourceLabels(item.sourceLabels)}</Badge>
        </div>

        {githubHref ? (
          <a
            href={githubHref}
            target="_blank"
            rel="noreferrer"
            aria-label={`Mở GitHub cho ${item.name} (tab mới)`}
            className={buttonClasses({
              variant: "ghost",
              size: "sm",
              className: "px-2",
            })}
          >
            <Github size={16} aria-hidden="true" />
            GitHub
          </a>
        ) : null}
      </div>

      <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">
        {item.name}
      </h3>
      <p className="mt-1 text-sm leading-6 text-muted">{item.summary}</p>

      <p className="mt-3 text-sm font-medium text-ink">
        {buildSkillSignalSummary(item)}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <SignalMetric
          label="Mức sử dụng"
          value={usageValue}
          description={usageDetail}
        />
        <SignalMetric
          label="Dự án"
          value={`${item.projectCount}`}
          description={
            item.projectCount > 0
              ? `${item.projectCount} dự án làm minh chứng cho kỹ năng này.`
              : "Chưa có dự án minh chứng."
          }
        />
      </dl>

      {item.usagePercent !== null ? (
        <div className="mt-4" aria-hidden="true">
          <div className="h-2 rounded-full bg-sunken">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${Math.min(item.usagePercent, 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      {item.latestActivityLabel || (!hasEvidence && item.usageText) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.latestActivityLabel ? (
            <Badge>Hoạt động {item.latestActivityLabel}</Badge>
          ) : null}
          {!hasEvidence && item.usageText ? (
            <Badge tone="warn">Chỉ có dữ liệu thời gian dùng</Badge>
          ) : null}
        </div>
      ) : null}

      {hasEvidence ? (
        <div className="mt-4 border-t border-line pt-3">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={evidencePanelId}
            onClick={() => setIsExpanded((value) => !value)}
            className={buttonClasses({
              variant: "secondary",
              size: "sm",
              fullWidth: true,
              className: "justify-between",
            })}
          >
            <span>
              {isExpanded ? "Ẩn minh chứng" : "Xem minh chứng"} (
              {item.evidenceProjects.length})
            </span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={cn(
                "transition-transform duration-150",
                isExpanded && "rotate-180",
              )}
            />
          </button>

          <div id={evidencePanelId} hidden={!isExpanded} className="mt-3">
            {isExpanded ? (
              <EvidencePanel items={item.evidenceProjects} />
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

type SkillFilter = "all" | SkillCategory;
type SkillSort = "most-used" | "most-projects" | "recent" | "alphabetical";

const SKILL_SORT_OPTIONS: Array<{ value: SkillSort; label: string }> = [
  { value: "most-used", label: "Dùng nhiều nhất" },
  { value: "most-projects", label: "Nhiều dự án nhất" },
  { value: "recent", label: "Hoạt động gần đây" },
  { value: "alphabetical", label: "Theo bảng chữ cái" },
];

function buildSkillFilterOptions(
  items: SkillTechCard[],
): Array<{ value: SkillFilter; label: string }> {
  const filters = Array.from(
    new Map(items.map((item) => [item.category, item.categoryLabel])).entries(),
  );

  return [
    { value: "all" as const, label: "Tất cả" },
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
  const parts = [`${item.projectCount} dự án`];

  if (item.usageText) {
    parts.push(item.usageText);
  }

  parts.push(formatSourceLabels(item.sourceLabels));

  return parts.join(" · ");
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
    <div className="rounded-lg bg-sunken p-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1">
        <span className="block font-mono text-lg font-semibold text-ink">
          {value}
        </span>
        <span className="mt-1 block text-sm leading-5 text-muted">
          {description}
        </span>
      </dd>
    </div>
  );
}

function EvidencePanel({ items }: { items: SkillEvidenceProject[] }) {
  return (
    <div className="text-sm">
      <p className="text-sm text-muted">
        Kỹ năng này đã được dùng trong những dự án sau.
      </p>

      <ul className="mt-3 space-y-2">
        {items.slice(0, 6).map((project) => (
          <li key={`${project.href}-${project.name}`}>
            <EvidenceProjectRow item={project} />
          </li>
        ))}
      </ul>

      {items.length > 6 ? (
        <p className="mt-3 text-sm text-muted">
          Và {items.length - 6} dự án minh chứng khác.
        </p>
      ) : null}
    </div>
  );
}

function EvidenceProjectRow({ item }: { item: SkillEvidenceProject }) {
  const content = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-semibold text-ink">{item.name}</span>
          <span className="mt-0.5 block text-xs font-medium text-accent">
            {item.kindLabel}
          </span>
        </span>
        <ArrowUpRight
          size={16}
          className="shrink-0 text-muted"
          aria-hidden="true"
        />
      </span>

      {item.supportingText ? (
        <span className="mt-1 block text-sm text-muted">
          {item.supportingText}
        </span>
      ) : null}

      {item.description ? (
        <span className="mt-2 block text-sm leading-6 text-muted">
          {compactEvidenceText(item.description)}
        </span>
      ) : null}

      {item.badges.length > 0 || item.updatedAtLabel ? (
        <span className="mt-2 flex flex-wrap gap-1.5">
          {item.badges.map((badge) => (
            <Badge key={`${item.name}-${badge}`}>{badge}</Badge>
          ))}
          {item.updatedAtLabel ? (
            <Badge tone="success">Cập nhật {item.updatedAtLabel}</Badge>
          ) : null}
        </span>
      ) : null}
    </>
  );

  const rowClass =
    "block cursor-pointer rounded-lg border border-line bg-surface p-3 transition-colors hover:border-line-strong hover:bg-sunken";

  if (item.isExternal) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={rowClass}>
        {content}
        <span className="sr-only"> (mở tab mới)</span>
      </a>
    );
  }

  return (
    <Link href={item.href} className={rowClass}>
      {content}
    </Link>
  );
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
    return <EmptyNote text={emptyText} />;
  }

  return (
    <Card padding="sm">
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.name}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2 text-ink">
                <BarChart3
                  size={16}
                  className="text-accent"
                  aria-hidden="true"
                />
                <span className="font-semibold">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-semibold text-ink">
                  {item.percent.toFixed(1)}%
                </span>
                <span className="ml-2 text-muted">{item.usageText}</span>
              </div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-sunken" aria-hidden="true">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${Math.min(item.percent, 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
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
    return <EmptyNote text={emptyText} />;
  }

  const icons = [Clock3, TimerReset, Layers3] as const;

  return (
    <ul className="grid gap-3">
      {items.map((item, index) => {
        const Icon = icons[index] ?? Clock3;

        return (
          <Card as="li" padding="sm" key={item.label}>
            <div className="flex items-start gap-3">
              <div
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
                aria-hidden="true"
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted">{item.label}</p>
                <p className="mt-1 break-words font-mono text-xl font-semibold text-ink">
                  {item.value}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </ul>
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
    return <EmptyNote text={emptyText} />;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card as="li" padding="sm" key={item.name}>
          <div className="flex items-center gap-3">
            <div
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
              aria-hidden="true"
            >
              <Wrench size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-ink">{item.name}</h3>
              <p className="text-sm text-muted">{item.category}</p>
            </div>
          </div>

          {item.projectCount > 0 || item.usageText ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.projectCount > 0 ? (
                <Badge>{item.projectCount} dự án</Badge>
              ) : null}
              {item.usageText ? (
                <Badge tone="success">{item.usageText}</Badge>
              ) : null}
            </div>
          ) : null}

          <p className="mt-3 text-sm leading-6 text-muted">{item.detail}</p>
        </Card>
      ))}
    </ul>
  );
}

function SoftSkillsGrid({ items }: { items: SkillsSoftSkill[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card as="li" padding="sm" key={item.name}>
          <div className="flex items-center gap-3">
            <div
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warn-soft text-warn"
              aria-hidden="true"
            >
              <BookOpenCheck size={18} />
            </div>
            <h3 className="text-base font-semibold text-ink">{item.name}</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            {item.description}
          </p>
        </Card>
      ))}
    </ul>
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
    return <EmptyNote text={emptyText} />;
  }

  return (
    <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card as="li" padding="sm" key={item.name} interactive>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-ink">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 break-all transition-colors hover:text-accent"
                >
                  {item.name}
                  <ArrowUpRight size={16} aria-hidden="true" />
                  <span className="sr-only"> (mở tab mới)</span>
                </a>
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                {item.description || "Repo này chưa có mô tả."}
              </p>
            </div>
            <Badge className="shrink-0">{item.updatedAtLabel}</Badge>
          </div>

          {item.primaryLanguage || item.homepageUrl ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {item.primaryLanguage ? (
                <Badge tone="accent">{item.primaryLanguage}</Badge>
              ) : null}
              {item.homepageUrl ? (
                <a
                  href={item.homepageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  Bản triển khai
                  <ArrowUpRight size={14} aria-hidden="true" />
                  <span className="sr-only"> (mở tab mới)</span>
                </a>
              ) : null}
            </div>
          ) : null}

          {item.techNames.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.techNames.slice(0, 6).map((tech) => (
                <Badge key={`${item.name}-${tech}`}>{tech}</Badge>
              ))}
            </div>
          ) : null}
        </Card>
      ))}
    </ul>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-line-strong bg-surface px-5 py-6 text-sm leading-6 text-muted">
      {text}
    </p>
  );
}
